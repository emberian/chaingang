// ═══════════════════════════════════════════════════════════════════════════
// SCENE 5: THE THIRTEENTH TURNING - THE TITAN
// "you are the question and the answer"
// ═══════════════════════════════════════════════════════════════════════════

import { COLORS, hexToRgb, lerpColor } from '../colors.js';
import { state } from '../state.js';
import { playHeartbeat } from '../audio.js';
import { AuroraTrail, PentadSymbol } from '../particles.js';

// Scene state
let titanScale = 0.5;
let titanBreath = 0;
let auroraTrails = [];
let beardGnomes = [];
let bodyParticles = [];
let pentadSymbols = [];
let heartbeatTimer = 0;
let thirdEyeGlow = 0;
let initialized = false;

export function init(p5) {
  if (initialized) return;

  titanScale = 0.5;
  titanBreath = 0;
  auroraTrails = [];

  // Create beard gnomes (tiny gnomes in the titan's beard)
  beardGnomes = [];
  for (let i = 0; i < 50; i++) {
    beardGnomes.push({
      offsetX: p5.random(-50, 50),
      offsetY: 30 + i * 3.5,
      size: p5.random(4, 8),
      lanternColor: p5.random() < 0.5 ? COLORS.honk : COLORS.amber,
      lanternPhase: p5.random(p5.TWO_PI),
      waving: p5.random() < 0.2,
      lookingAround: p5.random() < 0.3
    });
  }

  // Create body particles
  bodyParticles = [];
  for (let i = 0; i < 400; i++) {
    bodyParticles.push({
      t: i / 400,
      offset: p5.random(1000),
      size: 4 + p5.random() * 5,
      colorMix: p5.random()
    });
  }

  // Background pentad symbols
  pentadSymbols = [];
  const types = ['boon', 'bane', 'bone', 'bonk', 'honk'];
  for (let i = 0; i < 25; i++) {
    const symbol = new PentadSymbol(p5, types[i % 5]);
    symbol.opacity = 0.25;
    pentadSymbols.push(symbol);
  }

  heartbeatTimer = 0;
  thirdEyeGlow = 0;

  initialized = true;
}

export function reset(p5) {
  initialized = false;
  init(p5);
}

export function update(p5, dt, progress) {
  // Titan grows as scene progresses
  titanScale = p5.lerp(titanScale, 0.5 + progress * 0.6, 0.02);

  // Breathing animation
  titanBreath += dt;
  const breathScale = 1 + Math.sin(titanBreath * 0.8) * 0.03;

  // Heartbeat sound
  heartbeatTimer += dt;
  if (heartbeatTimer > 1.5) {
    playHeartbeat();
    heartbeatTimer = 0;
  }

  // Third eye glows more as progress increases
  thirdEyeGlow = p5.lerp(thirdEyeGlow, progress * 0.8, 0.02);

  // Aurora trails from mouse
  if (p5.frameCount % 2 === 0) {
    auroraTrails.push(new AuroraTrail(p5, state.mouseX, state.mouseY));
  }

  // Update aurora
  auroraTrails = auroraTrails.filter(t => t.update(dt));

  // Update pentad symbols
  pentadSymbols.forEach(s => s.update(p5, dt));

  // Update beard gnomes
  beardGnomes.forEach(gnome => {
    gnome.lanternPhase += dt * 2;
  });
}

export function render(p5, progress) {
  const centerX = state.width / 2;
  const centerY = state.height / 2;

  // Draw aurora trails
  p5.push();
  p5.blendMode(p5.ADD);
  auroraTrails.forEach(t => t.draw(p5));
  p5.pop();

  // Draw pentad symbols in background
  p5.push();
  p5.blendMode(p5.ADD);
  pentadSymbols.forEach(s => s.draw(p5));
  p5.pop();

  // Draw faint background spiral (continuity from scene 3)
  drawBackgroundSpiral(p5, centerX, centerY);

  // Draw titan
  drawTitan(p5, centerX, centerY - 50, progress);
}

function drawBackgroundSpiral(p5, centerX, centerY) {
  p5.push();
  p5.translate(centerX, centerY);
  p5.blendMode(p5.ADD);

  const rgb = hexToRgb(COLORS.violet);
  p5.stroke(rgb.r, rgb.g, rgb.b, 30);
  p5.strokeWeight(1);
  p5.noFill();

  p5.beginShape();
  for (let a = 0; a < p5.TWO_PI * 4; a += 0.2) {
    const r = a * 18;
    p5.curveVertex(
      Math.cos(a + state.totalTime * 0.1) * r,
      Math.sin(a + state.totalTime * 0.1) * r
    );
  }
  p5.endShape();

  p5.pop();
}

function drawTitan(p5, x, y, progress) {
  const breathScale = 1 + Math.sin(titanBreath * 0.8) * 0.03;

  p5.push();
  p5.translate(x, y);
  p5.scale(titanScale * breathScale);

  // Titan leans based on mouse position
  const leanAmount = (state.mouseX - x) * 0.00008;
  p5.rotate(leanAmount);

  // If mouse approaches, titan leans forward
  const mouseDistFromTitan = p5.dist(state.mouseX, state.mouseY, x, y);
  const forwardLean = p5.map(mouseDistFromTitan, 300, 100, 0, -0.03, true);
  p5.translate(0, forwardLean * 60);

  // Draw body (particle cloud silhouette)
  drawTitanBody(p5, progress);

  // Draw geode eyes
  drawTitanEyes(p5, x, y);

  // Draw third eye
  drawThirdEye(p5);

  // Draw beard of tiny gnomes
  drawBeardGnomes(p5);

  p5.pop();
}

function drawTitanBody(p5, progress) {
  p5.noStroke();

  bodyParticles.forEach(particle => {
    const t = particle.t;
    const bodyY = p5.map(t, 0, 1, -220, 180);

    // Body width varies
    let bodyWidth;
    if (t < 0.25) {
      // Head
      bodyWidth = p5.map(t, 0, 0.25, 35, 90);
    } else if (t < 0.45) {
      // Neck/shoulders
      bodyWidth = p5.map(t, 0.25, 0.45, 90, 140);
    } else {
      // Torso tapering
      bodyWidth = p5.map(t, 0.45, 1, 140, 70);
    }

    const px = p5.noise(particle.offset, state.totalTime * 0.25) * bodyWidth - bodyWidth / 2;
    const py = bodyY + p5.noise(particle.offset + 100, state.totalTime * 0.25) * 12;
    const ps = particle.size;

    const c = lerpColor(p5, COLORS.clay, COLORS.violet, p5.noise(particle.offset * 0.05, state.totalTime * 0.15));
    p5.fill(p5.red(c), p5.green(c), p5.blue(c), 0.6 * 255);
    p5.ellipse(px, py, ps);
  });
}

function drawTitanEyes(p5, titanX, titanY) {
  const eyeY = -170;
  const eyeSpacing = 40;

  // Eyes follow mouse
  const eyeTargetX = (state.mouseX - titanX) * 0.08;
  const eyeTargetY = (state.mouseY - (titanY - 50 + eyeY * titanScale)) * 0.08;

  // Blinking
  const blinkPhase = Math.sin(state.totalTime * 0.4);
  const blink = blinkPhase > 0.97 ? 0.15 : 1;

  // Pupil dilation based on mouse proximity
  const mouseDist = p5.dist(state.mouseX, state.mouseY, titanX, titanY);
  const pupilDilation = p5.map(mouseDist, 500, 100, 1, 1.5, true);

  for (let side of [-1, 1]) {
    const eyeX = side * eyeSpacing;
    const eyeColor = side < 0 ? COLORS.honk : COLORS.violet;

    // Eye socket
    p5.fill(20, 10, 30);
    p5.noStroke();
    p5.ellipse(eyeX, eyeY, 35, 42 * blink);

    // Geode glow
    p5.push();
    p5.blendMode(p5.ADD);
    const eyeRgb = hexToRgb(eyeColor);
    for (let r = 30; r > 0; r -= 6) {
      p5.fill(eyeRgb.r, eyeRgb.g, eyeRgb.b, 0.12 * (1 - r / 30) * 255 * blink);
      p5.ellipse(eyeX, eyeY, r, r * blink);
    }
    p5.pop();

    // Pupil (follows mouse)
    p5.fill(eyeRgb.r, eyeRgb.g, eyeRgb.b);
    const pupilX = eyeX + p5.constrain(eyeTargetX, -10, 10);
    const pupilY = eyeY + p5.constrain(eyeTargetY, -10, 10) * blink;
    const pupilSize = 10 * pupilDilation;
    p5.ellipse(pupilX, pupilY, pupilSize, pupilSize * blink);

    // Pupil highlight
    p5.fill(255, 255, 255, 200);
    p5.ellipse(pupilX - 2, pupilY - 2 * blink, 3, 3 * blink);
  }
}

function drawThirdEye(p5) {
  if (thirdEyeGlow < 0.1) return;

  const eyeY = -200;

  // Third eye triangle
  p5.push();
  p5.translate(0, eyeY);

  // Glow
  p5.blendMode(p5.ADD);
  const glowRgb = hexToRgb(COLORS.honk);
  for (let r = 40; r > 0; r -= 8) {
    p5.fill(glowRgb.r, glowRgb.g, glowRgb.b, thirdEyeGlow * 0.1 * 255);
    p5.ellipse(0, 0, r);
  }

  // Triangle outline
  p5.noFill();
  p5.stroke(glowRgb.r, glowRgb.g, glowRgb.b, thirdEyeGlow * 200);
  p5.strokeWeight(2);
  p5.beginShape();
  p5.vertex(0, -15);
  p5.vertex(-12, 10);
  p5.vertex(12, 10);
  p5.endShape(p5.CLOSE);

  // Inner eye
  p5.fill(glowRgb.r, glowRgb.g, glowRgb.b, thirdEyeGlow * 255);
  p5.noStroke();
  p5.ellipse(0, 0, 8);

  p5.pop();
}

function drawBeardGnomes(p5) {
  p5.push();
  p5.translate(0, -100);

  beardGnomes.forEach((gnome, i) => {
    const waveOffset = gnome.waving ? Math.sin(state.totalTime * 6 + i) * 2 : 0;
    const lookOffset = gnome.lookingAround ? Math.sin(state.totalTime * 2 + i * 0.5) * 3 : 0;

    const gx = gnome.offsetX + p5.noise(i * 0.3, state.totalTime * 0.4) * 15 - 7.5 + lookOffset;
    const gy = gnome.offsetY + Math.sin(state.totalTime + i * 0.5) * 2;

    // Tiny gnome silhouette
    p5.fill(55, 45, 65, 200);
    p5.noStroke();
    p5.ellipse(gx, gy, gnome.size, gnome.size * 0.85); // cap
    p5.rect(gx - gnome.size * 0.3, gy, gnome.size * 0.6, gnome.size * 0.7); // body

    // Waving arm
    if (gnome.waving) {
      p5.push();
      p5.translate(gx + gnome.size * 0.3, gy + gnome.size * 0.2);
      p5.rotate(Math.sin(state.totalTime * 8 + i) * 0.4 - 0.3);
      p5.stroke(55, 45, 65, 200);
      p5.strokeWeight(1);
      p5.line(0, 0, 0, -gnome.size * 0.5);
      p5.pop();
    }

    // Tiny lantern
    p5.push();
    p5.blendMode(p5.ADD);
    const lanternGlow = 0.5 + Math.sin(gnome.lanternPhase) * 0.3;
    const lrgb = hexToRgb(gnome.lanternColor);
    p5.fill(lrgb.r, lrgb.g, lrgb.b, lanternGlow * 150);
    p5.ellipse(gx + gnome.size * 0.4 + waveOffset, gy + gnome.size * 0.3, 4);
    p5.pop();
  });

  p5.pop();
}

export function getState() {
  return { titanScale, auroraTrails };
}
