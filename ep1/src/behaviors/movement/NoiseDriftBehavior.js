// ═══════════════════════════════════════════════════════════════════════════
// NOISE DRIFT BEHAVIOR - Perlin noise-based organic movement
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';

export class NoiseDriftBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.scale = config.scale || 0.003;      // Noise scale (smaller = smoother)
    this.speed = config.speed || 1;          // Movement speed multiplier
    this.timeScale = config.timeScale || 0.2; // How fast noise evolves
    this.offset = Math.random() * 1000;       // Unique offset per entity
  }

  onUpdate(entity, ctx, dt) {
    const physics = entity.getComponent('physics');
    if (!physics) return;

    const p5 = ctx.p5;
    const transform = entity.transform;

    // Sample noise at entity position
    const n = p5.noise(
      transform.x * this.scale + this.offset,
      transform.y * this.scale,
      ctx.time.total * this.timeScale
    );

    // Convert noise to angle (0-1 -> 0-2PI)
    const angle = n * Math.PI * 2 * 2; // Extra rotation for more variation

    // Apply force in noise direction
    const force = this.speed;
    physics.applyForce(
      Math.cos(angle) * force,
      Math.sin(angle) * force
    );
  }
}
