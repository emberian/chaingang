// ═══════════════════════════════════════════════════════════════════════════
// SCENE 2: FIRST HONK - NAME IGNITION
// "the unpronounceable speaks itself"
// ═══════════════════════════════════════════════════════════════════════════

import { COLORS, hexToRgb, lerpColor } from '../colors.js';
import { state } from '../state.js';
import { playChime, playHonk } from '../audio.js';
import { PentadSymbol } from '../particles.js';

// Scene state
let letterFragments = [];
let glyphAngle = 0;
let honkTriggered = false;
let pentadSymbols = [];
let initialized = false;

const NAME_LETTERS = "l'n'd'r Bjrnkpfptf".split('');

export function init(p5) {
  if (initialized) return;

  // Create orbiting letter fragments
  letterFragments = NAME_LETTERS.map((char, i) => ({
    char: char,
    angle: (p5.TWO_PI / NAME_LETTERS.length) * i,
    radius: p5.random(80, 200),
    speed: p5.random(0.3, 0.8) * (p5.random() < 0.5 ? 1 : -1),
    verticalOffset: p5.random(-30, 30),
    size: p5.random(14, 28),
    opacity: 0,
    scattered: false,
    scatterX: 0,
    scatterY: 0
  }));

  // Pentad symbols more prominent
  pentadSymbols = [];
  const types = ['boon', 'bane', 'bone', 'bonk', 'honk'];
  for (let i = 0; i < 20; i++) {
    const symbol = new PentadSymbol(p5, types[i % 5]);
    symbol.opacity = 0.3;
    pentadSymbols.push(symbol);
  }

  honkTriggered = false;
  initialized = true;
}

export function reset(p5) {
  initialized = false;
  honkTriggered = false;
  init(p5);
}

export function update(p5, dt, progress) {
  glyphAngle += dt * 0.3;

  // Update letter fragments
  letterFragments.forEach(frag => {
    frag.opacity = Math.min(1, frag.opacity + dt * 0.5);
    frag.angle += frag.speed * dt;

    // Mouse scatters letters
    const fragX = state.width / 2 + Math.cos(frag.angle) * frag.radius;
    const fragY = state.height / 2 + Math.sin(frag.angle) * frag.radius + frag.verticalOffset;
    const mouseDistToFrag = p5.dist(state.mouseX, state.mouseY, fragX, fragY);

    if (mouseDistToFrag < 100) {
      frag.scattered = true;
      const scatterAngle = Math.atan2(fragY - state.mouseY, fragX - state.mouseX);
      frag.scatterX = Math.cos(scatterAngle) * p5.map(mouseDistToFrag, 0, 100, 40, 0);
      frag.scatterY = Math.sin(scatterAngle) * p5.map(mouseDistToFrag, 0, 100, 40, 0);
    } else {
      frag.scattered = false;
      frag.scatterX *= 0.9;
      frag.scatterY *= 0.9;
    }
  });

  // Update pentad symbols
  pentadSymbols.forEach(s => s.update(p5, dt));

  // Trigger HONK at peak
  if (progress > 0.7 && !honkTriggered) {
    honkTriggered = true;
    playHonk();
  }
}

export function render(p5, progress) {
  const centerX = state.width / 2;
  const centerY = state.height / 2;

  // Background glow
  p5.push();
  p5.blendMode(p5.ADD);

  const glowIntensity = p5.map(progress, 0, 0.5, 0, 1);
  const glowColor = lerpColor(p5, COLORS.violet, COLORS.honk, progress);

  for (let r = 300; r > 0; r -= 30) {
    p5.fill(p5.red(glowColor), p5.green(glowColor), p5.blue(glowColor), 0.02 * glowIntensity * 255);
    p5.noStroke();
    p5.ellipse(centerX, centerY, r * 2);
  }
  p5.pop();

  // Radial waves
  p5.push();
  p5.noFill();
  const waveCount = 5;
  for (let i = 0; i < waveCount; i++) {
    const waveProgress = (progress * 3 + i / waveCount) % 1;
    const waveRadius = waveProgress * 400;
    const waveAlpha = (1 - waveProgress) * 0.3;
    const rgb = hexToRgb(COLORS.honk);
    p5.stroke(rgb.r, rgb.g, rgb.b, waveAlpha * 255);
    p5.strokeWeight(2);
    p5.ellipse(centerX, centerY, waveRadius * 2);
  }
  p5.pop();

  // Draw pentad symbols in background
  p5.push();
  p5.blendMode(p5.ADD);
  pentadSymbols.forEach(s => s.draw(p5));
  p5.pop();

  // Central glyph
  drawGlyph(p5, centerX, centerY, progress);

  // Orbiting letter fragments
  drawLetterFragments(p5, centerX, centerY, progress);

  // Mouse hold creates pulse
  if (p5.mouseIsPressed) {
    p5.push();
    p5.blendMode(p5.ADD);
    const pulseSize = (Math.sin(state.totalTime * 10) * 0.5 + 0.5) * 50 + 20;
    const rgb = hexToRgb(COLORS.honk);
    p5.fill(rgb.r, rgb.g, rgb.b, 0.2 * 255);
    p5.noStroke();
    p5.ellipse(state.mouseX, state.mouseY, pulseSize);
    p5.pop();
  }
}

function drawGlyph(p5, centerX, centerY, progress) {
  p5.push();
  p5.translate(centerX, centerY);
  p5.rotate(glyphAngle * 0.1);

  const mouseDistFromCenter = p5.dist(state.mouseX, state.mouseY, centerX, centerY);
  const glyphGlow = p5.map(mouseDistFromCenter, 0, 300, 1, 0.3);

  const glyphColor = lerpColor(p5, COLORS.amber, COLORS.honk, progress);

  p5.noFill();
  p5.stroke(p5.red(glyphColor), p5.green(glyphColor), p5.blue(glyphColor), glyphGlow * 255);
  p5.strokeWeight(3);

  // Organic tentacle-like glyph
  p5.beginShape();
  for (let a = 0; a < p5.TWO_PI; a += 0.1) {
    const r = 60 + Math.sin(a * 3 + state.totalTime) * 20 + p5.noise(a, state.totalTime * 0.5) * 30;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    p5.curveVertex(x, y);
  }
  p5.endShape(p5.CLOSE);

  // Inner glyph detail
  p5.stroke(p5.red(glyphColor), p5.green(glyphColor), p5.blue(glyphColor), glyphGlow * 0.5 * 255);
  p5.strokeWeight(1.5);

  for (let i = 0; i < 3; i++) {
    p5.beginShape();
    for (let a = 0; a < p5.TWO_PI; a += 0.15) {
      const r = 30 + i * 10 + Math.sin(a * 5 + state.totalTime * 1.5 + i) * 10;
      p5.curveVertex(Math.cos(a) * r, Math.sin(a) * r);
    }
    p5.endShape(p5.CLOSE);
  }

  p5.pop();
}

function drawLetterFragments(p5, centerX, centerY, progress) {
  p5.push();
  p5.textAlign(p5.CENTER, p5.CENTER);
  p5.textFont('Georgia');

  letterFragments.forEach(frag => {
    const fragX = centerX + Math.cos(frag.angle) * frag.radius + frag.scatterX;
    const fragY = centerY + Math.sin(frag.angle) * frag.radius + frag.verticalOffset + frag.scatterY;

    const fragColor = lerpColor(p5, COLORS.gold, COLORS.honk,
      Math.sin(frag.angle + state.totalTime) * 0.5 + 0.5);

    p5.fill(p5.red(fragColor), p5.green(fragColor), p5.blue(fragColor), frag.opacity * 0.8 * 255);
    p5.noStroke();
    p5.textSize(frag.size);
    p5.text(frag.char, fragX, fragY);
  });

  p5.pop();
}

export function getState() {
  return { letterFragments, glyphAngle };
}
