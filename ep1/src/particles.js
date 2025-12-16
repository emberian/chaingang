// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE SYSTEMS - The Thirteenth Turning
// ═══════════════════════════════════════════════════════════════════════════

import { COLORS, hexToRgb } from './colors.js';
import { state } from './state.js';

// ─── VOID PARTICLES ────────────────────────────────────────────────────────
export class VoidParticle {
  constructor(p5) {
    this.reset(p5);
    this.y = p5.random(state.height);
  }

  reset(p5) {
    this.x = p5.random(state.width);
    this.y = p5.random(-50, 0);
    this.baseX = this.x;
    this.baseY = this.y;
    this.size = p5.random(1, 4);
    this.speed = p5.random(0.2, 0.8);
    this.offset = p5.random(1000);
    this.hue = p5.random() < 0.3 ? 'violet' : 'void';
  }

  update(p5, dt, centerPull) {
    // Perlin noise movement
    const n = p5.noise(this.x * 0.003 + this.offset, this.y * 0.003, state.totalTime * 0.2);
    const angle = n * p5.TWO_PI * 2;

    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;

    // Drift toward center
    const dx = state.width / 2 - this.x;
    const dy = state.height / 2 - this.y;
    this.x += dx * centerPull;
    this.y += dy * centerPull;

    // Mouse interaction
    const mouseDist = p5.dist(state.mouseX, state.mouseY, this.x, this.y);
    if (mouseDist < 200) {
      const repelStrength = p5.map(mouseDist, 0, 200, 3, 0);
      const repelAngle = Math.atan2(this.y - state.mouseY, this.x - state.mouseX);
      this.x += Math.cos(repelAngle) * repelStrength;
      this.y += Math.sin(repelAngle) * repelStrength;
    }

    // Gather around still mouse
    if (state.mouseStillTime > 1 && mouseDist < 150) {
      const gatherStrength = p5.map(state.mouseStillTime, 1, 3, 0, 0.02);
      this.x += (state.mouseX - this.x) * gatherStrength;
      this.y += (state.mouseY - this.y) * gatherStrength;
    }

    // Wrap around edges
    if (this.x < 0) this.x = state.width;
    if (this.x > state.width) this.x = 0;
    if (this.y < 0) this.y = state.height;
    if (this.y > state.height) this.y = 0;
  }

  draw(p5) {
    const distFromCenter = p5.dist(this.x, this.y, state.width / 2, state.height / 2);
    const brightness = p5.map(distFromCenter, 0, state.width / 2, 1, 0.3);

    if (this.hue === 'violet') {
      p5.fill(153, 50, 204, brightness * 0.4 * 255);
    } else {
      p5.fill(100, 80, 150, brightness * 0.3 * 255);
    }
    p5.noStroke();
    const size = this.size * (1 + Math.sin(state.totalTime * 2 + this.offset) * 0.3);
    p5.ellipse(this.x, this.y, size);
  }
}

// ─── AUTUMN LEAF ───────────────────────────────────────────────────────────
export class AutumnLeaf {
  constructor(p5) {
    this.reset(p5);
  }

  reset(p5) {
    this.x = p5.random(state.width);
    this.y = p5.random(-100, -20);
    this.vx = p5.random(-0.5, 0.5);
    this.vy = p5.random(0.5, 1.5);
    this.rotation = p5.random(p5.TWO_PI);
    this.rotSpeed = p5.random(-0.03, 0.03);
    this.size = p5.random(8, 18);
    this.life = 1;
    this.color = p5.random() < 0.6 ? COLORS.crimson : COLORS.amber;
    this.wobbleOffset = p5.random(1000);
  }

  update(p5, dt) {
    this.x += this.vx + Math.sin(state.totalTime + this.wobbleOffset) * 0.5;
    this.y += this.vy;
    this.rotation += this.rotSpeed;

    // Wind gusts
    if (p5.random() < 0.01) {
      this.vx += p5.random(-0.5, 0.5);
    }
    this.vx *= 0.99;

    return this.y < state.height + 50;
  }

  draw(p5) {
    p5.push();
    p5.translate(this.x, this.y);
    p5.rotate(this.rotation);

    const rgb = hexToRgb(this.color);
    p5.fill(rgb.r, rgb.g, rgb.b, 180);
    p5.noStroke();

    // Leaf shape
    p5.beginShape();
    p5.vertex(0, -this.size / 2);
    p5.bezierVertex(
      this.size / 2, -this.size / 4,
      this.size / 2, this.size / 4,
      0, this.size / 2
    );
    p5.bezierVertex(
      -this.size / 2, this.size / 4,
      -this.size / 2, -this.size / 4,
      0, -this.size / 2
    );
    p5.endShape();

    // Leaf vein
    p5.stroke(rgb.r * 0.7, rgb.g * 0.7, rgb.b * 0.7, 100);
    p5.strokeWeight(0.5);
    p5.line(0, -this.size / 2 + 2, 0, this.size / 2 - 2);

    p5.pop();
  }
}

// ─── WOODSMOKE PARTICLE ────────────────────────────────────────────────────
export class WoodsmokeParticle {
  constructor(p5, x, y) {
    this.x = x || p5.random(state.width);
    this.y = y || state.height + 20;
    this.vx = p5.random(-0.3, 0.3);
    this.vy = p5.random(-0.5, -1.2);
    this.size = p5.random(15, 40);
    this.life = 1;
    this.maxLife = p5.random(3, 6);
    this.wobbleOffset = p5.random(1000);
  }

  update(p5, dt) {
    this.x += this.vx + Math.sin(state.totalTime * 0.5 + this.wobbleOffset) * 0.2;
    this.y += this.vy;
    this.life -= dt / this.maxLife;
    this.size += dt * 5;

    return this.life > 0;
  }

  draw(p5) {
    const alpha = this.life * 0.15;
    const rgb = hexToRgb(COLORS.woodsmoke);
    p5.noStroke();
    p5.fill(rgb.r, rgb.g, rgb.b, alpha * 255);
    p5.ellipse(this.x, this.y, this.size);
  }
}

// ─── SPORE PARTICLE ────────────────────────────────────────────────────────
export class SporeParticle {
  constructor(p5) {
    this.reset(p5);
  }

  reset(p5) {
    this.x = p5.random(state.width);
    this.y = p5.random(state.height);
    this.size = p5.random(2, 5);
    this.speed = p5.random(0.1, 0.3);
    this.offset = p5.random(1000);
    this.pulseOffset = p5.random(p5.TWO_PI);
  }

  update(p5, dt) {
    const n = p5.noise(this.x * 0.005 + this.offset, this.y * 0.005, state.totalTime * 0.1);
    const angle = n * p5.TWO_PI * 2;

    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed - 0.1; // Slight upward drift

    // Wrap
    if (this.x < 0) this.x = state.width;
    if (this.x > state.width) this.x = 0;
    if (this.y < 0) this.y = state.height;
    if (this.y > state.height) this.y = 0;
  }

  draw(p5) {
    const pulse = 0.5 + Math.sin(state.totalTime * 2 + this.pulseOffset) * 0.3;
    const rgb = hexToRgb(COLORS.pink);
    p5.noStroke();
    p5.fill(rgb.r, rgb.g, rgb.b, pulse * 150);
    p5.ellipse(this.x, this.y, this.size * (0.8 + pulse * 0.4));
  }
}

// ─── FROST CRYSTAL ─────────────────────────────────────────────────────────
export class FrostCrystal {
  constructor(p5, edge) {
    this.edge = edge; // 'top', 'bottom', 'left', 'right'
    this.reset(p5);
  }

  reset(p5) {
    switch (this.edge) {
      case 'top':
        this.x = p5.random(state.width);
        this.y = 0;
        break;
      case 'bottom':
        this.x = p5.random(state.width);
        this.y = state.height;
        break;
      case 'left':
        this.x = 0;
        this.y = p5.random(state.height);
        break;
      case 'right':
        this.x = state.width;
        this.y = p5.random(state.height);
        break;
    }
    this.size = p5.random(10, 30);
    this.rotation = p5.random(p5.TWO_PI);
    this.branches = Math.floor(p5.random(4, 7));
    this.opacity = 0;
    this.growing = true;
  }

  update(p5, dt, progress) {
    if (this.growing && progress > 0.5) {
      this.opacity = Math.min(0.6, this.opacity + dt * 0.3);
    }
  }

  draw(p5) {
    if (this.opacity < 0.01) return;

    p5.push();
    p5.translate(this.x, this.y);
    p5.rotate(this.rotation);

    const rgb = hexToRgb(COLORS.frost);
    p5.stroke(rgb.r, rgb.g, rgb.b, this.opacity * 255);
    p5.strokeWeight(1);
    p5.noFill();

    // Draw crystal branches
    for (let i = 0; i < this.branches; i++) {
      const angle = (i / this.branches) * p5.TWO_PI;
      const len = this.size;

      p5.push();
      p5.rotate(angle);
      p5.line(0, 0, len, 0);

      // Sub-branches
      p5.translate(len * 0.5, 0);
      p5.line(0, 0, len * 0.3, -len * 0.2);
      p5.line(0, 0, len * 0.3, len * 0.2);

      p5.translate(len * 0.3, 0);
      p5.line(0, 0, len * 0.2, -len * 0.15);
      p5.line(0, 0, len * 0.2, len * 0.15);

      p5.pop();
    }

    p5.pop();
  }
}

// ─── INK SPRAY PARTICLE ────────────────────────────────────────────────────
export class InkSpray {
  constructor(p5, x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx + p5.random(-2, 2);
    this.vy = vy + p5.random(-2, 2);
    this.size = p5.random(5, 15);
    this.life = 1;
    this.color = p5.random() < 0.5 ? COLORS.violet : COLORS.indigo;
  }

  update(p5, dt) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.life -= dt * 0.8;

    return this.life > 0;
  }

  draw(p5) {
    const rgb = hexToRgb(this.color);
    p5.noStroke();
    p5.fill(rgb.r, rgb.g, rgb.b, this.life * 0.5 * 255);
    p5.ellipse(this.x, this.y, this.size * this.life);
  }
}

// ─── AURORA TRAIL ──────────────────────────────────────────────────────────
export class AuroraTrail {
  constructor(p5, x, y) {
    this.x = x;
    this.y = y;
    this.life = 1;
    this.hue = p5.map(Math.sin(state.totalTime), -1, 1, 180, 280);
  }

  update(dt) {
    this.life -= dt * 1.5;
    return this.life > 0;
  }

  draw(p5) {
    const size = this.life * 30;
    p5.noStroke();
    // Use HSL for aurora effect
    p5.drawingContext.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.life * 0.3})`;
    p5.ellipse(this.x, this.y, size);
  }
}

// ─── PENTAD SYMBOL PARTICLE ────────────────────────────────────────────────
export class PentadSymbol {
  constructor(p5, type) {
    this.type = type; // 'boon', 'bane', 'bone', 'bonk', 'honk'
    this.reset(p5);
  }

  reset(p5) {
    this.x = p5.random(state.width);
    this.y = p5.random(state.height);
    this.vx = p5.random(-0.2, 0.2);
    this.vy = p5.random(-0.2, 0.2);
    this.rotation = p5.random(p5.TWO_PI);
    this.rotSpeed = p5.random(-0.01, 0.01);
    this.size = p5.random(12, 24);
    this.opacity = p5.random(0.2, 0.5);
    this.pulseOffset = p5.random(p5.TWO_PI);
  }

  update(p5, dt) {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotSpeed;

    // Wrap
    if (this.x < -50) this.x = state.width + 50;
    if (this.x > state.width + 50) this.x = -50;
    if (this.y < -50) this.y = state.height + 50;
    if (this.y > state.height + 50) this.y = -50;
  }

  draw(p5) {
    const symbols = {
      boon: '!',
      bane: '~',
      bone: '^',
      bonk: '<>',
      honk: '?'
    };
    const colors = {
      boon: COLORS.boon,
      bane: COLORS.bane,
      bone: COLORS.bone,
      bonk: COLORS.bonk,
      honk: COLORS.honk
    };

    const pulse = 0.8 + Math.sin(state.totalTime + this.pulseOffset) * 0.2;
    const rgb = hexToRgb(colors[this.type]);

    p5.push();
    p5.translate(this.x, this.y);
    p5.rotate(this.rotation);

    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(this.size);
    p5.fill(rgb.r, rgb.g, rgb.b, this.opacity * pulse * 255);
    p5.text(symbols[this.type], 0, 0);

    p5.pop();
  }
}
