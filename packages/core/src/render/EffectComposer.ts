// ═══════════════════════════════════════════════════════════════════════════
// EFFECT COMPOSER - Post-processing effect chain
// ═══════════════════════════════════════════════════════════════════════════

import type {
  IEffectComposer,
  IEffect,
  P5Instance,
  P5Graphics,
  EffectConfig
} from '../types/index.js';

export class EffectComposer implements IEffectComposer {
  private p5: P5Instance;
  effects: IEffect[] = [];
  enabled: boolean = true;

  // Ping-pong buffers for effect chain
  private bufferA: P5Graphics;
  private bufferB: P5Graphics;

  constructor(p5: P5Instance) {
    this.p5 = p5;

    this.bufferA = p5.createGraphics(p5.width, p5.height);
    this.bufferB = p5.createGraphics(p5.width, p5.height);
    this.bufferA.colorMode(p5.RGB, 255, 255, 255, 255);
    this.bufferB.colorMode(p5.RGB, 255, 255, 255, 255);
  }

  addEffect(effect: IEffect): this {
    effect.composer = this;
    effect.p5 = this.p5;
    this.effects.push(effect);
    return this;
  }

  removeEffect(effect: IEffect): this {
    const index = this.effects.indexOf(effect);
    if (index !== -1) {
      this.effects.splice(index, 1);
    }
    return this;
  }

  getEffect(name: string): IEffect | undefined {
    return this.effects.find(e => e.name === name);
  }

  resize(width: number, height: number): void {
    this.bufferA.resizeCanvas(width, height);
    this.bufferB.resizeCanvas(width, height);
  }

  render(source: P5Graphics, target: P5Instance | P5Graphics): void {
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

  dispose(): void {
    this.bufferA.remove();
    this.bufferB.remove();
    this.effects = [];
  }
}

// ─── BASE EFFECT ───────────────────────────────────────────────────────────

export class Effect implements IEffect {
  name: string;
  enabled: boolean;
  p5: P5Instance | null = null;
  composer: IEffectComposer | null = null;

  constructor(config: EffectConfig = {}) {
    this.name = config.name || 'effect';
    this.enabled = config.enabled !== false;
  }

  render(source: P5Graphics, target: P5Graphics): void {
    // Override in subclasses
    target.image(source, 0, 0);
  }
}
