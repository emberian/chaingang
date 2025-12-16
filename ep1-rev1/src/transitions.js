// ═══════════════════════════════════════════════════════════════════════════
// SCENE TRANSITIONS - The Thirteenth Turning
// ═══════════════════════════════════════════════════════════════════════════

import { COLORS, colorWithAlpha } from './colors.js';
import { state, TRANSITION_DURATION } from './state.js';

// Transition types per scene boundary
const TRANSITION_TYPES = [
  'fade',       // 0->1: Void to Ignition
  'spiral',     // 1->2: Ignition to Polvo
  'portal',     // 2->3: Polvo to Gnomes
  'converge',   // 3->4: Gnomes to Titan
  'zoom',       // 4->5: Titan to Ending
];

export function renderTransition(p5, fromScene, toScene, progress) {
  const type = TRANSITION_TYPES[fromScene] || 'fade';
  const eased = easeInOutCubic(progress);

  switch (type) {
    case 'fade':
      renderFadeTransition(p5, eased);
      break;
    case 'spiral':
      renderSpiralTransition(p5, eased);
      break;
    case 'portal':
      renderPortalTransition(p5, eased);
      break;
    case 'converge':
      renderConvergeTransition(p5, eased);
      break;
    case 'zoom':
      renderZoomTransition(p5, eased);
      break;
  }
}

function renderFadeTransition(p5, progress) {
  // Simple crossfade with color wash
  p5.push();
  p5.noStroke();

  if (progress < 0.5) {
    // Fade to color
    const alpha = progress * 2;
    p5.fill(p5.red(p5.color(COLORS.indigo)),
            p5.green(p5.color(COLORS.indigo)),
            p5.blue(p5.color(COLORS.indigo)),
            alpha * 0.8 * 255);
    p5.rect(0, 0, state.width, state.height);
  } else {
    // Fade from color
    const alpha = (1 - progress) * 2;
    p5.fill(p5.red(p5.color(COLORS.indigo)),
            p5.green(p5.color(COLORS.indigo)),
            p5.blue(p5.color(COLORS.indigo)),
            alpha * 0.8 * 255);
    p5.rect(0, 0, state.width, state.height);
  }

  p5.pop();
}

function renderSpiralTransition(p5, progress) {
  // Spiral wipe revealing next scene
  p5.push();
  p5.translate(state.width / 2, state.height / 2);

  const maxRadius = Math.sqrt(state.width * state.width + state.height * state.height) / 2;
  const currentRadius = maxRadius * progress;

  // Draw spiral mask
  p5.noStroke();
  p5.fill(p5.red(p5.color(COLORS.void)),
          p5.green(p5.color(COLORS.void)),
          p5.blue(p5.color(COLORS.void)),
          255);

  // Create spiral shape
  p5.beginShape();
  const coils = 3;
  for (let a = 0; a < p5.TWO_PI * coils; a += 0.1) {
    const r = (a / (p5.TWO_PI * coils)) * currentRadius;
    const thickness = 50 + Math.sin(a * 2) * 20;
    p5.vertex(Math.cos(a) * (r + thickness), Math.sin(a) * (r + thickness));
  }
  for (let a = p5.TWO_PI * coils; a > 0; a -= 0.1) {
    const r = (a / (p5.TWO_PI * coils)) * currentRadius;
    p5.vertex(Math.cos(a) * r, Math.sin(a) * r);
  }
  p5.endShape(p5.CLOSE);

  // Spiral edge glow
  p5.noFill();
  p5.stroke(p5.red(p5.color(COLORS.teal)),
            p5.green(p5.color(COLORS.teal)),
            p5.blue(p5.color(COLORS.teal)),
            (1 - progress) * 200);
  p5.strokeWeight(3);
  p5.beginShape();
  for (let a = 0; a < p5.TWO_PI * coils; a += 0.1) {
    const r = (a / (p5.TWO_PI * coils)) * currentRadius;
    p5.vertex(Math.cos(a) * r, Math.sin(a) * r);
  }
  p5.endShape();

  p5.pop();
}

function renderPortalTransition(p5, progress) {
  // <> portal opening effect
  p5.push();
  p5.translate(state.width / 2, state.height / 2);

  const maxSize = Math.max(state.width, state.height);
  const portalWidth = progress * maxSize * 1.5;
  const portalHeight = progress * maxSize * 0.8;

  // Dark edges closing/opening
  p5.noStroke();
  p5.fill(p5.red(p5.color(COLORS.voidDeep)),
          p5.green(p5.color(COLORS.voidDeep)),
          p5.blue(p5.color(COLORS.voidDeep)),
          255);

  // Left chevron
  if (progress < 1) {
    p5.beginShape();
    p5.vertex(-state.width / 2, -state.height / 2);
    p5.vertex(-portalWidth / 2, 0);
    p5.vertex(-state.width / 2, state.height / 2);
    p5.vertex(-state.width / 2, -state.height / 2);
    p5.endShape(p5.CLOSE);

    // Right chevron
    p5.beginShape();
    p5.vertex(state.width / 2, -state.height / 2);
    p5.vertex(portalWidth / 2, 0);
    p5.vertex(state.width / 2, state.height / 2);
    p5.vertex(state.width / 2, -state.height / 2);
    p5.endShape(p5.CLOSE);
  }

  // Portal edge glow
  p5.stroke(p5.red(p5.color(COLORS.bonk)),
            p5.green(p5.color(COLORS.bonk)),
            p5.blue(p5.color(COLORS.bonk)),
            (1 - Math.abs(progress - 0.5) * 2) * 255);
  p5.strokeWeight(4);
  p5.noFill();

  // < symbol
  p5.line(-portalWidth / 2 - 20, -portalHeight / 3, -portalWidth / 2, 0);
  p5.line(-portalWidth / 2, 0, -portalWidth / 2 - 20, portalHeight / 3);

  // > symbol
  p5.line(portalWidth / 2 + 20, -portalHeight / 3, portalWidth / 2, 0);
  p5.line(portalWidth / 2, 0, portalWidth / 2 + 20, portalHeight / 3);

  p5.pop();
}

function renderConvergeTransition(p5, progress) {
  // Elements converging to center
  p5.push();

  const numElements = 20;
  const convergeProg = easeOutBack(progress);

  for (let i = 0; i < numElements; i++) {
    const angle = (i / numElements) * p5.TWO_PI;
    const startDist = Math.max(state.width, state.height);
    const endDist = 0;
    const dist = startDist + (endDist - startDist) * convergeProg;

    const x = state.width / 2 + Math.cos(angle) * dist;
    const y = state.height / 2 + Math.sin(angle) * dist;

    const size = 20 + Math.sin(i * 0.5) * 10;
    const alpha = (1 - progress) * 0.6;

    // Mix of pentad colors
    const colors = [COLORS.boon, COLORS.bane, COLORS.bone, COLORS.bonk, COLORS.honk];
    const col = p5.color(colors[i % 5]);

    p5.noStroke();
    p5.fill(p5.red(col), p5.green(col), p5.blue(col), alpha * 255);
    p5.ellipse(x, y, size);
  }

  // Center flash at end
  if (progress > 0.8) {
    const flashAlpha = (progress - 0.8) * 5;
    p5.fill(255, 255, 255, flashAlpha * 100);
    p5.ellipse(state.width / 2, state.height / 2, (progress - 0.8) * 500);
  }

  p5.pop();
}

function renderZoomTransition(p5, progress) {
  // Zoom into spiral effect
  p5.push();
  p5.translate(state.width / 2, state.height / 2);

  const zoomScale = 1 + progress * 10;
  p5.scale(zoomScale);
  p5.rotate(progress * p5.PI);

  // Spiral that zooms past
  p5.noFill();
  p5.stroke(p5.red(p5.color(COLORS.teal)),
            p5.green(p5.color(COLORS.teal)),
            p5.blue(p5.color(COLORS.teal)),
            (1 - progress) * 150);
  p5.strokeWeight(2 / zoomScale);

  p5.beginShape();
  for (let a = 0; a < p5.TWO_PI * 5; a += 0.1) {
    const r = a * 10;
    p5.vertex(Math.cos(a) * r, Math.sin(a) * r);
  }
  p5.endShape();

  p5.pop();

  // Fade overlay
  if (progress > 0.7) {
    p5.fill(p5.red(p5.color(COLORS.voidDeep)),
            p5.green(p5.color(COLORS.voidDeep)),
            p5.blue(p5.color(COLORS.voidDeep)),
            (progress - 0.7) * 3.33 * 255);
    p5.noStroke();
    p5.rect(0, 0, state.width, state.height);
  }
}

// Easing functions
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
