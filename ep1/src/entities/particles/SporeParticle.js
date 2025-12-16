// ═══════════════════════════════════════════════════════════════════════════
// SPORE PARTICLE - Drifting fungal spore with pulsing glow
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { COLORS, hexToRgb } from '../../config/colors.js';

export class SporeParticle extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['particle', 'spore', ...(config.tags || [])]
    });

    this.layer = 'particles';

    // Spore properties
    this.size = config.size || (2 + Math.random() * 3);
    this.speed = config.speed || (0.1 + Math.random() * 0.2);
    this.offset = Math.random() * 1000;
    this.pulseOffset = Math.random() * Math.PI * 2;
    this.colorRgb = hexToRgb(COLORS.pink); // Pre-cache RGB

    // Position
    if (config.x !== undefined) this.transform.x = config.x;
    else this.transform.x = Math.random() * (config.width || 800);
    if (config.y !== undefined) this.transform.y = config.y;
    else this.transform.y = Math.random() * (config.height || 600);
  }

  onUpdate(ctx, dt) {
    const p = ctx.p5;

    // Noise-based movement
    const n = p.noise(this.transform.x * 0.005 + this.offset, this.transform.y * 0.005, ctx.time.total * 0.1);
    const angle = n * p.TWO_PI * 2;

    this.transform.x += Math.cos(angle) * this.speed;
    this.transform.y += Math.sin(angle) * this.speed - 0.1; // Slight upward drift

    // Wrap around
    if (this.transform.x < 0) this.transform.x = ctx.width;
    if (this.transform.x > ctx.width) this.transform.x = 0;
    if (this.transform.y < 0) this.transform.y = ctx.height;
    if (this.transform.y > ctx.height) this.transform.y = 0;
  }

  onRender(ctx) {
    const p = ctx.p5;
    const pulse = 0.5 + Math.sin(ctx.time.total * 2 + this.pulseOffset) * 0.3;
    const rgb = this.colorRgb; // Use pre-cached RGB

    p.noStroke();
    p.fill(rgb.r, rgb.g, rgb.b, pulse * this.transform.alpha * 150);
    p.ellipse(this.transform.x, this.transform.y, this.size * (0.8 + pulse * 0.4));
  }
}
