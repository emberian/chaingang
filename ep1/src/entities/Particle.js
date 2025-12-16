// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE ENTITY - Generic particle with composable behaviors
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../core/Entity.js';
import { PhysicsComponent, VisualComponent, LifespanComponent } from '../core/Component.js';
import { COLORS } from '../config/colors.js';

export class Particle extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['particle', ...(config.tags || [])]
    });

    this.layer = config.layer || 'particles';

    // Add physics component
    this.addComponent('physics', new PhysicsComponent({
      velocity: config.velocity || { x: 0, y: 0 },
      friction: config.friction !== undefined ? config.friction : 0.99
    }));

    // Add visual component
    this.addComponent('visual', new VisualComponent({
      shape: config.shape || 'ellipse',
      color: config.color || COLORS.violet,
      size: config.size || 5
    }));

    // Add lifespan if specified
    if (config.lifespan) {
      this.addComponent('lifespan', new LifespanComponent({
        maxLife: config.lifespan,
        fadeIn: config.fadeIn || 0,
        fadeOut: config.fadeOut || 0.3
      }));
    }

    // Set initial position
    if (config.x !== undefined) this.transform.x = config.x;
    if (config.y !== undefined) this.transform.y = config.y;
  }

  onRender(ctx) {
    // VisualComponent handles rendering
    const visual = this.getComponent('visual');
    if (visual) {
      visual.render(ctx);
    }
  }
}

// ─── PARTICLE EMITTER ─────────────────────────────────────────────────────
// Spawns particles over time
export class ParticleEmitter extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['emitter', ...(config.tags || [])]
    });

    this.layer = 'background'; // Emitters don't render

    // Emission configuration
    this.rate = config.rate || 10;              // Particles per second
    this.maxParticles = config.maxParticles || Infinity;
    this.particleConfig = config.particleConfig || {};
    this.particleBehaviors = config.behaviors || [];
    this.spawnArea = config.spawnArea || null;  // { width, height } or null for point
    this.burstCount = config.burstCount || 0;   // Initial burst
    this.continuous = config.continuous !== false;

    // State
    this.timer = 0;
    this.spawnedCount = 0;
  }

  onSpawn(ctx) {
    // Initial burst
    if (this.burstCount > 0) {
      this.burst(ctx, this.burstCount);
    }
  }

  onUpdate(ctx, dt) {
    if (!this.continuous) return;
    if (this.spawnedCount >= this.maxParticles) return;

    this.timer += dt;
    const interval = 1 / this.rate;

    while (this.timer >= interval && this.spawnedCount < this.maxParticles) {
      this.timer -= interval;
      this.spawnParticle(ctx);
    }
  }

  burst(ctx, count) {
    for (let i = 0; i < count && this.spawnedCount < this.maxParticles; i++) {
      this.spawnParticle(ctx);
    }
  }

  spawnParticle(ctx) {
    // Calculate spawn position
    let x = this.transform.x;
    let y = this.transform.y;

    if (this.spawnArea) {
      x += (Math.random() - 0.5) * this.spawnArea.width;
      y += (Math.random() - 0.5) * this.spawnArea.height;
    }

    // Resolve config (supports functions for dynamic values)
    const config = this.resolveConfig(this.particleConfig, ctx);

    // Spawn particle
    const particle = ctx.entities.spawn(Particle, {
      ...config,
      x,
      y
    });

    // Add behaviors
    for (const BehaviorClass of this.particleBehaviors) {
      if (typeof BehaviorClass === 'function') {
        particle.addBehavior(new BehaviorClass());
      } else {
        // Already instantiated behavior (will be cloned per particle)
        particle.addBehavior(Object.create(BehaviorClass));
      }
    }

    this.spawnedCount++;
    ctx.emit('particle-spawn', { particle, emitter: this });

    return particle;
  }

  resolveConfig(config, ctx) {
    const resolved = {};
    for (const [key, value] of Object.entries(config)) {
      resolved[key] = typeof value === 'function' ? value(ctx) : value;
    }
    return resolved;
  }
}
