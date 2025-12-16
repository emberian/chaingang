// ═══════════════════════════════════════════════════════════════════════════
// FROST CRYSTAL - Growing ice crystal at screen edges
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { COLORS, hexToRgb } from '../../config/colors.js';

export class FrostCrystal extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['particle', 'frost', ...(config.tags || [])]
    });

    this.layer = 'effects';
    this.edge = config.edge || 'top'; // 'top', 'bottom', 'left', 'right'

    // Crystal properties
    this.size = config.size || (10 + Math.random() * 20);
    this.rotation = Math.random() * Math.PI * 2;
    this.branches = Math.floor(4 + Math.random() * 3);
    this.opacity = 0;
    this.growing = true;
    this.growthThreshold = config.growthThreshold || 0.5;
    this.sceneProgress = 0;
    this.colorRgb = hexToRgb(COLORS.frost); // Pre-cache RGB

    // Set position based on edge
    this.setEdgePosition(config.width || 800, config.height || 600);
  }

  setEdgePosition(width, height) {
    switch (this.edge) {
      case 'top':
        this.transform.x = Math.random() * width;
        this.transform.y = 0;
        break;
      case 'bottom':
        this.transform.x = Math.random() * width;
        this.transform.y = height;
        break;
      case 'left':
        this.transform.x = 0;
        this.transform.y = Math.random() * height;
        break;
      case 'right':
        this.transform.x = width;
        this.transform.y = Math.random() * height;
        break;
    }
  }

  onUpdate(ctx, dt) {
    // Grow when scene progress exceeds threshold
    if (this.growing && this.sceneProgress > this.growthThreshold) {
      this.opacity = Math.min(0.6, this.opacity + dt * 0.3);
    }
  }

  setSceneProgress(progress) {
    this.sceneProgress = progress;
  }

  onRender(ctx) {
    if (this.opacity < 0.01) return;

    const p = ctx.p5;
    const rgb = this.colorRgb; // Use pre-cached RGB

    p.push();
    p.translate(this.transform.x, this.transform.y);
    p.rotate(this.rotation);

    p.stroke(rgb.r, rgb.g, rgb.b, this.opacity * this.transform.alpha * 255);
    p.strokeWeight(1);
    p.noFill();

    // Draw crystal branches
    for (let i = 0; i < this.branches; i++) {
      const angle = (i / this.branches) * p.TWO_PI;
      const len = this.size;

      p.push();
      p.rotate(angle);
      p.line(0, 0, len, 0);

      // Sub-branches
      p.translate(len * 0.5, 0);
      p.line(0, 0, len * 0.3, -len * 0.2);
      p.line(0, 0, len * 0.3, len * 0.2);

      p.translate(len * 0.3, 0);
      p.line(0, 0, len * 0.2, -len * 0.15);
      p.line(0, 0, len * 0.2, len * 0.15);

      p.pop();
    }

    p.pop();
  }
}
