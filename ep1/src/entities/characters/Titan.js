// ═══════════════════════════════════════════════════════════════════════════
// TITAN - The Thirteenth Turning entity with particle body and beard gnomes
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { COLORS, hexToRgb, lerpColor } from '../../config/colors.js';

export class Titan extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['titan', 'character', ...(config.tags || [])]
    });

    this.layer = 'characters';

    // Position
    if (config.x !== undefined) this.transform.x = config.x;
    if (config.y !== undefined) this.transform.y = config.y;

    // Scale
    this.titanScale = 0.5;
    this.targetScale = 1.1;

    // Animation
    this.titanBreath = 0;
    this.thirdEyeGlow = 0;
    this.heartbeatTimer = 0;

    // Create body particles
    this.bodyParticles = [];
    for (let i = 0; i < 400; i++) {
      this.bodyParticles.push({
        t: i / 400,
        offset: Math.random() * 1000,
        size: 4 + Math.random() * 5,
        colorMix: Math.random()
      });
    }

    // Create beard gnomes
    this.beardGnomes = [];
    for (let i = 0; i < 50; i++) {
      this.beardGnomes.push({
        offsetX: (Math.random() - 0.5) * 100,
        offsetY: 30 + i * 3.5,
        size: 4 + Math.random() * 4,
        lanternColor: Math.random() < 0.5 ? COLORS.honk : COLORS.amber,
        lanternPhase: Math.random() * Math.PI * 2,
        waving: Math.random() < 0.2,
        lookingAround: Math.random() < 0.3
      });
    }

    // Eye state
    this.eyeTargetX = 0;
    this.eyeTargetY = 0;
    this.blinkPhase = 0;

    // Audio callback
    this.onHeartbeat = config.onHeartbeat || null;
  }

  setProgress(progress) {
    this.titanScale += (0.5 + progress * 0.6 - this.titanScale) * 0.02;
    this.thirdEyeGlow += (progress * 0.8 - this.thirdEyeGlow) * 0.02;
  }

  onUpdate(ctx, dt) {
    // Breathing
    this.titanBreath += dt;

    // Eye tracking
    this.eyeTargetX = (ctx.input.mouseX - this.transform.x) * 0.08;
    this.eyeTargetY = (ctx.input.mouseY - this.transform.y) * 0.08;

    // Blink
    this.blinkPhase = Math.sin(ctx.time.total * 0.4);

    // Heartbeat
    this.heartbeatTimer += dt;
    if (this.heartbeatTimer > 1.5) {
      this.heartbeatTimer = 0;
      if (this.onHeartbeat) this.onHeartbeat();
    }

    // Update beard gnomes
    this.beardGnomes.forEach(gnome => {
      gnome.lanternPhase += dt * 2;
    });
  }

  onRender(ctx) {
    const p = ctx.p5;
    const x = this.transform.x;
    const y = this.transform.y - 50;
    const alpha = this.transform.alpha;

    const breathScale = 1 + Math.sin(this.titanBreath * 0.8) * 0.03;

    p.push();
    p.translate(x, y);
    p.scale(this.titanScale * breathScale);

    // Titan leans based on mouse position
    const leanAmount = (ctx.input.mouseX - x) * 0.00008;
    p.rotate(leanAmount);

    // Forward lean when mouse approaches
    const mouseDistFromTitan = Math.hypot(ctx.input.mouseX - x, ctx.input.mouseY - y);
    const forwardLean = Math.max(0, Math.min(0.03, (300 - mouseDistFromTitan) / 200 * 0.03));
    p.translate(0, forwardLean * 60);

    // Draw body (particle cloud silhouette)
    this.drawTitanBody(p, ctx, alpha);

    // Draw geode eyes
    this.drawTitanEyes(p, ctx, alpha, x, y);

    // Draw third eye
    this.drawThirdEye(p, ctx, alpha);

    // Draw beard of tiny gnomes
    this.drawBeardGnomes(p, ctx, alpha);

    p.pop();
  }

  drawTitanBody(p, ctx, alpha) {
    p.noStroke();

    this.bodyParticles.forEach(particle => {
      const t = particle.t;
      const bodyY = -220 + t * 400;

      // Body width varies
      let bodyWidth;
      if (t < 0.25) {
        bodyWidth = 35 + t * 4 * 55; // Head
      } else if (t < 0.45) {
        bodyWidth = 90 + (t - 0.25) * 5 * 50; // Neck/shoulders
      } else {
        bodyWidth = 140 - (t - 0.45) * (70 / 0.55); // Torso tapering
      }

      const px = p.noise(particle.offset, ctx.time.total * 0.25) * bodyWidth - bodyWidth / 2;
      const py = bodyY + p.noise(particle.offset + 100, ctx.time.total * 0.25) * 12;
      const ps = particle.size;

      const c = lerpColor(COLORS.clay, COLORS.violet, p.noise(particle.offset * 0.05, ctx.time.total * 0.15));
      const rgb = hexToRgb(c);
      p.fill(rgb.r, rgb.g, rgb.b, alpha * 0.6 * 255);
      p.ellipse(px, py, ps);
    });
  }

  drawTitanEyes(p, ctx, alpha, titanX, titanY) {
    const eyeY = -170;
    const eyeSpacing = 40;

    // Blinking
    const blink = this.blinkPhase > 0.97 ? 0.15 : 1;

    // Pupil dilation based on mouse proximity
    const mouseDist = Math.hypot(ctx.input.mouseX - titanX, ctx.input.mouseY - titanY);
    const pupilDilation = Math.min(1.5, Math.max(1, 1 + (500 - mouseDist) / 800));

    for (const side of [-1, 1]) {
      const eyeX = side * eyeSpacing;
      const eyeColor = side < 0 ? COLORS.honk : COLORS.violet;
      const eyeRgb = hexToRgb(eyeColor);

      // Eye socket
      p.fill(20, 10, 30, alpha * 255);
      p.noStroke();
      p.ellipse(eyeX, eyeY, 35, 42 * blink);

      // Geode glow
      p.push();
      p.blendMode(p.ADD);
      for (let r = 30; r > 0; r -= 6) {
        p.fill(eyeRgb.r, eyeRgb.g, eyeRgb.b, 0.12 * (1 - r / 30) * 255 * blink * alpha);
        p.ellipse(eyeX, eyeY, r, r * blink);
      }
      p.pop();

      // Pupil (follows mouse)
      p.fill(eyeRgb.r, eyeRgb.g, eyeRgb.b, alpha * 255);
      const pupilX = eyeX + Math.max(-10, Math.min(10, this.eyeTargetX));
      const pupilY = eyeY + Math.max(-10, Math.min(10, this.eyeTargetY)) * blink;
      const pupilSize = 10 * pupilDilation;
      p.ellipse(pupilX, pupilY, pupilSize, pupilSize * blink);

      // Pupil highlight
      p.fill(255, 255, 255, 200 * alpha);
      p.ellipse(pupilX - 2, pupilY - 2 * blink, 3, 3 * blink);
    }
  }

  drawThirdEye(p, ctx, alpha) {
    if (this.thirdEyeGlow < 0.1) return;

    const eyeY = -200;
    const glowRgb = hexToRgb(COLORS.honk);

    p.push();
    p.translate(0, eyeY);

    // Glow
    p.blendMode(p.ADD);
    for (let r = 40; r > 0; r -= 8) {
      p.fill(glowRgb.r, glowRgb.g, glowRgb.b, this.thirdEyeGlow * 0.1 * 255 * alpha);
      p.ellipse(0, 0, r);
    }

    // Triangle outline
    p.noFill();
    p.stroke(glowRgb.r, glowRgb.g, glowRgb.b, this.thirdEyeGlow * 200 * alpha);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(0, -15);
    p.vertex(-12, 10);
    p.vertex(12, 10);
    p.endShape(p.CLOSE);

    // Inner eye
    p.fill(glowRgb.r, glowRgb.g, glowRgb.b, this.thirdEyeGlow * 255 * alpha);
    p.noStroke();
    p.ellipse(0, 0, 8);

    p.pop();
  }

  drawBeardGnomes(p, ctx, alpha) {
    p.push();
    p.translate(0, -100);

    this.beardGnomes.forEach((gnome, i) => {
      const waveOffset = gnome.waving ? Math.sin(ctx.time.total * 6 + i) * 2 : 0;
      const lookOffset = gnome.lookingAround ? Math.sin(ctx.time.total * 2 + i * 0.5) * 3 : 0;

      const gx = gnome.offsetX + p.noise(i * 0.3, ctx.time.total * 0.4) * 15 - 7.5 + lookOffset;
      const gy = gnome.offsetY + Math.sin(ctx.time.total + i * 0.5) * 2;

      // Tiny gnome silhouette
      p.fill(55, 45, 65, 200 * alpha);
      p.noStroke();
      p.ellipse(gx, gy, gnome.size, gnome.size * 0.85); // cap
      p.rect(gx - gnome.size * 0.3, gy, gnome.size * 0.6, gnome.size * 0.7); // body

      // Waving arm
      if (gnome.waving) {
        p.push();
        p.translate(gx + gnome.size * 0.3, gy + gnome.size * 0.2);
        p.rotate(Math.sin(ctx.time.total * 8 + i) * 0.4 - 0.3);
        p.stroke(55, 45, 65, 200 * alpha);
        p.strokeWeight(1);
        p.line(0, 0, 0, -gnome.size * 0.5);
        p.pop();
      }

      // Tiny lantern
      p.push();
      p.blendMode(p.ADD);
      const lanternGlow = 0.5 + Math.sin(gnome.lanternPhase) * 0.3;
      const lrgb = hexToRgb(gnome.lanternColor);
      p.fill(lrgb.r, lrgb.g, lrgb.b, lanternGlow * 150 * alpha);
      p.ellipse(gx + gnome.size * 0.4 + waveOffset, gy + gnome.size * 0.3, 4);
      p.pop();
    });

    p.pop();
  }
}
