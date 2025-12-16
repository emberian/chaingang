// ═══════════════════════════════════════════════════════════════════════════
// GNOME - Mycocousin forest spirits with caps, lanterns, and geode eyes
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { PhysicsComponent } from '../../core/Component.js';
import { COLORS, hexToRgb, lerpColor } from '../../config/colors.js';

const CAP_SHAPES = ['round', 'pointed', 'wavy', 'flat'];

export class Gnome extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['gnome', 'character', ...(config.tags || [])]
    });

    this.layer = 'characters';

    // Add physics
    this.addComponent('physics', new PhysicsComponent({
      friction: 0.94
    }));

    // Position
    if (config.x !== undefined) this.transform.x = config.x;
    if (config.y !== undefined) this.transform.y = config.y;
    this.baseX = this.transform.x;
    this.baseY = this.transform.y;

    // Appearance
    this.isElder = config.isElder || Math.random() < 0.08;
    this.size = this.isElder ? (16 + Math.random() * 6) : (8 + Math.random() * 6);
    this.capShape = config.capShape || CAP_SHAPES[Math.floor(Math.random() * CAP_SHAPES.length)];
    this.capColor = config.capColor || lerpColor(COLORS.clay, COLORS.crimson, Math.random());

    // Lantern
    this.lanternGlow = 0.3 + Math.random() * 0.5;
    this.lanternColor = config.lanternColor || (Math.random() < 0.5 ? COLORS.honk : COLORS.amber);

    // Geode eyes
    this.eyeGlow = 0.3 + Math.random() * 0.4;
    this.eyeColor = Math.random() < 0.5 ? COLORS.honk : COLORS.violet;
    this.lookAngle = 0;

    // Animation
    this.bobOffset = Math.random() * Math.PI * 2;

    // Behavior
    this.behavior = config.behavior || ['idle', 'chatting', 'waving', 'curious'][Math.floor(Math.random() * 4)];
    this.behaviorTimer = Math.random() * 3;
    this.chattingWith = -1;

    // Scatter state
    this.scattered = false;
    this.scatterVel = { x: 0, y: 0 };
  }

  onUpdate(ctx, dt) {
    // Bob animation
    const bob = Math.sin(ctx.time.total * 2 + this.bobOffset) * 2;

    // Look toward mouse
    this.lookAngle += (
      Math.atan2(ctx.input.mouseY - this.transform.y, ctx.input.mouseX - this.transform.x) - this.lookAngle
    ) * 0.08;

    // Scatter on fast mouse movement
    const mouseSpeedSq = ctx.input.mouseVel.x * ctx.input.mouseVel.x + ctx.input.mouseVel.y * ctx.input.mouseVel.y;
    if (mouseSpeedSq > 400) {
      const dg = Math.hypot(ctx.input.mouseX - this.transform.x, ctx.input.mouseY - this.transform.y);
      if (dg < 150) {
        this.scattered = true;
        const fleeAngle = Math.atan2(this.transform.y - ctx.input.mouseY, this.transform.x - ctx.input.mouseX);
        this.scatterVel.x = Math.cos(fleeAngle) * 4;
        this.scatterVel.y = Math.sin(fleeAngle) * 3;
      }
    }

    // Return to base position
    if (this.scattered) {
      this.transform.x += this.scatterVel.x;
      this.transform.y += this.scatterVel.y;
      this.scatterVel.x *= 0.94;
      this.scatterVel.y *= 0.94;

      this.transform.x += (this.baseX - this.transform.x) * 0.03;
      this.transform.y += (this.baseY - this.transform.y) * 0.03;

      if (Math.hypot(this.transform.x - this.baseX, this.transform.y - this.baseY) < 2) {
        this.scattered = false;
      }
    }

    // Update behavior
    this.behaviorTimer -= dt;
    if (this.behaviorTimer <= 0) {
      this.behavior = ['idle', 'chatting', 'waving', 'curious'][Math.floor(Math.random() * 4)];
      this.behaviorTimer = 2 + Math.random() * 3;
    }
  }

  onRender(ctx) {
    const p = ctx.p5;
    const bob = Math.sin(ctx.time.total * 2 + this.bobOffset) * 2;
    const alpha = this.transform.alpha;

    // Mouse proximity glow
    const mouseDist = Math.hypot(ctx.input.mouseX - this.transform.x, ctx.input.mouseY - this.transform.y);
    const proximityGlow = Math.max(0, 1 - mouseDist / 150) * 0.6;
    const totalGlow = this.lanternGlow + proximityGlow;

    p.push();
    p.translate(this.transform.x, this.transform.y + bob);

    // Draw cap based on shape
    const capRgb = hexToRgb(this.capColor);
    p.noStroke();
    p.fill(capRgb.r, capRgb.g, capRgb.b, alpha * 255);

    const capSize = this.size;
    switch (this.capShape) {
      case 'round':
        p.ellipse(0, -capSize * 0.3, capSize * 1.3, capSize * 0.9);
        break;
      case 'pointed':
        p.beginShape();
        p.vertex(0, -capSize * 0.8);
        p.vertex(-capSize * 0.6, -capSize * 0.1);
        p.vertex(capSize * 0.6, -capSize * 0.1);
        p.endShape(p.CLOSE);
        break;
      case 'wavy':
        p.beginShape();
        for (let a = 0; a < Math.PI; a += 0.2) {
          const r = capSize * 0.6 + Math.sin(a * 5 + ctx.time.total) * 3;
          p.vertex(Math.cos(a + Math.PI) * r, -capSize * 0.2 + Math.sin(a) * -capSize * 0.4);
        }
        p.endShape(p.CLOSE);
        break;
      case 'flat':
        p.ellipse(0, -capSize * 0.25, capSize * 1.4, capSize * 0.5);
        break;
    }

    // Stem/body
    const boneRgb = hexToRgb(COLORS.bone);
    const clayRgb = hexToRgb(COLORS.clay);
    const stemColor = {
      r: boneRgb.r + (clayRgb.r - boneRgb.r) * 0.3,
      g: boneRgb.g + (clayRgb.g - boneRgb.g) * 0.3,
      b: boneRgb.b + (clayRgb.b - boneRgb.b) * 0.3
    };
    p.fill(stemColor.r, stemColor.g, stemColor.b, alpha * 255);
    p.rect(-capSize * 0.25, -capSize * 0.25, capSize * 0.5, capSize * 0.65, 2);

    // Geode eyes
    const eyeOffset = this.lookAngle < 0 ? -1 : 1;
    const eyeY = -capSize * 0.35;
    const eyeRgb = hexToRgb(this.eyeColor);

    // Eye glow
    p.push();
    p.blendMode(p.ADD);
    p.fill(eyeRgb.r, eyeRgb.g, eyeRgb.b, this.eyeGlow * 80 * alpha);
    p.ellipse(eyeOffset * capSize * 0.12, eyeY, 5, 5);
    p.ellipse(-eyeOffset * capSize * 0.12, eyeY, 5, 5);
    p.pop();

    // Eye dots
    p.fill(eyeRgb.r, eyeRgb.g, eyeRgb.b, 200 * alpha);
    p.ellipse(eyeOffset * capSize * 0.12, eyeY, 3, 3);
    p.ellipse(-eyeOffset * capSize * 0.12, eyeY, 3, 3);

    // Behavior animations
    if (this.behavior === 'waving' && this.behaviorTimer > 1) {
      const waveAngle = Math.sin(ctx.time.total * 8) * 0.3;
      p.push();
      p.translate(capSize * 0.3, -capSize * 0.1);
      p.rotate(waveAngle - 0.5);
      p.stroke(stemColor.r, stemColor.g, stemColor.b, alpha * 255);
      p.strokeWeight(2);
      p.line(0, 0, 0, -capSize * 0.4);
      p.pop();
    }

    // Lantern
    const lanternX = capSize * 0.45;
    const lanternY = -capSize * 0.05;
    const lrgb = hexToRgb(this.lanternColor);

    // Lantern glow
    p.push();
    p.blendMode(p.ADD);
    for (let r = 25; r > 0; r -= 6) {
      p.fill(lrgb.r, lrgb.g, lrgb.b, totalGlow * 0.08 * 255 * alpha);
      p.ellipse(lanternX, lanternY, r);
    }
    p.pop();

    // Lantern body
    p.fill(lrgb.r, lrgb.g, lrgb.b, alpha * 255);
    p.ellipse(lanternX, lanternY, 5);

    // Chatting indicator
    if (this.behavior === 'chatting' && this.chattingWith !== -1) {
      const bubblePhase = Math.sin(ctx.time.total * 3) * 0.5 + 0.5;
      if (bubblePhase > 0.3) {
        p.fill(255, 255, 255, bubblePhase * 100 * alpha);
        p.ellipse(capSize * 0.4, -capSize * 0.7, 6, 5);
        p.ellipse(capSize * 0.55, -capSize * 0.85, 4, 3);
      }
    }

    p.pop();
  }
}
