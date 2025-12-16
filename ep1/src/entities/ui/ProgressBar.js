// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR - Timeline progress with pentad symbol markers
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { COLORS, hexToRgb, lerpColor } from '../../config/colors.js';

const PENTAD_SYMBOLS = ['!', '~', '^', '<>', '?'];

export class ProgressBar extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['ui', 'progress-bar', ...(config.tags || [])]
    });

    this.layer = 'ui';

    // Position and dimensions
    this.marginX = config.marginX || 0.1;  // 10% margin from each side
    this.height = config.height || 4;
    this.bottomOffset = config.bottomOffset || 10;

    // Scene durations (will be set from choreography)
    this.sceneDurations = config.sceneDurations || [28, 30, 35, 30, 25, 30];
    this.totalDuration = this.sceneDurations.reduce((a, b) => a + b, 0);

    // State
    this.progress = 0;
    this.currentScene = 0;
  }

  setProgress(progress, currentScene) {
    this.progress = Math.max(0, Math.min(1, progress));
    this.currentScene = currentScene;
  }

  onRender(ctx) {
    const p = ctx.p5;
    const width = ctx.width;
    const height = ctx.height;

    const barX = width * this.marginX;
    const barWidth = width * (1 - this.marginX * 2);
    const barY = height - this.bottomOffset;

    p.push();
    p.noStroke();

    // Background track
    p.fill(30, 25, 40, 80);
    p.rect(barX, barY, barWidth, this.height, 2);

    // Progress fill with color gradient
    const violetRgb = hexToRgb(COLORS.violet);
    const honkRgb = hexToRgb(COLORS.honk);
    const progColor = lerpColor(COLORS.violet, COLORS.honk, this.progress);
    const rgb = hexToRgb(progColor);

    p.fill(rgb.r, rgb.g, rgb.b, 150);
    p.rect(barX, barY, barWidth * this.progress, this.height, 2);

    // Scene markers with pentad symbols
    let markerX = barX;

    for (let i = 0; i < this.sceneDurations.length - 1; i++) {
      markerX += (this.sceneDurations[i] / this.totalDuration) * barWidth;

      // Marker dot
      const isActive = this.currentScene > i;
      p.fill(isActive ? 150 : 80, isActive ? 140 : 70, isActive ? 180 : 100, 120);
      p.ellipse(markerX, barY + this.height / 2, 6, 6);

      // Pentad symbol above (subtle)
      if (i < PENTAD_SYMBOLS.length) {
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(8);
        p.fill(100, 90, 120, 60);
        p.text(PENTAD_SYMBOLS[i], markerX, barY - 12);
      }
    }

    p.pop();
  }
}
