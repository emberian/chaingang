// ═══════════════════════════════════════════════════════════════════════════
// TENTACLE - Individual tentacle segment for Polvo with suckers and physics
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { COLORS, hexToRgb } from '../../config/colors.js';

export class Tentacle extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['tentacle', ...(config.tags || [])]
    });

    this.layer = 'characters';
    this.parent = config.parent || null;
    this.index = config.index || 0;
    this.segmentCount = config.segmentCount || 15;
    this.baseLength = config.baseLength || (120 + Math.random() * 80);
    this.baseWidth = config.baseWidth || (10 + Math.random() * 8);

    // Tentacle properties
    this.baseAngle = (this.index / 8) * Math.PI * 2;
    this.color = config.color || COLORS.teal;

    // Wave parameters
    this.phaseOffset = Math.random() * Math.PI * 2;
    this.reachAmount = 0;

    // Suckers - 8 per tentacle at various positions
    this.suckers = Array(8).fill(0).map(() => ({
      offset: 0.2 + Math.random() * 0.7,  // Position along tentacle (0-1)
      size: 4 + Math.random() * 4,
      pulse: Math.random() * Math.PI * 2
    }));

    // Tripping animation (tentacles crossing)
    this.tripping = false;
    this.tripProgress = 0;
    this.crossingTentacle = -1;

    // Cached segment points for sucker placement
    this.segmentPoints = [];
  }

  // Start tripping animation
  startTrip(crossingIndex) {
    if (!this.tripping) {
      this.tripping = true;
      this.tripProgress = 0;
      this.crossingTentacle = crossingIndex;
    }
  }

  onUpdate(ctx, dt) {
    // Calculate reach toward mouse
    if (this.parent) {
      const parentPos = this.parent.getWorldPosition();
      const targetAngle = Math.atan2(
        ctx.input.mouseY - parentPos.y,
        ctx.input.mouseX - parentPos.x
      );
      const angleDiff = targetAngle - this.baseAngle;
      const targetReach = Math.max(0, 0.4 - Math.abs(angleDiff) / Math.PI * 0.4);
      this.reachAmount += (targetReach - this.reachAmount) * 0.05;
    }

    // Random tripping trigger
    if (!this.tripping && Math.random() < 0.001) {
      const crossingIndex = (this.index + Math.floor(1 + Math.random() * 3)) % 8;
      this.startTrip(crossingIndex);
    }

    // Update trip animation
    if (this.tripping) {
      this.tripProgress += dt;
      if (this.tripProgress > 1.5) {
        this.tripping = false;
      }
    }
  }

  onRender(ctx) {
    if (!this.parent) return;

    const p = ctx.p5;
    const parentPos = this.parent.getWorldPosition();
    const dehydration = this.parent.dehydration || 0;

    // Get color adjusted for dehydration
    const baseRgb = hexToRgb(this.color);
    const clayRgb = hexToRgb(COLORS.clay);
    const rgb = {
      r: baseRgb.r + (clayRgb.r - baseRgb.r) * dehydration * 0.7,
      g: baseRgb.g + (clayRgb.g - baseRgb.g) * dehydration * 0.7,
      b: baseRgb.b + (clayRgb.b - baseRgb.b) * dehydration * 0.7
    };

    const alpha = this.transform.alpha;
    const progress = this.parent.growthProgress || 1;

    if (progress < 0.15) return;
    const tentAlpha = Math.min(1, (progress - 0.15) / 0.15);

    // Calculate trip offset
    let tripOffset = 0;
    if (this.tripping) {
      tripOffset = Math.sin(this.tripProgress * Math.PI) * 30;
    }

    p.push();
    p.translate(parentPos.x, parentPos.y);
    p.rotate(this.baseAngle);

    // Calculate segment points
    this.segmentPoints = [];
    const segmentLength = this.baseLength / this.segmentCount * progress;

    p.noFill();
    p.strokeWeight(this.baseWidth * (1 - dehydration * 0.3));
    p.stroke(rgb.r, rgb.g, rgb.b, tentAlpha * alpha * 0.7 * 255);

    // Draw main tentacle curve
    p.beginShape();

    for (let i = 0; i <= this.segmentCount; i++) {
      const t = i / this.segmentCount;

      // Wave motion
      const wave = Math.sin(t * Math.PI * 3 + ctx.time.total * 2 + this.phaseOffset) * 25 * t;
      const noiseWave = p.noise(t * 2, ctx.time.total + this.phaseOffset) * 20 * t;
      const reachOffset = this.reachAmount * 40 * t;

      const x = t * this.baseLength * progress;
      const y = wave + noiseWave + tripOffset * t + reachOffset * Math.sin(this.baseAngle);

      this.segmentPoints.push({ x, y });
      p.curveVertex(x, y);
    }

    p.endShape();

    // Draw suckers along tentacle
    p.noStroke();
    for (const sucker of this.suckers) {
      const idx = Math.floor(sucker.offset * this.segmentPoints.length);
      if (idx < this.segmentPoints.length) {
        const pt = this.segmentPoints[idx];
        const pulse = 0.8 + Math.sin(ctx.time.total * 2 + sucker.pulse) * 0.2;
        const suckerSize = sucker.size * pulse * tentAlpha;

        // Outer sucker (darker)
        p.fill(rgb.r * 0.6, rgb.g * 0.6, rgb.b * 0.6, tentAlpha * alpha * 200);
        p.ellipse(pt.x, pt.y, suckerSize, suckerSize * 0.7);

        // Inner sucker (darkest)
        p.fill(rgb.r * 0.4, rgb.g * 0.4, rgb.b * 0.4, tentAlpha * alpha * 150);
        p.ellipse(pt.x, pt.y, suckerSize * 0.5, suckerSize * 0.35);
      }
    }

    // Tentacle tip
    if (this.segmentPoints.length > 0) {
      const tip = this.segmentPoints[this.segmentPoints.length - 1];
      p.fill(rgb.r, rgb.g, rgb.b, tentAlpha * alpha * 0.5 * 255);
      p.ellipse(tip.x, tip.y, this.baseWidth * 0.5);
    }

    p.pop();
  }
}
