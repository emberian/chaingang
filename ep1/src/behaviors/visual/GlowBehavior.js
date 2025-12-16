// ═══════════════════════════════════════════════════════════════════════════
// GLOW BEHAVIOR - Render glow effect around entity
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';
import { hexToRgb } from '../../config/colors.js';

export class GlowBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.color = config.color || '#00d4ff';      // Glow color
    this.intensity = config.intensity || 0.5;    // Base intensity (0-1)
    this.size = config.size || 30;               // Glow radius
    this.layers = config.layers || 5;            // Number of glow layers
    this.pulse = config.pulse || false;          // Whether to pulse
    this.pulseFrequency = config.pulseFrequency || 2;
    this.pulseAmount = config.pulseAmount || 0.3; // How much intensity varies

    // Pre-cache RGB conversion
    this._cachedRgb = null;
    this._cachedColorStr = null;
  }

  onRender(entity, ctx) {
    const p5 = ctx.p5;
    const transform = entity.transform;

    // Calculate current intensity
    let intensity = this.intensity;
    if (this.pulse) {
      const pulseValue = Math.sin(ctx.time.total * this.pulseFrequency * Math.PI * 2);
      intensity += pulseValue * this.pulseAmount;
    }

    // Get color RGB (cached)
    if (typeof this.color === 'string') {
      if (this.color !== this._cachedColorStr) {
        this._cachedColorStr = this.color;
        this._cachedRgb = hexToRgb(this.color);
      }
    } else {
      this._cachedRgb = this.color;
    }
    const rgb = this._cachedRgb;

    p5.push();
    p5.translate(transform.x, transform.y);
    p5.rotate(transform.rotation);
    p5.scale(transform.scaleX, transform.scaleY);

    p5.blendMode(p5.ADD);
    p5.noStroke();

    // Draw glow layers (larger to smaller)
    for (let i = this.layers; i > 0; i--) {
      const layerRatio = i / this.layers;
      const layerSize = this.size * layerRatio;
      const layerAlpha = intensity * (1 - layerRatio) * transform.alpha;

      p5.fill(rgb.r, rgb.g, rgb.b, layerAlpha * 255);
      p5.ellipse(0, 0, layerSize * 2, layerSize * 2);
    }

    p5.pop();
  }
}

// ─── MOUSE PROXIMITY GLOW ─────────────────────────────────────────────────
// Glow intensity based on mouse distance
export class MouseProximityGlowBehavior extends GlowBehavior {
  constructor(config = {}) {
    super(config);
    this.maxDistance = config.maxDistance || 200;
    this.minIntensity = config.minIntensity || 0;
    this.maxIntensity = config.maxIntensity || 1;
  }

  onRender(entity, ctx) {
    const pos = entity.getWorldPosition();
    const dist = ctx.mouseDistanceFrom(pos.x, pos.y);

    // Calculate intensity based on distance
    if (dist < this.maxDistance) {
      this.intensity = this.maxIntensity - (dist / this.maxDistance) * (this.maxIntensity - this.minIntensity);
    } else {
      this.intensity = this.minIntensity;
    }

    super.onRender(entity, ctx);
  }
}
