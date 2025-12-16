// ═══════════════════════════════════════════════════════════════════════════
// LAYER - Individual render layer with its own graphics buffer
// ═══════════════════════════════════════════════════════════════════════════

import type {
  ILayer,
  P5Instance,
  P5Graphics,
  LayerConfig
} from '../types/index.js';

export class Layer implements ILayer {
  name: string;
  order: number;
  blendMode: string;
  opacity: number;
  visible: boolean;
  graphics: P5Graphics;

  private p5: P5Instance;
  private clearEachFrame: boolean;

  constructor(p5: P5Instance, config: LayerConfig = {}) {
    this.p5 = p5;
    this.name = config.name || 'layer';
    this.order = config.order || 0;
    this.blendMode = config.blendMode || 'BLEND';
    this.opacity = config.opacity !== undefined ? config.opacity : 1;
    this.visible = config.visible !== false;
    this.clearEachFrame = true;

    // Create graphics buffer
    this.graphics = p5.createGraphics(p5.width, p5.height);
    this.graphics.colorMode(p5.RGB, 255, 255, 255, 255);
  }

  resize(width: number, height: number): void {
    this.graphics.resizeCanvas(width, height);
  }

  clear(): void {
    this.graphics.clear();
  }

  begin(): P5Graphics {
    if (this.clearEachFrame) {
      this.clear();
    }
    return this.graphics;
  }

  end(): void {
    // Called after rendering to this layer
  }

  render(target: P5Graphics): void {
    if (!this.visible || this.opacity <= 0) return;

    const targetGraphics = target || this.p5;

    targetGraphics.push();

    // Apply blend mode
    const blendModeValue = this.getBlendModeValue();
    if (blendModeValue !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      targetGraphics.blendMode(blendModeValue as any);
    }

    // Draw with opacity
    if (this.opacity < 1) {
      targetGraphics.tint(255, this.opacity * 255);
    }

    targetGraphics.image(this.graphics, 0, 0);

    targetGraphics.pop();
  }

  private getBlendModeValue(): unknown {
    const p = this.p5;
    const modes: Record<string, unknown> = {
      'BLEND': p.BLEND,
      'ADD': p.ADD,
      'MULTIPLY': p.MULTIPLY,
      'SCREEN': p.SCREEN,
      'OVERLAY': p.OVERLAY,
      'HARD_LIGHT': p.HARD_LIGHT,
      'SOFT_LIGHT': p.SOFT_LIGHT,
      'DODGE': p.DODGE,
      'BURN': p.BURN,
      'DIFFERENCE': p.DIFFERENCE,
      'EXCLUSION': p.EXCLUSION
    };
    return modes[this.blendMode] ?? p.BLEND;
  }

  dispose(): void {
    this.graphics.remove();
  }
}
