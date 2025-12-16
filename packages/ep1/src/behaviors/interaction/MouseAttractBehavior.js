// ═══════════════════════════════════════════════════════════════════════════
// MOUSE ATTRACT BEHAVIOR - Entities attracted to mouse cursor
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';
import { distance } from '../../utils/math.js';

export class MouseAttractBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.radius = config.radius || 200;      // Effect radius
    this.strength = config.strength || 0.02; // Force strength
    this.maxForce = config.maxForce || 5;    // Maximum force applied
  }

  onUpdate(entity, ctx, dt) {
    const physics = entity.getComponent('physics');
    if (!physics) return;

    const pos = entity.getWorldPosition();

    // Calculate distance to mouse
    const dist = distance(ctx.input.mouseX, ctx.input.mouseY, pos.x, pos.y);

    if (dist < this.radius && dist > 1) {
      // Direction toward mouse
      const dx = ctx.input.mouseX - pos.x;
      const dy = ctx.input.mouseY - pos.y;

      // Normalize and scale by strength
      let forceX = (dx / dist) * this.strength * dist;
      let forceY = (dy / dist) * this.strength * dist;

      // Clamp to max force
      const forceMag = Math.sqrt(forceX * forceX + forceY * forceY);
      if (forceMag > this.maxForce) {
        const scale = this.maxForce / forceMag;
        forceX *= scale;
        forceY *= scale;
      }

      physics.applyForce(forceX, forceY);
    }
  }
}
