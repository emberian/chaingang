// ═══════════════════════════════════════════════════════════════════════════
// SCATTER BEHAVIOR - Entities scatter when mouse moves fast
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';
import { distance } from '../../utils/math.js';

export class ScatterBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.speedThreshold = config.speedThreshold || 20;  // Mouse speed to trigger scatter
    this.radius = config.radius || 150;                  // Effect radius
    this.scatterForce = config.scatterForce || 4;       // Initial scatter force
    this.returnSpeed = config.returnSpeed || 0.03;      // How fast to return to base
    this.trackBase = config.trackBase !== false;        // Track original position

    // Per-entity state
    this.basePositions = new WeakMap();
    this.isScattered = new WeakMap();
    this.scatterVelocity = new WeakMap();
  }

  onAttach(entity) {
    // Store base position when attached
    if (this.trackBase) {
      this.basePositions.set(entity, {
        x: entity.transform.x,
        y: entity.transform.y
      });
    }
    this.isScattered.set(entity, false);
    this.scatterVelocity.set(entity, { x: 0, y: 0 });
  }

  onUpdate(entity, ctx, dt) {
    const transform = entity.transform;
    const pos = entity.getWorldPosition();

    const mouseSpeedSq = ctx.input.mouseVel.x ** 2 + ctx.input.mouseVel.y ** 2;
    const isScattered = this.isScattered.get(entity);
    let scatterVel = this.scatterVelocity.get(entity);

    // Check if should scatter
    if (mouseSpeedSq > this.speedThreshold ** 2) {
      const dist = distance(ctx.input.mouseX, ctx.input.mouseY, pos.x, pos.y);

      if (dist < this.radius) {
        // Trigger scatter
        this.isScattered.set(entity, true);

        // Calculate scatter direction (away from mouse)
        const angle = Math.atan2(pos.y - ctx.input.mouseY, pos.x - ctx.input.mouseX);
        scatterVel.x = Math.cos(angle) * this.scatterForce;
        scatterVel.y = Math.sin(angle) * this.scatterForce;
      }
    }

    // Apply scatter velocity
    if (this.isScattered.get(entity)) {
      transform.x += scatterVel.x;
      transform.y += scatterVel.y;

      // Decay velocity
      scatterVel.x *= 0.94;
      scatterVel.y *= 0.94;

      // Return to base position
      if (this.trackBase) {
        const base = this.basePositions.get(entity);
        if (base) {
          transform.x += (base.x - transform.x) * this.returnSpeed;
          transform.y += (base.y - transform.y) * this.returnSpeed;

          // Check if returned
          const distToBase = distance(transform.x, transform.y, base.x, base.y);
          if (distToBase < 2 && Math.abs(scatterVel.x) < 0.1 && Math.abs(scatterVel.y) < 0.1) {
            this.isScattered.set(entity, false);
          }
        }
      }
    }
  }

  // Update base position (call when entity should track new position)
  setBasePosition(entity, x, y) {
    this.basePositions.set(entity, { x, y });
  }
}
