// ═══════════════════════════════════════════════════════════════════════════
// PENTAD SYMBOL - Floating mythological symbol (boon, bane, bone, bonk, honk)
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { PhysicsComponent } from '../../core/Component.js';
import { COLORS, hexToRgb } from '../../config/colors.js';

const SYMBOLS = {
  boon: '!',
  bane: '~',
  bone: '^',
  bonk: '<>',
  honk: '?'
};

const SYMBOL_COLORS = {
  boon: COLORS.boon,
  bane: COLORS.bane,
  bone: COLORS.bone,
  bonk: COLORS.bonk,
  honk: COLORS.honk
};

export class PentadSymbol extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['particle', 'pentad', 'symbol', ...(config.tags || [])]
    });

    this.layer = 'effects';

    // Add slow drifting physics
    this.addComponent('physics', new PhysicsComponent({
      velocity: {
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4
      },
      friction: 1.0
    }));

    // Symbol properties
    this.type = config.type || 'boon';
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.02;
    this.size = config.size || (12 + Math.random() * 12);
    this.opacity = config.opacity || (0.2 + Math.random() * 0.3);
    this.pulseOffset = Math.random() * Math.PI * 2;
    this.colorRgb = hexToRgb(SYMBOL_COLORS[this.type]); // Pre-cache RGB

    // Position
    if (config.x !== undefined) this.transform.x = config.x;
    else this.transform.x = Math.random() * (config.width || 800);
    if (config.y !== undefined) this.transform.y = config.y;
    else this.transform.y = Math.random() * (config.height || 600);
  }

  onUpdate(ctx, dt) {
    this.rotation += this.rotSpeed;

    // Wrap around with padding
    if (this.transform.x < -50) this.transform.x = ctx.width + 50;
    if (this.transform.x > ctx.width + 50) this.transform.x = -50;
    if (this.transform.y < -50) this.transform.y = ctx.height + 50;
    if (this.transform.y > ctx.height + 50) this.transform.y = -50;
  }

  onRender(ctx) {
    const p = ctx.p5;
    const symbol = SYMBOLS[this.type];
    const rgb = this.colorRgb; // Use pre-cached RGB

    const pulse = 0.8 + Math.sin(ctx.time.total + this.pulseOffset) * 0.2;

    p.push();
    p.translate(this.transform.x, this.transform.y);
    p.rotate(this.rotation);

    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(this.size);
    p.fill(rgb.r, rgb.g, rgb.b, this.opacity * pulse * this.transform.alpha * 255);
    p.text(symbol, 0, 0);

    p.pop();
  }
}

// Export symbol types for easy access
export { SYMBOLS, SYMBOL_COLORS };
