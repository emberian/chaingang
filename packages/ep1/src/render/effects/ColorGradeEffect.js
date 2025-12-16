// ═══════════════════════════════════════════════════════════════════════════
// COLOR GRADE EFFECT - Adjust overall color temperature and mood
// ═══════════════════════════════════════════════════════════════════════════

import { Effect } from '../EffectComposer.js';

export class ColorGradeEffect extends Effect {
  constructor(config = {}) {
    super({ ...config, name: 'colorGrade' });
    this.warmth = config.warmth !== undefined ? config.warmth : 0;      // -1 to 1 (cool to warm)
    this.saturation = config.saturation !== undefined ? config.saturation : 1;  // 0 to 2
    this.brightness = config.brightness !== undefined ? config.brightness : 1;  // 0 to 2
    this.contrast = config.contrast !== undefined ? config.contrast : 1;        // 0 to 2
    this.tint = config.tint || null;  // { r, g, b, a } overlay
  }

  render(source, target) {
    target.image(source, 0, 0);

    // Apply adjustments via canvas manipulation
    target.loadPixels();
    const d = target.pixels;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];
      const a = d[i + 3];

      if (a === 0) continue;

      // Apply brightness
      r *= this.brightness;
      g *= this.brightness;
      b *= this.brightness;

      // Apply contrast
      const factor = (259 * (this.contrast * 255 + 255)) / (255 * (259 - this.contrast * 255));
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;

      // Apply warmth
      if (this.warmth !== 0) {
        r += this.warmth * 30;
        b -= this.warmth * 30;
      }

      // Apply saturation
      if (this.saturation !== 1) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = gray + this.saturation * (r - gray);
        g = gray + this.saturation * (g - gray);
        b = gray + this.saturation * (b - gray);
      }

      // Apply tint
      if (this.tint) {
        const tintAlpha = this.tint.a || 0.1;
        r = r * (1 - tintAlpha) + this.tint.r * tintAlpha;
        g = g * (1 - tintAlpha) + this.tint.g * tintAlpha;
        b = b * (1 - tintAlpha) + this.tint.b * tintAlpha;
      }

      // Clamp values
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
    }

    target.updatePixels();
  }
}
