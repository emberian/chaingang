// ═══════════════════════════════════════════════════════════════════════════
// IGNITION SEGMENT - First HONK, name speaks itself
// "the unpronounceable speaks itself"
// ═══════════════════════════════════════════════════════════════════════════

import { Segment } from '../timeline/Choreography.js';
import { PentadSymbol } from '../entities/index.js';
import { COLORS, hexToRgb, lerpColor } from '../config/colors.js';

const NAME_LETTERS = "l'n'd'r Bjrnkpfptf".split('');

export const ignitionSegment = new Segment({
  name: 'ignition',
  duration: 30,
  flexible: false,

  setup(ctx, segment) {
    // Create orbiting letter fragments
    segment.state = {
      letterFragments: NAME_LETTERS.map((char, i) => ({
        char: char,
        angle: (Math.PI * 2 / NAME_LETTERS.length) * i,
        radius: 80 + Math.random() * 120,
        speed: (0.3 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1),
        verticalOffset: Math.random() * 60 - 30,
        size: 14 + Math.random() * 14,
        opacity: 0,
        scattered: false,
        scatterX: 0,
        scatterY: 0
      })),
      glyphAngle: 0,
      honkTriggered: false
    };

    // Create pentad symbols (more prominent)
    const types = ['boon', 'bane', 'bone', 'bonk', 'honk'];
    for (let i = 0; i < 20; i++) {
      ctx.entities.spawn(PentadSymbol, {
        tags: ['ignition-symbol'],
        type: types[i % 5],
        opacity: 0.3,
        width: ctx.width,
        height: ctx.height
      });
    }

    // Start audio drone
    ctx.audio?.updateDrone(1, 0);
  },

  update(ctx, segment, dt) {
    const progress = segment.getProgress();
    const state = segment.state;

    state.glyphAngle += dt * 0.3;

    // Update letter fragments
    state.letterFragments.forEach(frag => {
      frag.opacity = Math.min(1, frag.opacity + dt * 0.5);
      frag.angle += frag.speed * dt;

      // Calculate fragment position
      const fragX = ctx.width / 2 + Math.cos(frag.angle) * frag.radius;
      const fragY = ctx.height / 2 + Math.sin(frag.angle) * frag.radius + frag.verticalOffset;

      // Mouse scatters letters
      const mouseDistToFrag = Math.hypot(ctx.input.mouseX - fragX, ctx.input.mouseY - fragY);

      if (mouseDistToFrag < 100) {
        frag.scattered = true;
        const scatterAngle = Math.atan2(fragY - ctx.input.mouseY, fragX - ctx.input.mouseX);
        const scatterStrength = (100 - mouseDistToFrag) / 100 * 40;
        frag.scatterX = Math.cos(scatterAngle) * scatterStrength;
        frag.scatterY = Math.sin(scatterAngle) * scatterStrength;
      } else {
        frag.scattered = false;
        frag.scatterX *= 0.9;
        frag.scatterY *= 0.9;
      }
    });

    // Trigger HONK at peak
    if (progress > 0.7 && !state.honkTriggered) {
      state.honkTriggered = true;
      ctx.audio?.playHonk();
    }

    // Update audio drone
    ctx.audio?.updateDrone(1, progress);
  },

  render(ctx, segment) {
    const p = ctx.p5;
    const progress = segment.getProgress();
    const state = segment.state;
    const centerX = ctx.width / 2;
    const centerY = ctx.height / 2;

    // Background glow
    p.push();
    p.blendMode(p.ADD);

    const glowIntensity = Math.min(1, progress * 2);
    const glowColor = lerpColor(COLORS.violet, COLORS.honk, progress);
    const glowRgb = hexToRgb(glowColor);

    for (let r = 300; r > 0; r -= 30) {
      p.fill(glowRgb.r, glowRgb.g, glowRgb.b, 0.02 * glowIntensity * 255);
      p.noStroke();
      p.ellipse(centerX, centerY, r * 2);
    }
    p.pop();

    // Radial waves
    p.push();
    p.noFill();
    const honkRgb = hexToRgb(COLORS.honk);
    for (let i = 0; i < 5; i++) {
      const waveProgress = (progress * 3 + i / 5) % 1;
      const waveRadius = waveProgress * 400;
      const waveAlpha = (1 - waveProgress) * 0.3;
      p.stroke(honkRgb.r, honkRgb.g, honkRgb.b, waveAlpha * 255);
      p.strokeWeight(2);
      p.ellipse(centerX, centerY, waveRadius * 2);
    }
    p.pop();

    // Central glyph
    drawGlyph(p, ctx, state, centerX, centerY, progress);

    // Orbiting letter fragments
    drawLetterFragments(p, ctx, state, centerX, centerY, progress);

    // Mouse hold creates pulse
    if (p.mouseIsPressed) {
      p.push();
      p.blendMode(p.ADD);
      const pulseSize = (Math.sin(ctx.time.total * 10) * 0.5 + 0.5) * 50 + 20;
      p.fill(honkRgb.r, honkRgb.g, honkRgb.b, 0.2 * 255);
      p.noStroke();
      p.ellipse(ctx.input.mouseX, ctx.input.mouseY, pulseSize);
      p.pop();
    }
  },

  teardown(ctx, segment) {
    // Fade ignition symbols
    const symbols = ctx.entities.getByTag('ignition-symbol');
    for (const s of symbols) {
      ctx.entities.dispose(s);
    }
  }
});

function drawGlyph(p, ctx, state, centerX, centerY, progress) {
  p.push();
  p.translate(centerX, centerY);
  p.rotate(state.glyphAngle * 0.1);

  const mouseDistFromCenter = Math.hypot(ctx.input.mouseX - centerX, ctx.input.mouseY - centerY);
  const glyphGlow = Math.max(0.3, 1 - mouseDistFromCenter / 300 * 0.7);

  const glyphColor = lerpColor(COLORS.amber, COLORS.honk, progress);
  const glyphRgb = hexToRgb(glyphColor);

  p.noFill();
  p.stroke(glyphRgb.r, glyphRgb.g, glyphRgb.b, glyphGlow * 255);
  p.strokeWeight(3);

  // Organic tentacle-like glyph
  p.beginShape();
  for (let a = 0; a < Math.PI * 2; a += 0.1) {
    const r = 60 + Math.sin(a * 3 + ctx.time.total) * 20 + p.noise(a, ctx.time.total * 0.5) * 30;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    p.curveVertex(x, y);
  }
  p.endShape(p.CLOSE);

  // Inner glyph detail
  p.stroke(glyphRgb.r, glyphRgb.g, glyphRgb.b, glyphGlow * 0.5 * 255);
  p.strokeWeight(1.5);

  for (let i = 0; i < 3; i++) {
    p.beginShape();
    for (let a = 0; a < Math.PI * 2; a += 0.15) {
      const r = 30 + i * 10 + Math.sin(a * 5 + ctx.time.total * 1.5 + i) * 10;
      p.curveVertex(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.endShape(p.CLOSE);
  }

  p.pop();
}

function drawLetterFragments(p, ctx, state, centerX, centerY, progress) {
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textFont('Georgia');

  state.letterFragments.forEach(frag => {
    const fragX = centerX + Math.cos(frag.angle) * frag.radius + frag.scatterX;
    const fragY = centerY + Math.sin(frag.angle) * frag.radius + frag.verticalOffset + frag.scatterY;

    const fragT = Math.sin(frag.angle + ctx.time.total) * 0.5 + 0.5;
    const fragColor = lerpColor(COLORS.gold, COLORS.honk, fragT);
    const fragRgb = hexToRgb(fragColor);

    p.fill(fragRgb.r, fragRgb.g, fragRgb.b, frag.opacity * 0.8 * 255);
    p.noStroke();
    p.textSize(frag.size);
    p.text(frag.char, fragX, fragY);
  });

  p.pop();
}
