// ═══════════════════════════════════════════════════════════════════════════
// INK SPRAY - Fast-moving ink particle expelled on rapid mouse movement
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { PhysicsComponent, LifespanComponent } from '../../core/Component.js';
import { COLORS, hexToRgb } from '../../config/colors.js';

export class InkSpray extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['particle', 'ink', ...(config.tags || [])]
    });

    this.layer = 'effects';

    // Add physics with initial velocity
    this.addComponent('physics', new PhysicsComponent({
      velocity: {
        x: (config.vx || 0) + (Math.random() - 0.5) * 4,
        y: (config.vy || 0) + (Math.random() - 0.5) * 4
      },
      friction: 0.96
    }));

    // Add lifespan
    this.addComponent('lifespan', new LifespanComponent({
      maxLife: 1.25,
      fadeOut: 0.8
    }));

    // Ink properties
    this.size = config.size || (5 + Math.random() * 10);
    this.color = config.color || (Math.random() < 0.5 ? COLORS.violet : COLORS.indigo);

    // Position
    if (config.x !== undefined) this.transform.x = config.x;
    if (config.y !== undefined) this.transform.y = config.y;
  }

  onRender(ctx) {
    const p = ctx.p5;
    const lifespan = this.getComponent('lifespan');
    const life = lifespan ? lifespan.life / lifespan.maxLife : 1;
    const rgb = hexToRgb(this.color);

    p.noStroke();
    p.fill(rgb.r, rgb.g, rgb.b, life * this.transform.alpha * 0.5 * 255);
    p.ellipse(this.transform.x, this.transform.y, this.size * life);
  }
}
