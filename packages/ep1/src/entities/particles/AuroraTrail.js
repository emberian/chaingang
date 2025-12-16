// ═══════════════════════════════════════════════════════════════════════════
// AURORA TRAIL - Fading color-shifting trail particle
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { LifespanComponent } from '../../core/Component.js';

export class AuroraTrail extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['particle', 'aurora', ...(config.tags || [])]
    });

    this.layer = 'effects';

    // Add lifespan
    this.addComponent('lifespan', new LifespanComponent({
      maxLife: 0.67,
      fadeOut: 1.0
    }));

    // Aurora properties - hue shifts with time
    this.baseHue = config.hue || 180;

    // Position
    if (config.x !== undefined) this.transform.x = config.x;
    if (config.y !== undefined) this.transform.y = config.y;
  }

  onRender(ctx) {
    const p = ctx.p5;
    const lifespan = this.getComponent('lifespan');
    const life = lifespan ? lifespan.life / lifespan.maxLife : 1;

    // Hue shifts over time
    const hue = this.baseHue + Math.sin(ctx.time.total) * 50;
    const size = life * 30;

    p.noStroke();
    // Use HSL for aurora effect
    p.drawingContext.fillStyle = `hsla(${hue}, 70%, 60%, ${life * this.transform.alpha * 0.3})`;
    p.ellipse(this.transform.x, this.transform.y, size);
  }
}
