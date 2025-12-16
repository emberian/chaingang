// ═══════════════════════════════════════════════════════════════════════════
// BLOOM EFFECT - Add glow to bright areas
// ═══════════════════════════════════════════════════════════════════════════

import { Effect } from '../EffectComposer.js';

export class BloomEffect extends Effect {
  constructor(config = {}) {
    super({ ...config, name: 'bloom' });
    this.threshold = config.threshold !== undefined ? config.threshold : 0.7;
    this.intensity = config.intensity !== undefined ? config.intensity : 0.5;
    this.radius = config.radius !== undefined ? config.radius : 8;
    this.passes = config.passes !== undefined ? config.passes : 3;

    // Will be created lazily
    this.brightBuffer = null;
    this.blurBuffer = null;
  }

  ensureBuffers(width, height) {
    if (!this.brightBuffer || this.brightBuffer.width !== width) {
      if (this.brightBuffer) {
        this.brightBuffer.remove();
        this.blurBuffer.remove();
      }
      this.brightBuffer = this.p5.createGraphics(width, height);
      this.blurBuffer = this.p5.createGraphics(width, height);
    }
  }

  render(source, target) {
    const p = this.p5;
    const width = target.width;
    const height = target.height;

    this.ensureBuffers(width, height);

    // Extract bright areas
    this.extractBright(source);

    // Blur bright areas
    this.blur();

    // Composite
    target.image(source, 0, 0);
    target.push();
    target.blendMode(p.ADD);
    target.tint(255, this.intensity * 255);
    target.image(this.blurBuffer, 0, 0);
    target.pop();
  }

  extractBright(source) {
    const bright = this.brightBuffer;
    bright.clear();

    // Copy source
    bright.image(source, 0, 0);

    // Apply threshold filter using canvas manipulation
    bright.loadPixels();
    const d = bright.pixels;
    const threshold = this.threshold * 255;

    for (let i = 0; i < d.length; i += 4) {
      const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (brightness < threshold) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 0;
      }
    }

    bright.updatePixels();
  }

  blur() {
    const blur = this.blurBuffer;
    blur.clear();
    blur.image(this.brightBuffer, 0, 0);

    // Apply blur using canvas filter
    for (let i = 0; i < this.passes; i++) {
      blur.filter(this.p5.BLUR, this.radius);
    }
  }
}
