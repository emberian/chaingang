// ═══════════════════════════════════════════════════════════════════════════
// EPISODE TITLE - Intro title that fades in and out at the beginning
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { COLORS, hexToRgb } from '../../config/colors.js';

export class EpisodeTitle extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['ui', 'episode-title', ...(config.tags || [])]
    });

    this.layer = 'ui';

    // Title text
    this.mainTitle = config.mainTitle || "The Thirteenth Turning";
    this.subtitle = config.subtitle || "episode one";
    this.instruction = config.instruction || "move your cursor to participate";

    // Timing
    this.displayDuration = config.displayDuration || 5;
    this.fadeInDuration = config.fadeInDuration || 2.5;
    this.fadeOutDuration = config.fadeOutDuration || 2.5;
    this.instructionDelay = config.instructionDelay || 2;

    // Font
    this.font = config.font || 'Georgia';
    this.mainTitleSize = config.mainTitleSize || 42;
    this.subtitleSize = config.subtitleSize || 18;
    this.instructionSize = config.instructionSize || 13;

    // State
    this.visible = true;
    this.elapsedTime = 0;
  }

  onUpdate(ctx, dt) {
    this.elapsedTime += dt;

    // Hide after display duration
    if (this.elapsedTime > this.displayDuration) {
      this.visible = false;
    }
  }

  onRender(ctx) {
    if (!this.visible) return;

    const p = ctx.p5;
    const time = this.elapsedTime;

    // Calculate opacity
    let opacity;
    if (time < this.fadeInDuration) {
      opacity = time / this.fadeInDuration;
    } else if (time > this.displayDuration - this.fadeOutDuration) {
      opacity = (this.displayDuration - time) / this.fadeOutDuration;
    } else {
      opacity = 1;
    }

    const centerX = ctx.width / 2;
    const centerY = ctx.height / 2;

    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont(this.font);

    // Main title
    p.textSize(this.mainTitleSize);
    const boneRgb = hexToRgb(COLORS.bone);
    p.fill(boneRgb.r, boneRgb.g, boneRgb.b, opacity * 0.85 * 255);
    p.text(this.mainTitle, centerX, centerY - 35);

    // Subtitle
    p.textSize(this.subtitleSize);
    const frostRgb = hexToRgb(COLORS.frost);
    p.fill(frostRgb.r, frostRgb.g, frostRgb.b, opacity * 0.5 * 255);
    p.text(this.subtitle, centerX, centerY + 15);

    // Instruction (appears after delay)
    if (time > this.instructionDelay) {
      p.textSize(this.instructionSize);
      p.fill(100, 90, 120, opacity * 0.5 * 255);
      p.text(this.instruction, centerX, centerY + 55);
    }

    p.pop();
  }

  // Reset for replay
  reset() {
    this.visible = true;
    this.elapsedTime = 0;
  }
}
