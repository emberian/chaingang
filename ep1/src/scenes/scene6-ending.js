// ═══════════════════════════════════════════════════════════════════════════
// SCENE 6: THE SPIRAL CONTINUES - ENDING
// "the spiral is yours. it always was."
// ═══════════════════════════════════════════════════════════════════════════

import { COLORS, hexToRgb, lerpColor } from '../colors.js';
import { state, TOTAL_DURATION } from '../state.js';
import { playHonk, playChime } from '../audio.js';
import { PentadSymbol } from '../particles.js';

// Scene state
let finalSpirals = [];
let pentadSymbols = [];
let montagePhase = 0;
let colorExplosionTriggered = false;
let colorExplosionParticles = [];
let finalHonkTriggered = false;
let initialized = false;

export function init(p5) {
  if (initialized) return;

  // Create multiple spirals
  finalSpirals = [];
  for (let i = 0; i < 12; i++) {
    finalSpirals.push({
      x: p5.random(state.width * 0.1, state.width * 0.9),
      y: p5.random(state.height * 0.1, state.height * 0.9),
      size: p5.random(30, 80),
      rotation: p5.random(p5.TWO_PI),
      rotationSpeed: p5.random(0.01, 0.03) * (p5.random() < 0.5 ? 1 : -1),
      opacity: 0,
      glowIntensity: 0,
      color: lerpColor(p5, COLORS.violet, COLORS.teal, p5.random())
    });
  }

  // Pentad symbols more prominent in finale
  pentadSymbols = [];
  const types = ['boon', 'bane', 'bone', 'bonk', 'honk'];
  for (let i = 0; i < 30; i++) {
    const symbol = new PentadSymbol(p5, types[i % 5]);
    symbol.opacity = 0.4;
    pentadSymbols.push(symbol);
  }

  montagePhase = 0;
  colorExplosionTriggered = false;
  colorExplosionParticles = [];
  finalHonkTriggered = false;

  initialized = true;
}

export function reset(p5) {
  initialized = false;
  init(p5);
}

export function update(p5, dt, progress) {
  // Update spirals
  finalSpirals.forEach(spiral => {
    spiral.opacity = p5.lerp(spiral.opacity, progress * 0.7, 0.05);
    spiral.rotation += spiral.rotationSpeed;

    // Mouse selects nearest spiral
    const dToMouse = p5.dist(state.mouseX, state.mouseY, spiral.x, spiral.y);
    spiral.glowIntensity = p5.lerp(spiral.glowIntensity,
      p5.map(dToMouse, 0, 200, 1, 0, true), 0.1);
  });

  // Update pentad symbols
  pentadSymbols.forEach(s => {
    s.opacity = 0.3 + progress * 0.3;
    s.update(p5, dt);
  });

  // Montage phase (rapid scene flashbacks)
  if (progress > 0.3 && progress < 0.5) {
    montagePhase = p5.map(progress, 0.3, 0.5, 0, 1);
  }

  // Color explosion near end
  if (progress > 0.85 && !colorExplosionTriggered) {
    colorExplosionTriggered = true;
    triggerColorExplosion(p5);
    playChime(659); // E5
  }

  // Update color explosion particles
  colorExplosionParticles = colorExplosionParticles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= dt * 0.5;
    return p.life > 0;
  });

  // Final HONK
  if (progress > 0.92 && !finalHonkTriggered) {
    finalHonkTriggered = true;
    playHonk();
  }
}

function triggerColorExplosion(p5) {
  const colors = [COLORS.boon, COLORS.bane, COLORS.bone, COLORS.bonk, COLORS.honk];

  for (let i = 0; i < 100; i++) {
    const angle = p5.random(p5.TWO_PI);
    const speed = p5.random(3, 12);
    colorExplosionParticles.push({
      x: state.width / 2,
      y: state.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: p5.random(8, 25),
      color: colors[Math.floor(p5.random(colors.length))],
      life: 1
    });
  }
}

export function render(p5, progress) {
  const centerX = state.width / 2;
  const centerY = state.height / 2;

  // Zoom out effect
  const zoomScale = p5.map(progress, 0, 0.6, 1, 0.35);

  // Draw pentad symbols in background
  p5.push();
  p5.blendMode(p5.ADD);
  pentadSymbols.forEach(s => s.draw(p5));
  p5.pop();

  // Draw montage flashes (brief scene callbacks)
  if (montagePhase > 0 && montagePhase < 1) {
    drawMontageFlashes(p5, montagePhase);
  }

  // Current scene shrinks (main spiral)
  p5.push();
  p5.translate(centerX, centerY);
  p5.scale(zoomScale);

  // Draw main spiral
  const tealRgb = hexToRgb(COLORS.teal);
  p5.noFill();
  p5.stroke(tealRgb.r, tealRgb.g, tealRgb.b, 0.5 * 255);
  p5.strokeWeight(2);
  p5.beginShape();
  for (let a = 0; a < p5.TWO_PI * 5; a += 0.15) {
    const r = a * 12 + p5.noise(a * 0.3, state.totalTime * 0.3) * 12;
    p5.curveVertex(Math.cos(a) * r, Math.sin(a) * r);
  }
  p5.endShape();

  // Central glow
  p5.blendMode(p5.ADD);
  const hrgb = hexToRgb(COLORS.honk);
  for (let r = 60; r > 0; r -= 12) {
    p5.fill(hrgb.r, hrgb.g, hrgb.b, 0.06 * 255);
    p5.noStroke();
    p5.ellipse(0, 0, r * 2);
  }
  p5.pop();

  // Draw multiple smaller spirals
  finalSpirals.forEach(spiral => drawFinalSpiral(p5, spiral));

  // Particle streams connect mouse to spirals
  drawSpiralConnections(p5);

  // Draw color explosion
  drawColorExplosion(p5);

  // Peaceful glow when mouse is still
  if (state.mouseStillTime > 2) {
    p5.push();
    p5.blendMode(p5.ADD);
    const peaceGlow = p5.map(state.mouseStillTime, 2, 5, 0, 0.3, true);
    const brgb = hexToRgb(COLORS.bone);
    for (let r = 70; r > 0; r -= 12) {
      p5.fill(brgb.r, brgb.g, brgb.b, peaceGlow * 0.12 * 255);
      p5.noStroke();
      p5.ellipse(state.mouseX, state.mouseY, r);
    }
    p5.pop();
  }
}

function drawMontageFlashes(p5, phase) {
  // Quick flashes representing previous scenes
  const flashIndex = Math.floor(phase * 5);
  const flashAlpha = Math.sin(phase * Math.PI * 5) * 0.3;

  if (flashAlpha > 0) {
    const flashColors = [COLORS.violet, COLORS.amber, COLORS.teal, COLORS.boon, COLORS.honk];
    const rgb = hexToRgb(flashColors[flashIndex % 5]);

    p5.push();
    p5.noStroke();
    p5.fill(rgb.r, rgb.g, rgb.b, flashAlpha * 255);
    p5.rect(0, 0, state.width, state.height);
    p5.pop();
  }
}

function drawFinalSpiral(p5, spiral) {
  p5.push();
  p5.translate(spiral.x, spiral.y);
  p5.rotate(spiral.rotation);
  p5.scale(spiral.size / 50);

  // Draw mini spiral
  p5.noFill();
  const c = lerpColor(p5, spiral.color, p5.color(COLORS.honk), spiral.glowIntensity);
  p5.stroke(p5.red(c), p5.green(c), p5.blue(c), spiral.opacity * 255);
  p5.strokeWeight(1.5);

  p5.beginShape();
  for (let a = 0; a < p5.TWO_PI * 3; a += 0.2) {
    const r = a * 5;
    p5.curveVertex(Math.cos(a) * r, Math.sin(a) * r);
  }
  p5.endShape();

  // Glow on selected
  if (spiral.glowIntensity > 0.1) {
    p5.push();
    p5.blendMode(p5.ADD);
    const hrgb = hexToRgb(COLORS.honk);
    p5.fill(hrgb.r, hrgb.g, hrgb.b, spiral.glowIntensity * 0.25 * 255);
    p5.noStroke();
    p5.ellipse(0, 0, 35);
    p5.pop();
  }

  p5.pop();
}

function drawSpiralConnections(p5) {
  p5.push();
  p5.blendMode(p5.ADD);

  finalSpirals.forEach(spiral => {
    if (spiral.glowIntensity > 0.2) {
      const hrgb = hexToRgb(COLORS.honk);
      p5.stroke(hrgb.r, hrgb.g, hrgb.b, spiral.glowIntensity * 0.35 * 255);
      p5.strokeWeight(1);

      // Curved line from mouse to spiral
      p5.noFill();
      p5.beginShape();
      p5.curveVertex(state.mouseX, state.mouseY);
      p5.curveVertex(state.mouseX, state.mouseY);
      p5.curveVertex(
        (state.mouseX + spiral.x) / 2 + Math.sin(state.totalTime * 2) * 30,
        (state.mouseY + spiral.y) / 2 + Math.cos(state.totalTime * 2) * 30
      );
      p5.curveVertex(spiral.x, spiral.y);
      p5.curveVertex(spiral.x, spiral.y);
      p5.endShape();
    }
  });

  p5.pop();
}

function drawColorExplosion(p5) {
  p5.push();
  p5.blendMode(p5.ADD);
  p5.noStroke();

  colorExplosionParticles.forEach(particle => {
    const rgb = hexToRgb(particle.color);
    p5.fill(rgb.r, rgb.g, rgb.b, particle.life * 0.6 * 255);
    p5.ellipse(particle.x, particle.y, particle.size * particle.life);
  });

  p5.pop();
}

export function getState() {
  return { finalSpirals, colorExplosionTriggered };
}
