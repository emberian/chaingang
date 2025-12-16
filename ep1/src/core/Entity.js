// ═══════════════════════════════════════════════════════════════════════════
// ENTITY - Base class for all visual/interactive objects
// ═══════════════════════════════════════════════════════════════════════════

import { generateId } from '../utils/math.js';
import { TransformComponent } from './Component.js';

// Entity lifecycle states
export const EntityState = {
  SPAWNING: 'spawning',
  ACTIVE: 'active',
  DORMANT: 'dormant',
  DISPOSING: 'disposing',
  DISPOSED: 'disposed'
};

export class Entity {
  constructor(config = {}) {
    this.id = config.id || generateId();
    this.components = new Map();
    this.behaviors = [];
    this.tags = new Set(config.tags || []);
    this.layer = config.layer || 'world';
    this.state = EntityState.SPAWNING;

    // Transform is always present
    this.addComponent('transform', new TransformComponent(config.transform || {}));

    // Parent/child relationships
    this.parent = null;
    this.children = [];

    // User data for custom properties
    this.userData = config.userData || {};
  }

  // Convenience accessor for transform
  get transform() {
    return this.getComponent('transform');
  }

  // ─── COMPONENT MANAGEMENT ─────────────────────────────────────────────────

  addComponent(name, component) {
    if (this.components.has(name)) {
      this.removeComponent(name);
    }
    this.components.set(name, component);
    component.onAttach(this);
    return this;
  }

  removeComponent(name) {
    const component = this.components.get(name);
    if (component) {
      component.onDetach();
      this.components.delete(name);
    }
    return this;
  }

  getComponent(name) {
    return this.components.get(name);
  }

  hasComponent(name) {
    return this.components.has(name);
  }

  // ─── BEHAVIOR MANAGEMENT ──────────────────────────────────────────────────

  addBehavior(behavior) {
    behavior.onAttach(this);
    this.behaviors.push(behavior);
    // Sort by priority (lower = earlier)
    this.behaviors.sort((a, b) => a.priority - b.priority);
    return this;
  }

  removeBehavior(behaviorOrId) {
    const index = typeof behaviorOrId === 'string'
      ? this.behaviors.findIndex(b => b.id === behaviorOrId)
      : this.behaviors.indexOf(behaviorOrId);

    if (index !== -1) {
      const behavior = this.behaviors[index];
      behavior.onDetach(this);
      this.behaviors.splice(index, 1);
    }
    return this;
  }

  getBehavior(id) {
    return this.behaviors.find(b => b.id === id);
  }

  hasBehavior(idOrClass) {
    if (typeof idOrClass === 'string') {
      return this.behaviors.some(b => b.id === idOrClass);
    }
    return this.behaviors.some(b => b instanceof idOrClass);
  }

  // ─── TAG MANAGEMENT ───────────────────────────────────────────────────────

  addTag(tag) {
    this.tags.add(tag);
    return this;
  }

  removeTag(tag) {
    this.tags.delete(tag);
    return this;
  }

  hasTag(tag) {
    return this.tags.has(tag);
  }

  // ─── PARENT/CHILD RELATIONSHIPS ───────────────────────────────────────────

  setParent(parent) {
    if (this.parent) {
      this.parent.removeChild(this);
    }
    this.parent = parent;
    if (parent) {
      parent.children.push(this);
    }
    return this;
  }

  addChild(child) {
    child.setParent(this);
    return this;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
    return this;
  }

  // ─── LIFECYCLE HOOKS ──────────────────────────────────────────────────────

  // Called when entity is first spawned (override in subclasses)
  onSpawn(ctx) {}

  // Called every frame while active
  onUpdate(ctx, dt) {}

  // Called during render pass
  onRender(ctx) {}

  // Called when entity goes dormant (e.g., scene transition)
  onDormant(ctx) {}

  // Called when entity wakes from dormancy
  onWake(ctx) {}

  // Called before entity is fully disposed
  onDispose(ctx) {}

  // ─── INTERNAL UPDATE/RENDER ───────────────────────────────────────────────

  _update(ctx, dt) {
    if (this.state !== EntityState.ACTIVE) return;

    // Update components
    for (const component of this.components.values()) {
      if (component.enabled) {
        component.update(ctx, dt);
      }
    }

    // Update behaviors
    for (const behavior of this.behaviors) {
      if (behavior.enabled && behavior.shouldApply(this, ctx)) {
        behavior.onUpdate(this, ctx, dt);
      }
    }

    // Entity-specific update
    this.onUpdate(ctx, dt);

    // Update children
    for (const child of this.children) {
      child._update(ctx, dt);
    }
  }

  _render(ctx) {
    if (this.state !== EntityState.ACTIVE && this.state !== EntityState.DORMANT) return;

    // Render behaviors (some have visual effects)
    for (const behavior of this.behaviors) {
      if (behavior.enabled) {
        behavior.onRender(this, ctx);
      }
    }

    // Render components
    for (const component of this.components.values()) {
      if (component.enabled && typeof component.render === 'function') {
        component.render(ctx);
      }
    }

    // Entity-specific render
    this.onRender(ctx);

    // Render children
    for (const child of this.children) {
      child._render(ctx);
    }
  }

  // ─── STATE TRANSITIONS ────────────────────────────────────────────────────

  activate() {
    if (this.state === EntityState.SPAWNING || this.state === EntityState.DORMANT) {
      this.state = EntityState.ACTIVE;
    }
  }

  sleep() {
    if (this.state === EntityState.ACTIVE) {
      this.state = EntityState.DORMANT;
    }
  }

  wake() {
    if (this.state === EntityState.DORMANT) {
      this.state = EntityState.ACTIVE;
    }
  }

  dispose() {
    this.state = EntityState.DISPOSING;
  }

  _finishDispose() {
    this.state = EntityState.DISPOSED;

    // Dispose children
    for (const child of [...this.children]) {
      child.dispose();
    }

    // Detach from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }

    // Clean up components
    for (const component of this.components.values()) {
      component.onDetach();
    }
    this.components.clear();

    // Clean up behaviors
    for (const behavior of this.behaviors) {
      behavior.onDetach(this);
    }
    this.behaviors = [];
  }

  // ─── UTILITY ──────────────────────────────────────────────────────────────

  // Get world position (accounting for parent transforms)
  getWorldPosition() {
    let x = this.transform.x;
    let y = this.transform.y;

    let current = this.parent;
    while (current) {
      x += current.transform.x;
      y += current.transform.y;
      current = current.parent;
    }

    return { x, y };
  }

  // Distance to another entity or point
  distanceTo(targetOrX, y = null) {
    const pos = this.getWorldPosition();

    if (typeof targetOrX === 'object' && targetOrX.getWorldPosition) {
      const targetPos = targetOrX.getWorldPosition();
      const dx = targetPos.x - pos.x;
      const dy = targetPos.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    const dx = targetOrX - pos.x;
    const dy = y - pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
