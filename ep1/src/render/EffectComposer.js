// ═══════════════════════════════════════════════════════════════════════════
// EFFECT COMPOSER - Post-processing effect chain
// ═══════════════════════════════════════════════════════════════════════════

export class EffectComposer {
  constructor(p5) {
    this.p5 = p5;
    this.effects = [];
    this.enabled = true;

    // Ping-pong buffers for effect chain
    this.bufferA = p5.createGraphics(p5.width, p5.height);
    this.bufferB = p5.createGraphics(p5.width, p5.height);
    this.bufferA.colorMode(p5.RGB, 255, 255, 255, 255);
    this.bufferB.colorMode(p5.RGB, 255, 255, 255, 255);
  }

  addEffect(effect) {
    effect.composer = this;
    effect.p5 = this.p5;
    this.effects.push(effect);
    return this;
  }

  removeEffect(effect) {
    const index = this.effects.indexOf(effect);
    if (index !== -1) {
      this.effects.splice(index, 1);
    }
    return this;
  }

  getEffect(name) {
    return this.effects.find(e => e.name === name);
  }

  resize(width, height) {
    this.bufferA.resizeCanvas(width, height);
    this.bufferB.resizeCanvas(width, height);
  }

  render(source, target) {
    if (!this.enabled || this.effects.length === 0) {
      // No effects, just draw source to target
      target.image(source, 0, 0);
      return;
    }

    // Copy source to bufferA
    this.bufferA.clear();
    this.bufferA.image(source, 0, 0);

    let current = this.bufferA;
    let next = this.bufferB;

    // Apply each effect
    for (const effect of this.effects) {
      if (!effect.enabled) continue;

      next.clear();
      effect.render(current, next);

      // Swap buffers
      [current, next] = [next, current];
    }

    // Draw final result to target
    target.image(current, 0, 0);
  }

  dispose() {
    this.bufferA.remove();
    this.bufferB.remove();
    this.effects = [];
  }
}

// ─── BASE EFFECT ───────────────────────────────────────────────────────────

export class Effect {
  constructor(config = {}) {
    this.name = config.name || 'effect';
    this.enabled = config.enabled !== false;
    this.p5 = null;
    this.composer = null;
  }

  render(source, target) {
    // Override in subclasses
    target.image(source, 0, 0);
  }
}
