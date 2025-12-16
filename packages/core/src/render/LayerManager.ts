// ═══════════════════════════════════════════════════════════════════════════
// LAYER MANAGER - Manages named render layers with ordering
// ═══════════════════════════════════════════════════════════════════════════

import { Layer } from './Layer.js';
import type {
  ILayerManager,
  ILayer,
  P5Instance,
  P5Graphics,
  LayerConfig
} from '../types/index.js';

export class LayerManager implements ILayerManager {
  private p5: P5Instance;
  private layers: Map<string, ILayer> = new Map();
  private sortedLayers: ILayer[] = [];
  private needsSort: boolean = false;

  constructor(p5: P5Instance) {
    this.p5 = p5;
  }

  create(name: string, config: LayerConfig = {}): ILayer {
    if (this.layers.has(name)) {
      console.warn(`Layer "${name}" already exists`);
      return this.layers.get(name)!;
    }

    const layer = new Layer(this.p5, { ...config, name });
    this.layers.set(name, layer);
    this.needsSort = true;

    return layer;
  }

  get(name: string): ILayer | undefined {
    return this.layers.get(name);
  }

  has(name: string): boolean {
    return this.layers.has(name);
  }

  remove(name: string): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.dispose();
      this.layers.delete(name);
      this.needsSort = true;
    }
  }

  setOrder(name: string, order: number): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.order = order;
      this.needsSort = true;
    }
  }

  setBlendMode(name: string, blendMode: string): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.blendMode = blendMode;
    }
  }

  setOpacity(name: string, opacity: number): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  setVisible(name: string, visible: boolean): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.visible = visible;
    }
  }

  getSorted(): ILayer[] {
    if (this.needsSort) {
      this.sortedLayers = Array.from(this.layers.values())
        .sort((a, b) => a.order - b.order);
      this.needsSort = false;
    }
    return this.sortedLayers;
  }

  resize(width: number, height: number): void {
    for (const layer of this.layers.values()) {
      layer.resize(width, height);
    }
  }

  clearAll(): void {
    for (const layer of this.layers.values()) {
      layer.clear();
    }
  }

  renderAll(target: P5Graphics): void {
    for (const layer of this.getSorted()) {
      layer.render(target);
    }
  }

  dispose(): void {
    for (const layer of this.layers.values()) {
      layer.dispose();
    }
    this.layers.clear();
    this.sortedLayers = [];
  }

  // Helper to create standard layer set
  createStandardLayers(): void {
    this.create('background', { order: 0 });
    this.create('world', { order: 10 });
    this.create('particles', { order: 20, blendMode: 'ADD' });
    this.create('characters', { order: 30 });
    this.create('effects', { order: 40, blendMode: 'ADD' });
    this.create('ui', { order: 100 });
  }
}
