// ═══════════════════════════════════════════════════════════════════════════
// ORBIT BEHAVIOR - Circular/elliptical orbital movement
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';

export class OrbitBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.centerX = config.centerX || null;   // null = canvas center
    this.centerY = config.centerY || null;
    this.radius = config.radius || 100;
    this.radiusY = config.radiusY || null;   // null = same as radius (circle)
    this.speed = config.speed || 1;          // Radians per second
    this.angle = config.initialAngle || Math.random() * Math.PI * 2;
    this.wobble = config.wobble || 0;        // Random wobble amount
    this.wobbleSpeed = config.wobbleSpeed || 2;
  }

  onAttach(entity) {
    // Store initial angle if entity already has position
    if (entity.transform) {
      // Could calculate initial angle from position here
    }
  }

  onUpdate(entity, ctx, dt) {
    const transform = entity.transform;

    // Update angle
    this.angle += this.speed * dt;

    // Resolve center
    const cx = this.centerX !== null ? this.centerX : ctx.width / 2;
    const cy = this.centerY !== null ? this.centerY : ctx.height / 2;

    // Calculate radius with optional wobble
    const wobbleOffset = this.wobble > 0
      ? Math.sin(ctx.time.total * this.wobbleSpeed) * this.wobble
      : 0;

    const rx = this.radius + wobbleOffset;
    const ry = (this.radiusY || this.radius) + wobbleOffset;

    // Set position
    transform.x = cx + Math.cos(this.angle) * rx;
    transform.y = cy + Math.sin(this.angle) * ry;
  }
}
