// ═══════════════════════════════════════════════════════════════════════════
// POLVO - Octopus character with tentacles, spiral, dehydration, and eye tracking
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { Tentacle } from './Tentacle.js';
import { COLORS, hexToRgb, lerpColor } from '../../config/colors.js';

export class Polvo extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['polvo', 'character', ...(config.tags || [])]
    });

    this.layer = 'characters';

    // Body properties
    this.bodyColor = config.bodyColor || COLORS.teal;

    // State
    this.growthProgress = 0;
    this.spiralGrowth = 0;

    // Dehydration state (when mouse is still)
    this.dehydration = 0;
    this.dehydrationRate = 0.1;
    this.recoveryRate = 0.3;
    this.dehydrationThreshold = 3; // seconds of stillness

    // Eye tracking
    this.eyeLook = { x: 0, y: 0 };
    this.eyeTrackSpeed = 0.1;
    this.blinkTimer = 0;
    this.blinkPhase = 0;

    // Tentacles (will be spawned)
    this.tentacles = [];
    this.tentacleCount = config.tentacleCount || 8;
  }

  onSpawn(ctx) {
    // Spawn tentacles
    for (let i = 0; i < this.tentacleCount; i++) {
      const tentacle = ctx.entities.spawn(Tentacle, {
        parent: this,
        index: i,
        color: this.bodyColor
      });
      this.tentacles.push(tentacle);
    }
  }

  setProgress(progress) {
    this.growthProgress = progress;
  }

  onUpdate(ctx, dt) {
    // Growth animation
    this.spiralGrowth += (this.growthProgress - this.spiralGrowth) * 0.02;

    // Dehydration mechanic - Polvo dries out when mouse is still
    if (ctx.input.mouseStillTime > this.dehydrationThreshold) {
      this.dehydration = Math.min(1, this.dehydration + dt * this.dehydrationRate);
    } else {
      this.dehydration = Math.max(0, this.dehydration - dt * this.recoveryRate);
    }

    // Eye tracking - smooth follow mouse
    const eyeCenterX = this.transform.x;
    const eyeCenterY = this.transform.y - 30;
    const targetX = (ctx.input.mouseX - eyeCenterX) * 0.15;
    const targetY = (ctx.input.mouseY - eyeCenterY) * 0.15;

    this.eyeLook.x += (targetX - this.eyeLook.x) * this.eyeTrackSpeed;
    this.eyeLook.y += (targetY - this.eyeLook.y) * this.eyeTrackSpeed;

    // Blink animation
    this.blinkPhase = Math.sin(ctx.time.total * 0.3);
  }

  onRender(ctx) {
    const p = ctx.p5;
    const x = this.transform.x;
    const y = this.transform.y;
    const alpha = this.transform.alpha;
    const progress = this.growthProgress;

    // Draw spiral first (behind body)
    this.drawSpiral(ctx, x, y, alpha);

    // Draw body
    if (progress > 0.2) {
      this.drawBody(ctx, x, y - 30, alpha, progress);
    }
  }

  drawSpiral(ctx, centerX, centerY, alpha) {
    const p = ctx.p5;

    // Mouse warps spiral
    const mouseOffsetX = (ctx.input.mouseX - centerX) * 0.001;
    const mouseOffsetY = (ctx.input.mouseY - centerY) * 0.001;

    p.push();
    p.translate(centerX, centerY);
    p.noFill();
    p.strokeWeight(2);

    const maxCoils = Math.floor(this.spiralGrowth * 8);
    const coilDetail = this.spiralGrowth * p.TWO_PI * 8;

    // Draw 3 layers of spiral
    for (let layer = 0; layer < 3; layer++) {
      const layerOffset = layer * 0.5;

      // Interpolate color between violet and teal
      const t = layer / 3;
      const violetRgb = hexToRgb(COLORS.violet);
      const tealRgb = hexToRgb(COLORS.teal);
      const rgb = {
        r: violetRgb.r + (tealRgb.r - violetRgb.r) * t,
        g: violetRgb.g + (tealRgb.g - violetRgb.g) * t,
        b: violetRgb.b + (tealRgb.b - violetRgb.b) * t
      };

      // Dehydration desaturates colors
      const dehydratedAlpha = (0.4 - layer * 0.1) * (1 - this.dehydration * 0.5);
      p.stroke(rgb.r, rgb.g, rgb.b, dehydratedAlpha * alpha * 255);

      p.beginShape();
      for (let a = 0; a < coilDetail; a += 0.1) {
        let r = a * 8 + layerOffset * 20;

        // Noise displacement
        const noiseVal = p.noise(a * 0.3, ctx.time.total * 0.3 + layer);
        r += noiseVal * 15;

        // Mouse warp effect
        const warpX = Math.cos(a) * r;
        const warpY = Math.sin(a) * r;
        const distToMouse = p.dist(warpX + centerX, warpY + centerY, ctx.input.mouseX, ctx.input.mouseY);
        const warpStrength = p.map(distToMouse, 0, 200, 30, 0, true);

        const finalX = warpX + (ctx.input.mouseX - centerX - warpX) * warpStrength * 0.05;
        const finalY = warpY + (ctx.input.mouseY - centerY - warpY) * warpStrength * 0.05;

        p.curveVertex(finalX, finalY);
      }
      p.endShape();
    }

    p.pop();
  }

  drawBody(ctx, x, y, alpha, progress) {
    const p = ctx.p5;

    const bodyAlpha = p.map(progress, 0.2, 0.4, 0, 1, true);
    const bodyScale = p.map(progress, 0.2, 0.5, 0.5, 1, true);

    // Color shifts with dehydration
    const baseRgb = hexToRgb(this.bodyColor);
    const clayRgb = hexToRgb(COLORS.clay);
    const rgb = {
      r: baseRgb.r + (clayRgb.r - baseRgb.r) * this.dehydration,
      g: baseRgb.g + (clayRgb.g - baseRgb.g) * this.dehydration,
      b: baseRgb.b + (clayRgb.b - baseRgb.b) * this.dehydration
    };

    p.push();
    p.translate(x, y);
    p.scale(bodyScale);

    // Mantle (head) - organic bezier shape
    p.noStroke();
    p.fill(rgb.r, rgb.g, rgb.b, bodyAlpha * alpha * 200);

    p.beginShape();
    p.vertex(0, -60);
    p.bezierVertex(-40, -50, -50, -20, -45, 10);
    p.bezierVertex(-40, 30, -20, 40, 0, 35);
    p.bezierVertex(20, 40, 40, 30, 45, 10);
    p.bezierVertex(50, -20, 40, -50, 0, -60);
    p.endShape(p.CLOSE);

    // Dehydration cracks
    if (this.dehydration > 0.3) {
      this.drawCracks(p, bodyAlpha * alpha);
    }

    // Eyes
    this.drawEyes(p, bodyAlpha * alpha);

    p.pop();
  }

  drawCracks(p, alpha) {
    const crackAlpha = (this.dehydration - 0.3) * 1.4;
    const boneRgb = hexToRgb(COLORS.bone);

    p.stroke(boneRgb.r, boneRgb.g, boneRgb.b, crackAlpha * alpha * 150);
    p.strokeWeight(1);
    p.noFill();

    // Random crack lines based on noise
    for (let i = 0; i < 5; i++) {
      const startX = p.noise(i * 10) * 60 - 30;
      const startY = p.noise(i * 10 + 100) * 50 - 25;

      p.beginShape();
      p.vertex(startX, startY);
      for (let j = 0; j < 3; j++) {
        const dx = p.noise(i * 10 + j) * 20 - 10;
        const dy = p.noise(i * 10 + j + 50) * 20;
        p.vertex(startX + dx, startY + dy);
      }
      p.endShape();
    }
  }

  drawEyes(p, alpha) {
    const eyeY = -20;
    const eyeSpacing = 25;
    const blink = this.blinkPhase > 0.95 ? 0.2 : 1;

    for (let side of [-1, 1]) {
      const eyeX = side * eyeSpacing;

      // Eye white
      p.fill(240, 235, 230, alpha * 255);
      p.noStroke();
      p.ellipse(eyeX, eyeY, 22, 26 * blink);

      // Pupil (follows mouse)
      const pupilX = eyeX + p.constrain(this.eyeLook.x, -6, 6);
      const pupilY = eyeY + p.constrain(this.eyeLook.y, -6, 6) * blink;

      p.fill(20, 15, 30, alpha * 255);
      p.ellipse(pupilX, pupilY, 10, 12 * blink);

      // Eye highlight
      p.fill(255, 255, 255, alpha * 200);
      p.ellipse(pupilX - 2, pupilY - 2, 3, 3 * blink);
    }
  }

  onDispose(ctx) {
    // Dispose tentacles
    for (const tentacle of this.tentacles) {
      ctx.entities.dispose(tentacle);
    }
    this.tentacles = [];
  }
}
