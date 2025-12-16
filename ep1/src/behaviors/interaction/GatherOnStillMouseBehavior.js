// ═══════════════════════════════════════════════════════════════════════════
// GATHER ON STILL MOUSE BEHAVIOR - Entities gather around still cursor
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';
import { distance, map } from '../../utils/math.js';

export class GatherOnStillMouseBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.stillnessThreshold = config.stillnessThreshold || 1; // Seconds before gathering starts
    this.maxStillness = config.maxStillness || 3;             // Seconds for full strength
    this.radius = config.radius || 150;                        // Gathering radius
    this.strength = config.strength || 0.02;                   // Gathering strength
  }

  shouldApply(entity, ctx) {
    return super.shouldApply(entity, ctx) &&
           ctx.input.mouseStillTime > this.stillnessThreshold;
  }

  onUpdate(entity, ctx, dt) {
    const physics = entity.getComponent('physics');
    if (!physics) return;

    const pos = entity.getWorldPosition();
    const dist = distance(ctx.input.mouseX, ctx.input.mouseY, pos.x, pos.y);

    if (dist < this.radius && dist > 5) {
      // Strength increases with stillness duration
      const stillnessFactor = map(
        ctx.input.mouseStillTime,
        this.stillnessThreshold,
        this.maxStillness,
        0, 1,
        true
      );

      // Direction toward mouse
      const dx = ctx.input.mouseX - pos.x;
      const dy = ctx.input.mouseY - pos.y;

      // Apply gathering force
      const force = this.strength * stillnessFactor;
      physics.applyForce(dx * force, dy * force);
    }
  }
}
