// ═══════════════════════════════════════════════════════════════════════════
// RENDER PIPELINE - Main orchestrator for layered rendering with effects
// ═══════════════════════════════════════════════════════════════════════════

import { LayerManager } from './LayerManager.js';
import { EffectComposer, Effect } from './EffectComposer.js';

export class RenderPipeline {
  constructor(p5, config = {}) {
    this.p5 = p5;
    this.layers = new LayerManager(p5);
    this.effects = new EffectComposer(p5);
    this.enabled = true;

    // Composite buffer for combining layers before effects
    this.compositeBuffer = p5.createGraphics(p5.width, p5.height);
    this.compositeBuffer.colorMode(p5.RGB, 255, 255, 255, 255);

    // Create standard layers unless disabled
    if (config.createStandardLayers !== false) {
      this.layers.createStandardLayers();
    }
  }

  // ─── Layer Access ────────────────────────────────────────────────────────

  getLayer(name) {
    return this.layers.get(name);
  }

  createLayer(name, config) {
    return this.layers.create(name, config);
  }

  // ─── Effect Access ───────────────────────────────────────────────────────

  addEffect(effect) {
    this.effects.addEffect(effect);
    return this;
  }

  getEffect(name) {
    return this.effects.getEffect(name);
  }

  // ─── Rendering ───────────────────────────────────────────────────────────

  beginLayer(name) {
    const layer = this.layers.get(name);
    if (!layer) {
      console.warn(`Layer "${name}" not found`);
      return this.p5;
    }
    return layer.begin();
  }

  endLayer(name) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.end();
    }
  }

  render(ctx) {
    if (!this.enabled) return;

    const p = this.p5;

    // Clear composite buffer
    this.compositeBuffer.clear();

    // Render all layers to composite buffer
    this.layers.renderAll(this.compositeBuffer);

    // Apply effects and render to main canvas
    if (this.effects.effects.length > 0 && this.effects.enabled) {
      this.effects.render(this.compositeBuffer, p);
    } else {
      p.image(this.compositeBuffer, 0, 0);
    }
  }

  // Render entities to their appropriate layers
  renderEntities(ctx) {
    const entities = ctx.entities.getActive();

    // Group by layer
    const groups = new Map();
    for (const entity of entities) {
      const layerName = entity.layer || 'world';
      if (!groups.has(layerName)) {
        groups.set(layerName, []);
      }
      groups.get(layerName).push(entity);
    }

    // Render each group to its layer
    for (const [layerName, entityList] of groups) {
      const layer = this.layers.get(layerName);
      if (!layer) {
        // Create layer if it doesn't exist
        this.layers.create(layerName, { order: 50 });
      }

      const graphics = this.beginLayer(layerName);

      // Create a temporary context with this layer's graphics
      const layerCtx = {
        ...ctx,
        p5: graphics
      };

      for (const entity of entityList) {
        entity._render(layerCtx);
      }

      this.endLayer(layerName);
    }
  }

  // ─── Resize ──────────────────────────────────────────────────────────────

  resize(width, height) {
    this.compositeBuffer.resizeCanvas(width, height);
    this.layers.resize(width, height);
    this.effects.resize(width, height);
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  dispose() {
    this.compositeBuffer.remove();
    this.layers.dispose();
    this.effects.dispose();
  }
}

// Re-export for convenience
export { Effect };
