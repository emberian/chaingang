// ═══════════════════════════════════════════════════════════════════════════
// WRAP BOUNDS BEHAVIOR - Wrap entity position at canvas edges
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';

export class WrapBoundsBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.margin = config.margin || 0;  // Extra margin beyond canvas
  }

  onUpdate(entity, ctx, dt) {
    const transform = entity.transform;
    const margin = this.margin;

    // Wrap horizontally
    if (transform.x < -margin) {
      transform.x = ctx.width + margin;
    } else if (transform.x > ctx.width + margin) {
      transform.x = -margin;
    }

    // Wrap vertically
    if (transform.y < -margin) {
      transform.y = ctx.height + margin;
    } else if (transform.y > ctx.height + margin) {
      transform.y = -margin;
    }
  }
}
