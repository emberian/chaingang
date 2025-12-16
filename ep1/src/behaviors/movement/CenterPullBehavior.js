// ═══════════════════════════════════════════════════════════════════════════
// CENTER PULL BEHAVIOR - Gravitational pull toward a point
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';

export class CenterPullBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    // Strength can be a number or function (ctx) => number
    this.strength = config.strength || 0.001;
    // Target can be { x, y }, 'center', 'mouse', or function (ctx) => { x, y }
    this.target = config.target || 'center';
  }

  onUpdate(entity, ctx, dt) {
    const physics = entity.getComponent('physics');
    if (!physics) return;

    const transform = entity.transform;

    // Resolve target position
    let targetX, targetY;
    if (this.target === 'center') {
      targetX = ctx.width / 2;
      targetY = ctx.height / 2;
    } else if (this.target === 'mouse') {
      targetX = ctx.input.mouseX;
      targetY = ctx.input.mouseY;
    } else if (typeof this.target === 'function') {
      const pos = this.target(ctx);
      targetX = pos.x;
      targetY = pos.y;
    } else {
      targetX = this.target.x;
      targetY = this.target.y;
    }

    // Resolve strength
    const strength = typeof this.strength === 'function'
      ? this.strength(ctx)
      : this.strength;

    // Calculate pull direction
    const dx = targetX - transform.x;
    const dy = targetY - transform.y;

    // Apply force toward target
    physics.applyForce(dx * strength, dy * strength);
  }
}
