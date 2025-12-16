// ═══════════════════════════════════════════════════════════════════════════
// MOUSE REPEL BEHAVIOR - Entities flee from mouse cursor
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';
import { distance } from '../../utils/math.js';

export class MouseRepelBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.radius = config.radius || 200;      // Effect radius
    this.strength = config.strength || 3;    // Force strength
    this.easing = config.easing || 'linear'; // How force falls off with distance
  }

  onUpdate(entity, ctx, dt) {
    const physics = entity.getComponent('physics');
    if (!physics) return;

    const transform = entity.transform;
    const pos = entity.getWorldPosition();

    // Calculate distance to mouse
    const dist = distance(ctx.input.mouseX, ctx.input.mouseY, pos.x, pos.y);

    if (dist < this.radius && dist > 0) {
      // Calculate repel angle (away from mouse)
      const angle = Math.atan2(
        pos.y - ctx.input.mouseY,
        pos.x - ctx.input.mouseX
      );

      // Calculate force based on distance (closer = stronger)
      let t = 1 - (dist / this.radius);

      // Apply easing
      switch (this.easing) {
        case 'quadratic':
          t = t * t;
          break;
        case 'cubic':
          t = t * t * t;
          break;
        case 'sqrt':
          t = Math.sqrt(t);
          break;
        // 'linear' is default
      }

      const force = t * this.strength;

      // Apply repulsion force
      physics.applyForce(
        Math.cos(angle) * force,
        Math.sin(angle) * force
      );
    }
  }
}
