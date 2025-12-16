// ═══════════════════════════════════════════════════════════════════════════
// SCENE 1: THE VOID POOL
// "before the naming, potential stirs in the deep"
// ═══════════════════════════════════════════════════════════════════════════

import { COLORS, hexToRgb } from '../colors.js';
import { state } from '../state.js';
import { VoidParticle, PentadSymbol, WoodsmokeParticle } from '../particles.js';

// Scene state
let particles = [];
let pentadSymbols = [];
let woodsmoke = [];
let initialized = false;

export function init(p5) {
  if (initialized) return;

  // Create void particles
  particles = [];
  for (let i = 0; i < 600; i++) {
    particles.push(new VoidParticle(p5));
  }

  // Create floating pentad symbols (sparse)
  pentadSymbols = [];
  const types = ['boon', 'bane', 'bone', 'bonk', 'honk'];
  for (let i = 0; i < 15; i++) {
    pentadSymbols.push(new PentadSymbol(p5, types[i % 5]));
  }

  // Woodsmoke
  woodsmoke = [];

  initialized = true;
}

export function reset(p5) {
  initialized = false;
  init(p5);
}

export function update(p5, dt, progress) {
  const centerPull = p5.map(progress, 0, 1, 0.0002, 0.002);

  // Update particles
  particles.forEach(p => p.update(p5, dt, centerPull));

  // Update pentad symbols
  pentadSymbols.forEach(s => s.update(p5, dt));

  // Spawn woodsmoke occasionally
  if (p5.random() < 0.03) {
    woodsmoke.push(new WoodsmokeParticle(p5));
  }

  // Update woodsmoke
  woodsmoke = woodsmoke.filter(w => w.update(p5, dt));
}

export function render(p5, progress) {
  p5.push();
  p5.blendMode(p5.ADD);

  // Draw woodsmoke first (background layer)
  woodsmoke.forEach(w => w.draw(p5));

  // Draw void particles
  particles.forEach(p => p.draw(p5));

  // Draw pentad symbols (very subtle)
  p5.push();
  pentadSymbols.forEach(s => {
    s.opacity = 0.15; // Keep them subtle in this scene
    s.draw(p5);
  });
  p5.pop();

  // Draw mouse trail
  drawMouseTrail(p5);

  // Quantum foam flickers
  if (p5.random() < 0.03) {
    const rgb = hexToRgb(COLORS.violet);
    p5.fill(rgb.r, rgb.g, rgb.b, p5.random(0.1, 0.3) * 255);
    p5.noStroke();
    const fx = p5.random(state.width);
    const fy = p5.random(state.height);
    p5.ellipse(fx, fy, p5.random(20, 60));
  }

  // Central gathering glow as progress increases
  if (progress > 0.3) {
    const glowIntensity = p5.map(progress, 0.3, 1, 0, 0.3);
    const rgb = hexToRgb(COLORS.violet);

    for (let r = 200; r > 0; r -= 30) {
      p5.fill(rgb.r, rgb.g, rgb.b, glowIntensity * 0.05 * 255);
      p5.noStroke();
      p5.ellipse(state.width / 2, state.height / 2, r * 2);
    }
  }

  p5.pop();
}

function drawMouseTrail(p5) {
  p5.push();
  p5.blendMode(p5.ADD);
  p5.noStroke();

  const rgb = hexToRgb(COLORS.honk);
  for (let i = 0; i < 10; i++) {
    const trailX = state.mouseX - state.mouseVel.x * i * 0.3;
    const trailY = state.mouseY - state.mouseVel.y * i * 0.3;
    const alpha = p5.map(i, 0, 10, 0.2, 0);
    p5.fill(rgb.r, rgb.g, rgb.b, alpha * 255);
    p5.ellipse(trailX, trailY, 10 - i);
  }

  p5.pop();
}

// Export state for potential scene continuity
export function getState() {
  return { particles, pentadSymbols };
}
