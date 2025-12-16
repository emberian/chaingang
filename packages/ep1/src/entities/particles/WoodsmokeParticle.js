// ═══════════════════════════════════════════════════════════════════════════
// WOODSMOKE PARTICLE - Rising smoke that expands and fades
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { PhysicsComponent, LifespanComponent } from '../../core/Component.js';
import { COLORS, hexToRgb } from '../../config/colors.js';

export class WoodsmokeParticle extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['particle', 'smoke', ...(config.tags || [])]
    });

    this.layer = 'particles';

    // Add physics - slow upward drift
    this.addComponent('physics', new PhysicsComponent({
      velocity: {
        x: (Math.random() - 0.5) * 0.6,
        y: -(0.5 + Math.random() * 0.7)
      },
      friction: 1.0
    }));

    // Add lifespan
    const maxLife = 3 + Math.random() * 3;
    this.addComponent('lifespan', new LifespanComponent({
      maxLife: maxLife,
      fadeOut: 0.7
    }));

    // Smoke properties
    this.size = config.size || (15 + Math.random() * 25);
    this.wobbleOffset = Math.random() * 1000;
    this.expansionRate = 5;

    // Position
    if (config.x !== undefined) this.transform.x = config.x;
    if (config.y !== undefined) this.transform.y = config.y;
  }

  onUpdate(ctx, dt) {
    const physics = this.getComponent('physics');

    // Wobble
    physics.velocity.x += Math.sin(ctx.time.total * 0.5 + this.wobbleOffset) * 0.01;

    // Expand over time
    this.size += dt * this.expansionRate;
  }

  onRender(ctx) {
    const p = ctx.p5;
    const lifespan = this.getComponent('lifespan');
    const life = lifespan ? lifespan.life / lifespan.maxLife : 1;
    const rgb = hexToRgb(COLORS.woodsmoke);

    p.noStroke();
    p.fill(rgb.r, rgb.g, rgb.b, life * this.transform.alpha * 0.15 * 255);
    p.ellipse(this.transform.x, this.transform.y, this.size);
  }
}
