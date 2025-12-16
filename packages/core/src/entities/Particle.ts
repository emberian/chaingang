// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE ENTITY - Generic particle with composable behaviors
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../core/Entity.js';
import { PhysicsComponent, VisualComponent, LifespanComponent } from '../core/Component.js';
import type {
  IEntity,
  IContext,
  IBehavior,
  EntityConfig,
  Vector2
} from '../types/index.js';

export interface ParticleConfig extends EntityConfig {
  x?: number;
  y?: number;
  velocity?: Vector2;
  friction?: number;
  shape?: 'ellipse' | 'rect' | 'triangle' | 'custom';
  color?: string;
  size?: number;
  lifespan?: number;
  fadeIn?: number;
  fadeOut?: number;
}

export class Particle extends Entity {
  constructor(config: ParticleConfig = {}) {
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
      color: config.color || '#ffffff',
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

  onRender(ctx: IContext): void {
    // VisualComponent handles rendering
    const visual = this.getComponent('visual');
    if (visual && visual.render) {
      visual.render(ctx);
    }
  }
}

// ─── PARTICLE EMITTER CONFIG ─────────────────────────────────────────────────

export type ParticleConfigResolver<T> = T | ((ctx: IContext) => T);

export interface ParticleEmitterConfig extends EntityConfig {
  rate?: number;
  maxParticles?: number;
  particleConfig?: Record<string, ParticleConfigResolver<unknown>>;
  behaviors?: (new () => IBehavior)[] | IBehavior[];
  spawnArea?: { width: number; height: number } | null;
  burstCount?: number;
  continuous?: boolean;
}

// ─── PARTICLE EMITTER ─────────────────────────────────────────────────────
// Spawns particles over time
export class ParticleEmitter extends Entity {
  rate: number;
  maxParticles: number;
  particleConfig: Record<string, ParticleConfigResolver<unknown>>;
  particleBehaviors: (new () => IBehavior)[] | IBehavior[];
  spawnArea: { width: number; height: number } | null;
  burstCount: number;
  continuous: boolean;

  // State
  timer: number = 0;
  spawnedCount: number = 0;

  constructor(config: ParticleEmitterConfig = {}) {
    super({
      ...config,
      tags: ['emitter', ...(config.tags || [])]
    });

    this.layer = 'background'; // Emitters don't render

    // Emission configuration
    this.rate = config.rate || 10;
    this.maxParticles = config.maxParticles || Infinity;
    this.particleConfig = config.particleConfig || {};
    this.particleBehaviors = config.behaviors || [];
    this.spawnArea = config.spawnArea || null;
    this.burstCount = config.burstCount || 0;
    this.continuous = config.continuous !== false;
  }

  onSpawn(ctx: IContext): void {
    // Initial burst
    if (this.burstCount > 0) {
      this.burst(ctx, this.burstCount);
    }
  }

  onUpdate(ctx: IContext, dt: number): void {
    if (!this.continuous) return;
    if (this.spawnedCount >= this.maxParticles) return;

    this.timer += dt;
    const interval = 1 / this.rate;

    while (this.timer >= interval && this.spawnedCount < this.maxParticles) {
      this.timer -= interval;
      this.spawnParticle(ctx);
    }
  }

  burst(ctx: IContext, count: number): void {
    for (let i = 0; i < count && this.spawnedCount < this.maxParticles; i++) {
      this.spawnParticle(ctx);
    }
  }

  spawnParticle(ctx: IContext): IEntity {
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
    } as ParticleConfig);

    // Add behaviors
    for (const BehaviorClass of this.particleBehaviors) {
      if (typeof BehaviorClass === 'function') {
        particle.addBehavior(new (BehaviorClass as new () => IBehavior)());
      } else {
        // Already instantiated behavior (will be cloned per particle)
        particle.addBehavior(Object.create(BehaviorClass as IBehavior));
      }
    }

    this.spawnedCount++;
    ctx.emit('particle-spawn', { particle, emitter: this });

    return particle;
  }

  private resolveConfig(
    config: Record<string, ParticleConfigResolver<unknown>>,
    ctx: IContext
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config)) {
      resolved[key] = typeof value === 'function' ? value(ctx) : value;
    }
    return resolved;
  }
}
