// ═══════════════════════════════════════════════════════════════════════════
// BEHAVIOR - Base class for composable entity behaviors
// ═══════════════════════════════════════════════════════════════════════════

import { generateId } from '../utils/math.js';

export class Behavior {
  constructor(config = {}) {
    this.id = config.id || generateId();
    this.priority = config.priority || 0;  // Lower = earlier execution
    this.enabled = config.enabled !== false;
    this.conditions = config.conditions || []; // Array of (entity, ctx) => boolean
    this.config = config; // Store config for cloning
  }

  // Check if behavior should apply this frame
  shouldApply(entity, ctx) {
    if (!this.enabled) return false;

    for (const condition of this.conditions) {
      if (!condition(entity, ctx)) {
        return false;
      }
    }

    return true;
  }

  // Called when behavior is attached to an entity
  onAttach(entity) {}

  // Called every frame (if shouldApply returns true)
  onUpdate(entity, ctx, dt) {}

  // Called during render pass
  onRender(entity, ctx) {}

  // Called when behavior is removed from entity
  onDetach(entity) {}

  // ─── CONDITION HELPERS ────────────────────────────────────────────────────

  // Add a condition
  when(condition) {
    this.conditions.push(condition);
    return this;
  }

  // Only apply when mouse is within radius
  whenMouseNear(radius) {
    return this.when((entity, ctx) => {
      const pos = entity.getWorldPosition();
      return ctx.mouseDistanceFrom(pos.x, pos.y) < radius;
    });
  }

  // Only apply when entity has a specific tag
  whenHasTag(tag) {
    return this.when((entity) => entity.hasTag(tag));
  }

  // Only apply after certain time
  whenAfter(time) {
    return this.when((entity, ctx) => ctx.time.total > time);
  }

  // Only apply when mouse is still
  whenMouseStill(duration = 1) {
    return this.when((entity, ctx) => ctx.input.mouseStillTime > duration);
  }

  // Only apply when mouse is moving fast
  whenMouseFast(threshold = 10) {
    return this.when((entity, ctx) => ctx.input.mouseSpeed > threshold);
  }
}

// ─── COMMON BEHAVIOR PATTERNS ───────────────────────────────────────────────

// Behavior that applies for a limited duration
export class TimedBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.duration = config.duration || 1;
    this.elapsed = 0;
    this.autoRemove = config.autoRemove !== false;
  }

  get progress() {
    return Math.min(1, this.elapsed / this.duration);
  }

  onUpdate(entity, ctx, dt) {
    this.elapsed += dt;

    if (this.elapsed >= this.duration && this.autoRemove) {
      entity.removeBehavior(this.id);
    }
  }
}

// Behavior that applies on an interval
export class IntervalBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.interval = config.interval || 1;
    this.timer = 0;
    this.tickCount = 0;
  }

  onUpdate(entity, ctx, dt) {
    this.timer += dt;

    if (this.timer >= this.interval) {
      this.timer -= this.interval;
      this.tickCount++;
      this.onTick(entity, ctx);
    }
  }

  // Override in subclasses
  onTick(entity, ctx) {}
}

// Behavior that tracks a value smoothly
export class SmoothValueBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.value = config.initial || 0;
    this.target = config.initial || 0;
    this.smoothing = config.smoothing || 0.1;
    this.propertyPath = config.propertyPath || null; // e.g., 'transform.alpha'
  }

  setTarget(value) {
    this.target = value;
  }

  onUpdate(entity, ctx, dt) {
    // Smooth interpolation (frame-rate independent using exponential decay)
    // smoothing of 0.1 at 60fps becomes the reference
    const factor = 1 - Math.pow(1 - this.smoothing, dt * 60);
    this.value += (this.target - this.value) * factor;

    // Apply to property if specified
    if (this.propertyPath) {
      this._setProperty(entity, this.propertyPath, this.value);
    }
  }

  _setProperty(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
}
