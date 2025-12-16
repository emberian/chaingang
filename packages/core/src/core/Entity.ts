// ═══════════════════════════════════════════════════════════════════════════
// ENTITY - Base class for all visual/interactive objects
// ═══════════════════════════════════════════════════════════════════════════

import { generateId } from '../utils/math.js';
import { TransformComponent } from './Component.js';
import {
  EntityState,
  type IEntity,
  type IContext,
  type IComponent,
  type IBehavior,
  type ITransformComponent,
  type EntityConfig,
  type EntityStateType,
  type Vector2
} from '../types/index.js';

// Re-export for convenience
export { EntityState };

export class Entity implements IEntity {
  id: string;
  components: Map<string, IComponent> = new Map();
  behaviors: IBehavior[] = [];
  tags: Set<string>;
  layer: string;
  state: EntityStateType = EntityState.SPAWNING;
  parent: IEntity | null = null;
  children: IEntity[] = [];
  userData: Record<string, unknown>;

  constructor(config: EntityConfig = {}) {
    this.id = config.id || generateId();
    this.tags = new Set(config.tags || []);
    this.layer = config.layer || 'world';
    this.userData = config.userData || {};

    // Transform is always present
    this.addComponent('transform', new TransformComponent(config.transform || {}));
  }

  // Convenience accessor for transform
  get transform(): ITransformComponent {
    return this.getComponent<ITransformComponent>('transform')!;
  }

  // ─── COMPONENT MANAGEMENT ──────────────────────────────────────────────────

  addComponent(name: string, component: IComponent): this {
    if (this.components.has(name)) {
      this.removeComponent(name);
    }
    this.components.set(name, component);
    component.onAttach(this);
    return this;
  }

  removeComponent(name: string): this {
    const component = this.components.get(name);
    if (component) {
      component.onDetach();
      this.components.delete(name);
    }
    return this;
  }

  getComponent<T extends IComponent>(name: string): T | undefined {
    return this.components.get(name) as T | undefined;
  }

  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  // ─── BEHAVIOR MANAGEMENT ───────────────────────────────────────────────────

  addBehavior(behavior: IBehavior): this {
    behavior.onAttach(this);
    this.behaviors.push(behavior);
    // Sort by priority (lower = earlier)
    this.behaviors.sort((a, b) => a.priority - b.priority);
    return this;
  }

  removeBehavior(behaviorOrId: IBehavior | string): this {
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

  getBehavior(id: string): IBehavior | undefined {
    return this.behaviors.find(b => b.id === id);
  }

  hasBehavior(idOrClass: string | (new (...args: unknown[]) => IBehavior)): boolean {
    if (typeof idOrClass === 'string') {
      return this.behaviors.some(b => b.id === idOrClass);
    }
    return this.behaviors.some(b => b instanceof idOrClass);
  }

  // ─── TAG MANAGEMENT ────────────────────────────────────────────────────────

  addTag(tag: string): this {
    this.tags.add(tag);
    return this;
  }

  removeTag(tag: string): this {
    this.tags.delete(tag);
    return this;
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  // ─── PARENT/CHILD RELATIONSHIPS ────────────────────────────────────────────

  setParent(parent: IEntity | null): this {
    if (this.parent) {
      this.parent.removeChild(this);
    }
    this.parent = parent;
    if (parent) {
      parent.children.push(this);
    }
    return this;
  }

  addChild(child: IEntity): this {
    child.setParent(this);
    return this;
  }

  removeChild(child: IEntity): this {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      (child as Entity).parent = null;
    }
    return this;
  }

  // ─── LIFECYCLE HOOKS ───────────────────────────────────────────────────────

  onSpawn(_ctx: IContext): void {}
  onUpdate(_ctx: IContext, _dt: number): void {}
  onRender(_ctx: IContext): void {}
  onDormant(_ctx: IContext): void {}
  onWake(_ctx: IContext): void {}
  onDispose(_ctx: IContext): void {}

  // ─── INTERNAL UPDATE/RENDER ────────────────────────────────────────────────

  _update(ctx: IContext, dt: number): void {
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
      (child as Entity)._update(ctx, dt);
    }
  }

  _render(ctx: IContext): void {
    if (this.state !== EntityState.ACTIVE && this.state !== EntityState.DORMANT) return;

    // Render behaviors (some have visual effects)
    for (const behavior of this.behaviors) {
      if (behavior.enabled) {
        behavior.onRender(this, ctx);
      }
    }

    // Render components
    for (const component of this.components.values()) {
      if (component.enabled && component.render) {
        component.render(ctx);
      }
    }

    // Entity-specific render
    this.onRender(ctx);

    // Render children
    for (const child of this.children) {
      (child as Entity)._render(ctx);
    }
  }

  // ─── STATE TRANSITIONS ─────────────────────────────────────────────────────

  activate(): void {
    if (this.state === EntityState.SPAWNING || this.state === EntityState.DORMANT) {
      this.state = EntityState.ACTIVE;
    }
  }

  sleep(): void {
    if (this.state === EntityState.ACTIVE) {
      this.state = EntityState.DORMANT;
    }
  }

  wake(): void {
    if (this.state === EntityState.DORMANT) {
      this.state = EntityState.ACTIVE;
    }
  }

  dispose(): void {
    this.state = EntityState.DISPOSING;
  }

  _finishDispose(): void {
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

  // ─── UTILITY ───────────────────────────────────────────────────────────────

  getWorldPosition(): Vector2 {
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

  distanceTo(targetOrX: IEntity | number, y: number | null = null): number {
    const pos = this.getWorldPosition();

    if (typeof targetOrX === 'object' && 'getWorldPosition' in targetOrX) {
      const targetPos = targetOrX.getWorldPosition();
      const dx = targetPos.x - pos.x;
      const dy = targetPos.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    const dx = (targetOrX as number) - pos.x;
    const dy = (y as number) - pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
