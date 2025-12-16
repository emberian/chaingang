// ═══════════════════════════════════════════════════════════════════════════
// ENTITY MANAGER - Manages entity lifecycle and queries
// ═══════════════════════════════════════════════════════════════════════════

import { Entity, EntityState } from './Entity.js';
import { distance } from '../utils/math.js';
import type {
  IEntityManager,
  IEntity,
  IContext,
  EntityConfig,
  EventCallback
} from '../types/index.js';

interface PendingSpawn {
  entity: IEntity;
  config: EntityConfig;
}

export class EntityManager implements IEntityManager {
  entities: Map<string, IEntity> = new Map();
  byTag: Map<string, Set<IEntity>> = new Map();
  byLayer: Map<string, Set<IEntity>> = new Map();

  pendingSpawn: PendingSpawn[] = [];
  pendingDispose: IEntity[] = [];

  listeners: Map<string, Set<EventCallback>> = new Map();

  // ─── SPAWNING ─────────────────────────────────────────────────────────────

  spawn<T extends IEntity>(
    EntityClass: (new (config?: EntityConfig) => T) | T,
    config: EntityConfig = {}
  ): T {
    const entity = EntityClass instanceof Entity
      ? EntityClass as T
      : new (EntityClass as new (config?: EntityConfig) => T)(config);

    this.pendingSpawn.push({ entity, config });
    return entity;
  }

  // Process pending spawns (called during update)
  _processSpawns(ctx: IContext): void {
    for (const { entity } of this.pendingSpawn) {
      // Register entity
      this.entities.set(entity.id, entity);

      // Index by tags
      for (const tag of entity.tags) {
        if (!this.byTag.has(tag)) {
          this.byTag.set(tag, new Set());
        }
        this.byTag.get(tag)!.add(entity);
      }

      // Index by layer
      if (!this.byLayer.has(entity.layer)) {
        this.byLayer.set(entity.layer, new Set());
      }
      this.byLayer.get(entity.layer)!.add(entity);

      // Call spawn hook
      entity.onSpawn(ctx);
      entity.activate();

      // Emit spawn event
      this._emit('spawn', { entity });
    }

    this.pendingSpawn = [];
  }

  // ─── DISPOSAL ─────────────────────────────────────────────────────────────

  dispose(entity: IEntity): void {
    entity.dispose();
  }

  // Process pending disposals (called during update)
  _processDisposals(ctx: IContext): void {
    for (const entity of this.entities.values()) {
      if (entity.state === EntityState.DISPOSING) {
        this.pendingDispose.push(entity);
      }
    }

    for (const entity of this.pendingDispose) {
      // Call dispose hook
      entity.onDispose(ctx);

      // Remove from indices
      for (const tag of entity.tags) {
        const tagSet = this.byTag.get(tag);
        if (tagSet) {
          tagSet.delete(entity);
        }
      }

      const layerSet = this.byLayer.get(entity.layer);
      if (layerSet) {
        layerSet.delete(entity);
      }

      // Finish disposal
      (entity as Entity)._finishDispose();

      // Remove from main map
      this.entities.delete(entity.id);

      // Emit dispose event
      this._emit('dispose', { entity });
    }

    this.pendingDispose = [];
  }

  // ─── QUERIES ──────────────────────────────────────────────────────────────

  get(id: string): IEntity | undefined {
    return this.entities.get(id);
  }

  getAll(): IEntity[] {
    return [...this.entities.values()];
  }

  getActive(): IEntity[] {
    return this.getAll().filter(e => e.state === EntityState.ACTIVE);
  }

  getByTag(tag: string): IEntity[] {
    const set = this.byTag.get(tag);
    return set ? [...set] : [];
  }

  getByTags(...tags: string[]): IEntity[] {
    if (tags.length === 0) return [];

    // Start with first tag's set
    let result = new Set(this.byTag.get(tags[0]) || []);

    // Intersect with remaining tags
    for (let i = 1; i < tags.length; i++) {
      const tagSet = this.byTag.get(tags[i]);
      if (!tagSet) return [];
      result = new Set([...result].filter(e => tagSet.has(e)));
    }

    return [...result];
  }

  getByLayer(layer: string): IEntity[] {
    const set = this.byLayer.get(layer);
    return set ? [...set] : [];
  }

  // Find entities within radius of a point
  getInRadius(x: number, y: number, radius: number, tag: string | null = null): IEntity[] {
    const candidates = tag ? this.getByTag(tag) : this.getActive();

    return candidates.filter(entity => {
      const pos = entity.getWorldPosition();
      return distance(x, y, pos.x, pos.y) <= radius;
    });
  }

  // Find nearest entity to a point
  getNearest(x: number, y: number, tag: string | null = null): IEntity | null {
    const candidates = tag ? this.getByTag(tag) : this.getActive();

    let nearest: IEntity | null = null;
    let nearestDist = Infinity;

    for (const entity of candidates) {
      const pos = entity.getWorldPosition();
      const d = distance(x, y, pos.x, pos.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = entity;
      }
    }

    return nearest;
  }

  // Count entities
  count(tag: string | null = null): number {
    if (tag) {
      const set = this.byTag.get(tag);
      return set ? set.size : 0;
    }
    return this.entities.size;
  }

  // ─── SCENE TRANSITIONS ────────────────────────────────────────────────────

  // Mark entities as dormant (they persist but don't update)
  markDormant(tagOrIds: string | string[]): void {
    const entities = typeof tagOrIds === 'string'
      ? this.getByTag(tagOrIds)
      : tagOrIds.map(id => this.get(id)).filter((e): e is IEntity => e !== undefined);

    for (const entity of entities) {
      if (entity.state === EntityState.ACTIVE) {
        entity.sleep();
        (entity as Entity).onDormant({} as IContext);
      }
    }
  }

  // Wake dormant entities
  wake(tagOrIds: string | string[]): void {
    const entities = typeof tagOrIds === 'string'
      ? this.getByTag(tagOrIds).filter(e => e.state === EntityState.DORMANT)
      : tagOrIds.map(id => this.get(id)).filter((e): e is IEntity => e !== undefined && e.state === EntityState.DORMANT);

    for (const entity of entities) {
      entity.wake();
      (entity as Entity).onWake({} as IContext);
    }
  }

  // Dispose all entities with a tag
  disposeByTag(tag: string): void {
    const entities = this.getByTag(tag);
    for (const entity of entities) {
      entity.dispose();
    }
  }

  // Dispose all entities
  disposeAll(): void {
    for (const entity of this.entities.values()) {
      entity.dispose();
    }
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  update(ctx: IContext, dt: number): void {
    // Process spawns first
    this._processSpawns(ctx);

    // Update all active entities
    for (const entity of this.entities.values()) {
      if (entity.state === EntityState.ACTIVE) {
        (entity as Entity)._update(ctx, dt);
      }
    }

    // Process disposals last
    this._processDisposals(ctx);
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  _emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }
}
