// ═══════════════════════════════════════════════════════════════════════════
// LAYER - Individual render layer with its own graphics buffer
// ═══════════════════════════════════════════════════════════════════════════

export class Layer {
  constructor(p5, config = {}) {
    this.p5 = p5;
    this.name = config.name || 'layer';
    this.order = config.order || 0;
    this.blendMode = config.blendMode || 'BLEND';
    this.opacity = config.opacity !== undefined ? config.opacity : 1;
    this.visible = config.visible !== false;
    this.clearEachFrame = config.clearEachFrame !== false;

    // Create graphics buffer
    this.graphics = p5.createGraphics(p5.width, p5.height);
    this.graphics.colorMode(p5.RGB, 255, 255, 255, 255);
  }

  resize(width, height) {
    this.graphics.resizeCanvas(width, height);
  }

  clear() {
    this.graphics.clear();
  }

  begin() {
    if (this.clearEachFrame) {
      this.clear();
    }
    return this.graphics;
  }

  end() {
    // Called after rendering to this layer
  }

  render(targetGraphics) {
    if (!this.visible || this.opacity <= 0) return;

    const target = targetGraphics || this.p5;

    target.push();

    // Apply blend mode
    const blendModeValue = this.getBlendModeValue();
    if (blendModeValue !== null) {
      target.blendMode(blendModeValue);
    }

    // Draw with opacity
    if (this.opacity < 1) {
      target.tint(255, this.opacity * 255);
    }

    target.image(this.graphics, 0, 0);

    target.pop();
  }

  getBlendModeValue() {
    const p = this.p5;
    const modes = {
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

  dispose() {
    this.graphics.remove();
  }
}
