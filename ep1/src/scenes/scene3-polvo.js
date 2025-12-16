// ═══════════════════════════════════════════════════════════════════════════
// SCENE 3: POLVO AWAKENS - THE SPIRAL
// "from the spiral, eight arms reach"
// ═══════════════════════════════════════════════════════════════════════════

import { COLORS, hexToRgb, lerpColor } from '../colors.js';
import { state } from '../state.js';
import { AutumnLeaf, InkSpray } from '../particles.js';

// Scene state
let spiralGrowth = 0;
let tentacles = [];
let leaves = [];
let inkParticles = [];
let dehydrationLevel = 0; // 0 = hydrated, 1 = dehydrated
let polvoEyes = { leftPupil: { x: 0, y: 0 }, rightPupil: { x: 0, y: 0 } };
let initialized = false;

export function init(p5) {
  if (initialized) return;

  spiralGrowth = 0;

  // Create tentacles (Polvo has 8 arms!)
  tentacles = [];
  for (let i = 0; i < 8; i++) {
    const baseAngle = (p5.TWO_PI / 8) * i;
    tentacles.push({
      baseAngle: baseAngle,
      segments: 15,
      length: p5.random(120, 200),
      thickness: p5.random(10, 18),
      phaseOffset: p5.random(p5.TWO_PI),
      reachAmount: 0,
      suckers: Array(8).fill(0).map(() => ({
        offset: p5.random(0.2, 0.9),
        size: p5.random(4, 8),
        pulse: p5.random(p5.TWO_PI)
      })),
      // For tripping animation
      tripping: false,
      tripProgress: 0,
      crossingTentacle: -1
    });
  }

  leaves = [];
  inkParticles = [];
  dehydrationLevel = 0;

  initialized = true;
}

export function reset(p5) {
  initialized = false;
  init(p5);
}

export function update(p5, dt, progress) {
  spiralGrowth = p5.lerp(spiralGrowth, progress, 0.02);

  // Dehydration mechanic - Polvo dries out when mouse is still
  if (state.mouseStillTime > 3) {
    dehydrationLevel = Math.min(1, dehydrationLevel + dt * 0.1);
  } else {
    dehydrationLevel = Math.max(0, dehydrationLevel - dt * 0.3);
  }

  // Update tentacles
  tentacles.forEach((tent, i) => {
    // Tentacles reach toward mouse
    const targetAngle = Math.atan2(
      state.mouseY - state.height / 2,
      state.mouseX - state.width / 2
    );
    const angleDiff = targetAngle - tent.baseAngle;
    tent.reachAmount = p5.lerp(tent.reachAmount,
      p5.map(Math.abs(angleDiff), 0, Math.PI, 0.4, 0), 0.05);

    // Random tripping (occasionally a tentacle crosses another)
    if (!tent.tripping && p5.random() < 0.001) {
      tent.tripping = true;
      tent.tripProgress = 0;
      tent.crossingTentacle = (i + p5.floor(p5.random(1, 4))) % 8;
    }

    if (tent.tripping) {
      tent.tripProgress += dt;
      if (tent.tripProgress > 1.5) {
        tent.tripping = false;
      }
    }
  });

  // Spawn ink on fast mouse movement
  if (state.mouseSpeed > 15 && inkParticles.length < 200) {
    for (let i = 0; i < 3; i++) {
      inkParticles.push(new InkSpray(p5,
        state.mouseX + p5.random(-20, 20),
        state.mouseY + p5.random(-20, 20),
        -state.mouseVel.x * 0.1,
        -state.mouseVel.y * 0.1
      ));
    }
  }

  // Update ink particles
  inkParticles = inkParticles.filter(p => p.update(p5, dt));

  // Spawn autumn leaves
  if (progress > 0.2 && p5.random() < 0.04) {
    leaves.push(new AutumnLeaf(p5));
  }

  // Update leaves
  leaves = leaves.filter(l => l.update(p5, dt));

  // Update Polvo's eye tracking
  const eyeCenterX = state.width / 2;
  const eyeCenterY = state.height / 2 - 30;
  const eyeTargetX = (state.mouseX - eyeCenterX) * 0.15;
  const eyeTargetY = (state.mouseY - eyeCenterY) * 0.15;

  polvoEyes.leftPupil.x = p5.lerp(polvoEyes.leftPupil.x, eyeTargetX, 0.1);
  polvoEyes.leftPupil.y = p5.lerp(polvoEyes.leftPupil.y, eyeTargetY, 0.1);
  polvoEyes.rightPupil.x = p5.lerp(polvoEyes.rightPupil.x, eyeTargetX, 0.1);
  polvoEyes.rightPupil.y = p5.lerp(polvoEyes.rightPupil.y, eyeTargetY, 0.1);
}

export function render(p5, progress) {
  const centerX = state.width / 2;
  const centerY = state.height / 2;

  // Draw ink particles
  p5.push();
  p5.blendMode(p5.ADD);
  inkParticles.forEach(p => p.draw(p5));
  p5.pop();

  // Draw autumn leaves (behind Polvo)
  leaves.forEach(l => l.draw(p5));

  // Draw growing spiral
  drawSpiral(p5, centerX, centerY, progress);

  // Draw Polvo's body (octopus head/mantle)
  drawPolvoBody(p5, centerX, centerY - 30, progress);

  // Draw tentacles
  p5.push();
  p5.translate(centerX, centerY);
  tentacles.forEach((tent, i) => drawTentacle(p5, tent, i, progress));
  p5.pop();
}

function drawSpiral(p5, centerX, centerY, progress) {
  p5.push();
  p5.translate(centerX, centerY);

  // Mouse warps spiral
  const mouseOffsetX = (state.mouseX - centerX) * 0.001;
  const mouseOffsetY = (state.mouseY - centerY) * 0.001;

  p5.noFill();
  p5.strokeWeight(2);

  const maxCoils = Math.floor(spiralGrowth * 8);
  const coilDetail = spiralGrowth * p5.TWO_PI * 8;

  for (let layer = 0; layer < 3; layer++) {
    const layerOffset = layer * 0.5;
    const c = lerpColor(p5, COLORS.violet, COLORS.teal, layer / 3);

    // Apply dehydration - colors desaturate
    const dehydratedAlpha = (0.4 - layer * 0.1) * (1 - dehydrationLevel * 0.5);
    p5.stroke(p5.red(c), p5.green(c), p5.blue(c), dehydratedAlpha * 255);

    p5.beginShape();
    for (let a = 0; a < coilDetail; a += 0.1) {
      let r = a * 8 + layerOffset * 20;

      // Apply noise displacement
      const noiseVal = p5.noise(a * 0.3, state.totalTime * 0.3 + layer);
      r += noiseVal * 15;

      // Mouse warp effect
      const warpX = Math.cos(a) * r;
      const warpY = Math.sin(a) * r;
      const distToMouse = p5.dist(warpX + centerX, warpY + centerY, state.mouseX, state.mouseY);
      const warpStrength = p5.map(distToMouse, 0, 200, 30, 0, true);

      const finalX = warpX + (state.mouseX - centerX - warpX) * warpStrength * 0.05;
      const finalY = warpY + (state.mouseY - centerY - warpY) * warpStrength * 0.05;

      p5.curveVertex(finalX, finalY);
    }
    p5.endShape();
  }

  p5.pop();
}

function drawPolvoBody(p5, x, y, progress) {
  if (progress < 0.2) return;

  const bodyAlpha = p5.map(progress, 0.2, 0.4, 0, 1, true);
  const bodyScale = p5.map(progress, 0.2, 0.5, 0.5, 1, true);

  p5.push();
  p5.translate(x, y);
  p5.scale(bodyScale);

  // Apply dehydration effect (cracking when dry)
  const dehydratedColor = lerpColor(p5, COLORS.teal, COLORS.clay, dehydrationLevel);

  // Mantle (head)
  p5.noStroke();
  p5.fill(p5.red(dehydratedColor), p5.green(dehydratedColor), p5.blue(dehydratedColor), bodyAlpha * 200);

  // Organic mantle shape using bezier
  p5.beginShape();
  p5.vertex(0, -60);
  p5.bezierVertex(-40, -50, -50, -20, -45, 10);
  p5.bezierVertex(-40, 30, -20, 40, 0, 35);
  p5.bezierVertex(20, 40, 40, 30, 45, 10);
  p5.bezierVertex(50, -20, 40, -50, 0, -60);
  p5.endShape(p5.CLOSE);

  // Dehydration cracks
  if (dehydrationLevel > 0.3) {
    const crackAlpha = (dehydrationLevel - 0.3) * 1.4;
    const rgb = hexToRgb(COLORS.bone);
    p5.stroke(rgb.r, rgb.g, rgb.b, crackAlpha * 150);
    p5.strokeWeight(1);
    p5.noFill();

    // Random crack lines
    for (let i = 0; i < 5; i++) {
      const startX = p5.noise(i * 10) * 60 - 30;
      const startY = p5.noise(i * 10 + 100) * 50 - 25;
      p5.beginShape();
      p5.vertex(startX, startY);
      for (let j = 0; j < 3; j++) {
        const dx = p5.noise(i * 10 + j, state.totalTime * 0.1) * 20 - 10;
        const dy = p5.noise(i * 10 + j + 50, state.totalTime * 0.1) * 20;
        p5.vertex(startX + dx, startY + dy);
      }
      p5.endShape();
    }
  }

  // Eyes
  const eyeY = -20;
  const eyeSpacing = 25;
  const blinkPhase = Math.sin(state.totalTime * 0.3);
  const blink = blinkPhase > 0.95 ? 0.2 : 1;

  for (let side of [-1, 1]) {
    const eyeX = side * eyeSpacing;

    // Eye white
    p5.fill(240, 235, 230, bodyAlpha * 255);
    p5.noStroke();
    p5.ellipse(eyeX, eyeY, 22, 26 * blink);

    // Pupil (follows mouse)
    const pupilX = eyeX + p5.constrain(side === -1 ? polvoEyes.leftPupil.x : polvoEyes.rightPupil.x, -6, 6);
    const pupilY = eyeY + p5.constrain(side === -1 ? polvoEyes.leftPupil.y : polvoEyes.rightPupil.y, -6, 6) * blink;

    p5.fill(20, 15, 30, bodyAlpha * 255);
    p5.ellipse(pupilX, pupilY, 10, 12 * blink);

    // Eye highlight
    p5.fill(255, 255, 255, bodyAlpha * 200);
    p5.ellipse(pupilX - 2, pupilY - 2, 3, 3 * blink);
  }

  p5.pop();
}

function drawTentacle(p5, tent, index, progress) {
  if (progress < 0.15) return;

  const tentAlpha = p5.map(progress, 0.15, 0.3, 0, 1, true);
  const segments = tent.segments;
  const segmentLength = tent.length / segments * progress;

  p5.push();
  p5.rotate(tent.baseAngle);

  // Apply tripping offset
  let tripOffset = 0;
  if (tent.tripping) {
    tripOffset = Math.sin(tent.tripProgress * Math.PI) * 30;
  }

  // Tentacle color (dehydration affects it)
  const tentColor = lerpColor(p5, COLORS.teal, COLORS.clay, dehydrationLevel * 0.7);

  p5.noFill();
  p5.strokeWeight(tent.thickness * (1 - dehydrationLevel * 0.3));
  p5.stroke(p5.red(tentColor), p5.green(tentColor), p5.blue(tentColor), tentAlpha * 0.7 * 255);

  // Draw main tentacle curve
  p5.beginShape();
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const wave = Math.sin(t * Math.PI * 3 + state.totalTime * 2 + tent.phaseOffset) * 25 * t;
    const noiseWave = p5.noise(t * 2, state.totalTime + tent.phaseOffset) * 20 * t;
    const reachOffset = tent.reachAmount * 40 * t;

    const x = t * tent.length * progress;
    const y = wave + noiseWave + tripOffset * t;

    points.push({ x, y: y + reachOffset * Math.sin(tent.baseAngle) });
    p5.curveVertex(x, y + reachOffset * Math.sin(tent.baseAngle));
  }
  p5.endShape();

  // Draw suckers along tentacle
  p5.noStroke();
  tent.suckers.forEach(sucker => {
    const idx = Math.floor(sucker.offset * points.length);
    if (idx < points.length) {
      const pt = points[idx];
      const pulse = 0.8 + Math.sin(state.totalTime * 2 + sucker.pulse) * 0.2;
      const suckerSize = sucker.size * pulse * tentAlpha;

      // Sucker (darker circle)
      p5.fill(p5.red(tentColor) * 0.6, p5.green(tentColor) * 0.6, p5.blue(tentColor) * 0.6, tentAlpha * 200);
      p5.ellipse(pt.x, pt.y, suckerSize, suckerSize * 0.7);

      // Inner sucker
      p5.fill(p5.red(tentColor) * 0.4, p5.green(tentColor) * 0.4, p5.blue(tentColor) * 0.4, tentAlpha * 150);
      p5.ellipse(pt.x, pt.y, suckerSize * 0.5, suckerSize * 0.35);
    }
  });

  // Tentacle tip
  if (points.length > 0) {
    const tip = points[points.length - 1];
    p5.fill(p5.red(tentColor), p5.green(tentColor), p5.blue(tentColor), tentAlpha * 0.5 * 255);
    p5.ellipse(tip.x, tip.y, tent.thickness * 0.5);
  }

  p5.pop();
}

export function getState() {
  return { spiralGrowth, tentacles, dehydrationLevel };
}
