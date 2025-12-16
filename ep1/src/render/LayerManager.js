// ═══════════════════════════════════════════════════════════════════════════
// LAYER MANAGER - Manages named render layers with ordering
// ═══════════════════════════════════════════════════════════════════════════

import { Layer } from './Layer.js';

export class LayerManager {
  constructor(p5) {
    this.p5 = p5;
    this.layers = new Map();
    this.sortedLayers = [];
    this.needsSort = false;
  }

  create(name, config = {}) {
    if (this.layers.has(name)) {
      console.warn(`Layer "${name}" already exists`);
      return this.layers.get(name);
    }

    const layer = new Layer(this.p5, { ...config, name });
    this.layers.set(name, layer);
    this.needsSort = true;

    return layer;
  }

  get(name) {
    return this.layers.get(name);
  }

  has(name) {
    return this.layers.has(name);
  }

  remove(name) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.dispose();
      this.layers.delete(name);
      this.needsSort = true;
    }
  }

  setOrder(name, order) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.order = order;
      this.needsSort = true;
    }
  }

  setBlendMode(name, blendMode) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.blendMode = blendMode;
    }
  }

  setOpacity(name, opacity) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  setVisible(name, visible) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.visible = visible;
    }
  }

  getSorted() {
    if (this.needsSort) {
      this.sortedLayers = Array.from(this.layers.values())
        .sort((a, b) => a.order - b.order);
      this.needsSort = false;
    }
    return this.sortedLayers;
  }

  resize(width, height) {
    for (const layer of this.layers.values()) {
      layer.resize(width, height);
    }
  }

  clearAll() {
    for (const layer of this.layers.values()) {
      layer.clear();
    }
  }

  renderAll(target) {
    for (const layer of this.getSorted()) {
      layer.render(target);
    }
  }

  dispose() {
    for (const layer of this.layers.values()) {
      layer.dispose();
    }
    this.layers.clear();
    this.sortedLayers = [];
  }

  // Helper to create standard layer set
  createStandardLayers() {
    this.create('background', { order: 0 });
    this.create('world', { order: 10 });
    this.create('particles', { order: 20, blendMode: 'ADD' });
    this.create('characters', { order: 30 });
    this.create('effects', { order: 40, blendMode: 'ADD' });
    this.create('ui', { order: 100 });
  }
}
