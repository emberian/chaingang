// ═══════════════════════════════════════════════════════════════════════════
// BEHAVIOR - Base class for composable entity behaviors
// ═══════════════════════════════════════════════════════════════════════════

import { generateId } from '../utils/math.js';
import type {
  IBehavior,
  IEntity,
  IContext,
  BehaviorConfig,
  BehaviorCondition
} from '../types/index.js';

export class Behavior implements IBehavior {
  id: string;
  priority: number;
  enabled: boolean;
  conditions: BehaviorCondition[];

  constructor(config: BehaviorConfig = {}) {
    this.id = config.id || generateId();
    this.priority = config.priority || 0;  // Lower = earlier execution
    this.enabled = config.enabled !== false;
    this.conditions = config.conditions || [];
  }

  // Check if behavior should apply this frame
  shouldApply(entity: IEntity, ctx: IContext): boolean {
    if (!this.enabled) return false;

    for (const condition of this.conditions) {
      if (!condition(entity, ctx)) {
        return false;
      }
    }

    return true;
  }

  // Called when behavior is attached to an entity
  onAttach(_entity: IEntity): void {}

  // Called every frame (if shouldApply returns true)
  onUpdate(_entity: IEntity, _ctx: IContext, _dt: number): void {}

  // Called during render pass
  onRender(_entity: IEntity, _ctx: IContext): void {}

  // Called when behavior is removed from entity
  onDetach(_entity: IEntity): void {}

  // ─── CONDITION HELPERS ────────────────────────────────────────────────────

  // Add a condition
  when(condition: BehaviorCondition): this {
    this.conditions.push(condition);
    return this;
  }

  // Only apply when mouse is within radius
  whenMouseNear(radius: number): this {
    return this.when((entity, ctx) => {
      const pos = entity.getWorldPosition();
      return ctx.mouseDistanceFrom(pos.x, pos.y) < radius;
    });
  }

  // Only apply when entity has a specific tag
  whenHasTag(tag: string): this {
    return this.when((entity) => entity.hasTag(tag));
  }

  // Only apply after certain time
  whenAfter(time: number): this {
    return this.when((_entity, ctx) => ctx.time.total > time);
  }

  // Only apply when mouse is still
  whenMouseStill(duration = 1): this {
    return this.when((_entity, ctx) => ctx.input.mouseStillTime > duration);
  }

  // Only apply when mouse is moving fast
  whenMouseFast(threshold = 10): this {
    return this.when((_entity, ctx) => ctx.input.mouseSpeed > threshold);
  }
}

// ─── COMMON BEHAVIOR PATTERNS ───────────────────────────────────────────────

export interface TimedBehaviorConfig extends BehaviorConfig {
  duration?: number;
  autoRemove?: boolean;
}

// Behavior that applies for a limited duration
export class TimedBehavior extends Behavior {
  duration: number;
  elapsed: number;
  autoRemove: boolean;

  constructor(config: TimedBehaviorConfig = {}) {
    super(config);
    this.duration = config.duration || 1;
    this.elapsed = 0;
    this.autoRemove = config.autoRemove !== false;
  }

  get progress(): number {
    return Math.min(1, this.elapsed / this.duration);
  }

  onUpdate(entity: IEntity, _ctx: IContext, dt: number): void {
    this.elapsed += dt;

    if (this.elapsed >= this.duration && this.autoRemove) {
      entity.removeBehavior(this.id);
    }
  }
}

export interface IntervalBehaviorConfig extends BehaviorConfig {
  interval?: number;
}

// Behavior that applies on an interval
export class IntervalBehavior extends Behavior {
  interval: number;
  timer: number;
  tickCount: number;

  constructor(config: IntervalBehaviorConfig = {}) {
    super(config);
    this.interval = config.interval || 1;
    this.timer = 0;
    this.tickCount = 0;
  }

  onUpdate(entity: IEntity, ctx: IContext, dt: number): void {
    this.timer += dt;

    if (this.timer >= this.interval) {
      this.timer -= this.interval;
      this.tickCount++;
      this.onTick(entity, ctx);
    }
  }

  // Override in subclasses
  onTick(_entity: IEntity, _ctx: IContext): void {}
}

export interface SmoothValueBehaviorConfig extends BehaviorConfig {
  initial?: number;
  smoothing?: number;
  propertyPath?: string | null;
}

// Behavior that tracks a value smoothly
export class SmoothValueBehavior extends Behavior {
  value: number;
  target: number;
  smoothing: number;
  propertyPath: string | null;

  constructor(config: SmoothValueBehaviorConfig = {}) {
    super(config);
    this.value = config.initial || 0;
    this.target = config.initial || 0;
    this.smoothing = config.smoothing || 0.1;
    this.propertyPath = config.propertyPath || null;
  }

  setTarget(value: number): void {
    this.target = value;
  }

  onUpdate(entity: IEntity, _ctx: IContext, _dt: number): void {
    // Smooth interpolation
    this.value += (this.target - this.value) * this.smoothing;

    // Apply to property if specified
    if (this.propertyPath) {
      this._setProperty(entity as unknown as Record<string, unknown>, this.propertyPath, this.value);
    }
  }

  private _setProperty(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }
}
