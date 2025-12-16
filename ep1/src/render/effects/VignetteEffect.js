// ═══════════════════════════════════════════════════════════════════════════
// VIGNETTE EFFECT - Darken edges of the screen
// ═══════════════════════════════════════════════════════════════════════════

import { Effect } from '../EffectComposer.js';

export class VignetteEffect extends Effect {
  constructor(config = {}) {
    super({ ...config, name: 'vignette' });
    this.intensity = config.intensity !== undefined ? config.intensity : 0.5;
    this.size = config.size !== undefined ? config.size : 0.7;
    this.softness = config.softness !== undefined ? config.softness : 0.3;
    this.color = config.color || { r: 0, g: 0, b: 0 };
  }

  render(source, target) {
    const p = this.p5;
    const width = target.width;
    const height = target.height;

    // Draw source first
    target.image(source, 0, 0);

    // Create vignette overlay
    target.push();
    target.noStroke();

    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.max(width, height) * this.size;

    const gradient = target.drawingContext.createRadialGradient(
      cx, cy, 0,
      cx, cy, maxRadius
    );

    const { r, g, b } = this.color;
    gradient.addColorStop(0, `rgba(${r},${g},${b},0)`);
    gradient.addColorStop(1 - this.softness, `rgba(${r},${g},${b},${this.intensity * 0.5})`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},${this.intensity})`);

    target.drawingContext.fillStyle = gradient;
    target.rect(0, 0, width, height);

    target.pop();
  }
}
