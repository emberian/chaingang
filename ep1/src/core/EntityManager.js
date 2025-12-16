// ═══════════════════════════════════════════════════════════════════════════
// ENTITY MANAGER - Manages entity lifecycle and queries
// ═══════════════════════════════════════════════════════════════════════════

import { Entity, EntityState } from './Entity.js';
import { distance } from '../utils/math.js';

export class EntityManager {
  constructor() {
    this.entities = new Map();      // id -> Entity
    this.byTag = new Map();         // tag -> Set<Entity>
    this.byLayer = new Map();       // layer -> Set<Entity>

    this.pendingSpawn = [];
    this.pendingDispose = [];

    // Event listeners
    this.listeners = new Map();     // event -> Set<callback>

    // Cache for active entities
    this._activeCache = [];
    this._activeCacheDirty = true;
  }

  // ─── SPAWNING ─────────────────────────────────────────────────────────────

  spawn(EntityClass, config = {}) {
    const entity = EntityClass instanceof Entity
      ? EntityClass
      : new EntityClass(config);

    this.pendingSpawn.push({ entity, config });
    return entity;
  }

  // Process pending spawns (called during update)
  _processSpawns(ctx) {
    for (const { entity, config } of this.pendingSpawn) {
      // Register entity
      this.entities.set(entity.id, entity);

      // Index by tags
      for (const tag of entity.tags) {
        if (!this.byTag.has(tag)) {
          this.byTag.set(tag, new Set());
        }
        this.byTag.get(tag).add(entity);
      }

      // Index by layer
      if (!this.byLayer.has(entity.layer)) {
        this.byLayer.set(entity.layer, new Set());
      }
      this.byLayer.get(entity.layer).add(entity);

      // Call spawn hook
      entity.onSpawn(ctx);
      entity.activate();

      // Emit spawn event
      this._emit('spawn', { entity });
    }

    if (this.pendingSpawn.length > 0) {
      this._invalidateActiveCache();
    }
    this.pendingSpawn = [];
  }

  // ─── DISPOSAL ─────────────────────────────────────────────────────────────

  // Process pending disposals (called during update)
  _processDisposals(ctx) {
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
      entity._finishDispose();

      // Remove from main map
      this.entities.delete(entity.id);

      // Emit dispose event
      this._emit('dispose', { entity });
    }

    if (this.pendingDispose.length > 0) {
      this._invalidateActiveCache();
    }
    this.pendingDispose = [];
  }

  // ─── QUERIES ──────────────────────────────────────────────────────────────

  get(id) {
    return this.entities.get(id);
  }

  getAll() {
    return [...this.entities.values()];
  }

  getActive() {
    if (this._activeCacheDirty) {
      this._activeCache = [];
      for (const entity of this.entities.values()) {
        if (entity.state === EntityState.ACTIVE) {
          this._activeCache.push(entity);
        }
      }
      this._activeCacheDirty = false;
    }
    return this._activeCache;
  }

  _invalidateActiveCache() {
    this._activeCacheDirty = true;
  }

  getByTag(tag) {
    const set = this.byTag.get(tag);
    return set ? [...set] : [];
  }

  getByTags(...tags) {
    if (tags.length === 0) return [];

    // Start with first tag's set (smallest for efficiency)
    let smallestSet = this.byTag.get(tags[0]);
    let smallestSize = smallestSet ? smallestSet.size : 0;

    for (let i = 1; i < tags.length; i++) {
      const tagSet = this.byTag.get(tags[i]);
      if (!tagSet || tagSet.size === 0) return [];
      if (tagSet.size < smallestSize) {
        smallestSet = tagSet;
        smallestSize = tagSet.size;
      }
    }

    if (!smallestSet || smallestSet.size === 0) return [];

    // Filter entities that have all tags
    const result = [];
    for (const entity of smallestSet) {
      let hasAllTags = true;
      for (const tag of tags) {
        const tagSet = this.byTag.get(tag);
        if (!tagSet || !tagSet.has(entity)) {
          hasAllTags = false;
          break;
        }
      }
      if (hasAllTags) {
        result.push(entity);
      }
    }

    return result;
  }

  getByLayer(layer) {
    const set = this.byLayer.get(layer);
    return set ? [...set] : [];
  }

  // Find entities within radius of a point
  getInRadius(x, y, radius, tag = null) {
    const candidates = tag ? this.getByTag(tag) : this.getActive();

    return candidates.filter(entity => {
      const pos = entity.getWorldPosition();
      return distance(x, y, pos.x, pos.y) <= radius;
    });
  }

  // Find nearest entity to a point
  getNearest(x, y, tag = null) {
    const candidates = tag ? this.getByTag(tag) : this.getActive();

    let nearest = null;
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
  count(tag = null) {
    if (tag) {
      const set = this.byTag.get(tag);
      return set ? set.size : 0;
    }
    return this.entities.size;
  }

  // ─── SCENE TRANSITIONS ────────────────────────────────────────────────────

  // Mark entities as dormant (they persist but don't update)
  markDormant(tagOrIds, ctx = null) {
    const entities = typeof tagOrIds === 'string'
      ? this.getByTag(tagOrIds)
      : tagOrIds.map(id => this.get(id)).filter(Boolean);

    let changed = false;
    for (const entity of entities) {
      if (entity.state === EntityState.ACTIVE) {
        entity.sleep();
        entity.onDormant(ctx);
        changed = true;
      }
    }
    if (changed) this._invalidateActiveCache();
  }

  // Wake dormant entities
  wake(tagOrIds, ctx = null) {
    const entities = typeof tagOrIds === 'string'
      ? this.getByTag(tagOrIds).filter(e => e.state === EntityState.DORMANT)
      : tagOrIds.map(id => this.get(id)).filter(e => e && e.state === EntityState.DORMANT);

    let changed = false;
    for (const entity of entities) {
      entity.wake();
      entity.onWake(ctx);
      changed = true;
    }
    if (changed) this._invalidateActiveCache();
  }

  // Dispose all entities with a tag
  disposeByTag(tag) {
    const entities = this.getByTag(tag);
    for (const entity of entities) {
      entity.dispose();
    }
  }

  // Dispose all entities
  disposeAll() {
    for (const entity of this.entities.values()) {
      entity.dispose();
    }
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  update(ctx, dt) {
    // Process spawns first
    this._processSpawns(ctx);

    // Update all active entities
    for (const entity of this.entities.values()) {
      if (entity.state === EntityState.ACTIVE) {
        entity._update(ctx, dt);
      }
    }

    // Process disposals last
    this._processDisposals(ctx);
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  _emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }
}
