// ═══════════════════════════════════════════════════════════════════════════
// RENDER PIPELINE - Main orchestrator for layered rendering with effects
// ═══════════════════════════════════════════════════════════════════════════

import { LayerManager } from './LayerManager.js';
import { EffectComposer, Effect } from './EffectComposer.js';
import { Entity } from '../core/Entity.js';
import type {
  IRenderPipeline,
  ILayerManager,
  IEffectComposer,
  IEffect,
  ILayer,
  IContext,
  P5Instance,
  P5Graphics,
  LayerConfig
} from '../types/index.js';

export interface RenderPipelineConfig {
  createStandardLayers?: boolean;
}

export class RenderPipeline implements IRenderPipeline {
  private p5: P5Instance;
  layers: ILayerManager;
  effects: IEffectComposer;
  enabled: boolean = true;

  // Composite buffer for combining layers before effects
  private compositeBuffer: P5Graphics;

  constructor(p5: P5Instance, config: RenderPipelineConfig = {}) {
    this.p5 = p5;
    this.layers = new LayerManager(p5);
    this.effects = new EffectComposer(p5);

    // Composite buffer for combining layers before effects
    this.compositeBuffer = p5.createGraphics(p5.width, p5.height);
    this.compositeBuffer.colorMode(p5.RGB, 255, 255, 255, 255);

    // Create standard layers unless disabled
    if (config.createStandardLayers !== false) {
      this.layers.createStandardLayers();
    }
  }

  // ─── Layer Access ────────────────────────────────────────────────────────

  getLayer(name: string): ILayer | undefined {
    return this.layers.get(name);
  }

  createLayer(name: string, config?: LayerConfig): ILayer {
    return this.layers.create(name, config);
  }

  // ─── Effect Access ───────────────────────────────────────────────────────

  addEffect(effect: IEffect): this {
    this.effects.addEffect(effect);
    return this;
  }

  getEffect(name: string): IEffect | undefined {
    return this.effects.getEffect(name);
  }

  // ─── Rendering ───────────────────────────────────────────────────────────

  beginLayer(name: string): P5Graphics | P5Instance {
    const layer = this.layers.get(name);
    if (!layer) {
      console.warn(`Layer "${name}" not found`);
      return this.p5;
    }
    return layer.begin();
  }

  endLayer(name: string): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.end();
    }
  }

  render(_ctx: IContext): void {
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
  renderEntities(ctx: IContext): void {
    const entities = ctx.entities.getActive();

    // Group by layer
    const groups = new Map<string, Entity[]>();
    for (const entity of entities) {
      const layerName = entity.layer || 'world';
      if (!groups.has(layerName)) {
        groups.set(layerName, []);
      }
      groups.get(layerName)!.push(entity as Entity);
    }

    // Render each group to its layer
    for (const [layerName, entityList] of groups) {
      let layer = this.layers.get(layerName);
      if (!layer) {
        // Create layer if it doesn't exist
        layer = this.layers.create(layerName, { order: 50 });
      }

      const graphics = this.beginLayer(layerName);

      // Create a temporary context with this layer's graphics
      const layerCtx = {
        ...ctx,
        p5: graphics as P5Instance
      };

      for (const entity of entityList) {
        entity._render(layerCtx);
      }

      this.endLayer(layerName);
    }
  }

  // ─── Resize ──────────────────────────────────────────────────────────────

  resize(width: number, height: number): void {
    this.compositeBuffer.resizeCanvas(width, height);
    this.layers.resize(width, height);
    this.effects.resize(width, height);
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  dispose(): void {
    this.compositeBuffer.remove();
    this.layers.dispose();
    this.effects.dispose();
  }
}

// Re-export for convenience
export { Effect };
