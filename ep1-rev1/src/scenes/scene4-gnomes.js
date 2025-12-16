// ═══════════════════════════════════════════════════════════════════════════
// SCENE 4: MYCOCOUSIN GATHERING
// "lanterns flicker in the terraced dark"
// ═══════════════════════════════════════════════════════════════════════════

import { COLORS, hexToRgb, lerpColor } from '../colors.js';
import { state } from '../state.js';
import { playMyceliumPulse, playAutumnWind } from '../audio.js';
import { SporeParticle, WoodsmokeParticle, FrostCrystal } from '../particles.js';

// Scene state
let gnomes = [];
let myceliumNodes = [];
let spores = [];
let woodsmoke = [];
let frostCrystals = [];
let windSoundTimer = 0;
let initialized = false;

// Gnome cap shapes
const CAP_SHAPES = ['round', 'pointed', 'wavy', 'flat'];

export function init(p5) {
  if (initialized) return;

  // Create gnomes (888 in the lore, we'll do ~100 for performance)
  gnomes = [];
  for (let i = 0; i < 100; i++) {
    const terrace = Math.floor(p5.random(6));
    const terraceY = state.height * 0.45 + terrace * 45;
    const isElder = p5.random() < 0.08; // 8% chance of being an elder

    gnomes.push({
      x: p5.random(state.width * 0.05, state.width * 0.95),
      y: terraceY + p5.random(-15, 15),
      baseX: 0,
      baseY: 0,
      size: isElder ? p5.random(16, 22) : p5.random(8, 14),
      isElder: isElder,
      capShape: CAP_SHAPES[Math.floor(p5.random(CAP_SHAPES.length))],
      capColor: lerpColor(p5, COLORS.clay, COLORS.crimson, p5.random()),
      lanternGlow: p5.random(0.3, 0.8),
      lanternColor: p5.random() < 0.5 ? COLORS.honk : COLORS.amber,
      lookAngle: 0,
      bobOffset: p5.random(p5.TWO_PI),
      scattered: false,
      scatterVel: { x: 0, y: 0 },
      // Behaviors
      behavior: p5.random(['idle', 'chatting', 'waving', 'curious']),
      behaviorTimer: p5.random(3),
      chattingWith: -1,
      // Geode eyes
      eyeGlow: p5.random(0.3, 0.7),
      eyeColor: p5.random() < 0.5 ? COLORS.honk : COLORS.violet
    });
  }
  gnomes.forEach(g => { g.baseX = g.x; g.baseY = g.y; });

  // Find chatting pairs
  gnomes.forEach((g, i) => {
    if (g.behavior === 'chatting' && g.chattingWith === -1) {
      // Find nearby gnome to chat with
      for (let j = i + 1; j < gnomes.length; j++) {
        const other = gnomes[j];
        if (other.behavior === 'chatting' && other.chattingWith === -1) {
          const dist = p5.dist(g.x, g.y, other.x, other.y);
          if (dist < 60) {
            g.chattingWith = j;
            other.chattingWith = i;
            break;
          }
        }
      }
    }
  });

  // Create mycelium network
  myceliumNodes = [];
  for (let i = 0; i < 50; i++) {
    myceliumNodes.push({
      x: p5.random(state.width * 0.02, state.width * 0.98),
      y: p5.random(state.height * 0.35, state.height * 0.95),
      connections: [],
      pulsePhase: p5.random(p5.TWO_PI),
      active: false
    });
  }

  // Connect nearby nodes
  for (let i = 0; i < myceliumNodes.length; i++) {
    for (let j = i + 1; j < myceliumNodes.length; j++) {
      const d = p5.dist(myceliumNodes[i].x, myceliumNodes[i].y,
                        myceliumNodes[j].x, myceliumNodes[j].y);
      if (d < 140 && p5.random() < 0.35) {
        myceliumNodes[i].connections.push(j);
      }
    }
  }

  // Spores
  spores = [];
  for (let i = 0; i < 60; i++) {
    spores.push(new SporeParticle(p5));
  }

  // Frost crystals on edges
  frostCrystals = [];
  const edges = ['top', 'left', 'right'];
  edges.forEach(edge => {
    for (let i = 0; i < 8; i++) {
      frostCrystals.push(new FrostCrystal(p5, edge));
    }
  });

  woodsmoke = [];
  windSoundTimer = 0;

  initialized = true;
}

export function reset(p5) {
  initialized = false;
  init(p5);
}

export function update(p5, dt, progress) {
  // Wind sound occasionally
  windSoundTimer += dt;
  if (windSoundTimer > 8 && p5.random() < 0.01) {
    playAutumnWind();
    windSoundTimer = 0;
  }

  // Update mycelium
  const mouseDistances = myceliumNodes.map(n => p5.dist(state.mouseX, state.mouseY, n.x, n.y));

  myceliumNodes.forEach((node, i) => {
    node.pulsePhase += dt * 2;

    // Ripple activation from mouse
    if (mouseDistances[i] < 100) {
      if (!node.active) {
        playMyceliumPulse();
      }
      node.active = true;
    } else {
      node.active = p5.lerp(node.active ? 1 : 0, 0, 0.02) > 0.5;
    }
  });

  // Update gnomes
  const mouseSpeedSq = state.mouseVel.x * state.mouseVel.x + state.mouseVel.y * state.mouseVel.y;

  gnomes.forEach((gnome, i) => {
    // Scatter on fast mouse movement
    if (mouseSpeedSq > 400) {
      const dg = p5.dist(state.mouseX, state.mouseY, gnome.x, gnome.y);
      if (dg < 150) {
        gnome.scattered = true;
        const fleeAngle = Math.atan2(gnome.y - state.mouseY, gnome.x - state.mouseX);
        gnome.scatterVel.x = Math.cos(fleeAngle) * 4;
        gnome.scatterVel.y = Math.sin(fleeAngle) * 3;
      }
    }

    // Return to base position
    if (gnome.scattered) {
      gnome.x += gnome.scatterVel.x;
      gnome.y += gnome.scatterVel.y;
      gnome.scatterVel.x *= 0.94;
      gnome.scatterVel.y *= 0.94;

      gnome.x = p5.lerp(gnome.x, gnome.baseX, 0.03);
      gnome.y = p5.lerp(gnome.y, gnome.baseY, 0.03);

      if (p5.dist(gnome.x, gnome.y, gnome.baseX, gnome.baseY) < 2) {
        gnome.scattered = false;
      }
    }

    // Look toward mouse
    gnome.lookAngle = p5.lerp(gnome.lookAngle,
      Math.atan2(state.mouseY - gnome.y, state.mouseX - gnome.x), 0.08);

    // Update behavior
    gnome.behaviorTimer -= dt;
    if (gnome.behaviorTimer <= 0) {
      gnome.behavior = p5.random(['idle', 'chatting', 'waving', 'curious']);
      gnome.behaviorTimer = p5.random(2, 5);
    }
  });

  // Update spores
  spores.forEach(s => s.update(p5, dt));

  // Update frost crystals
  frostCrystals.forEach(f => f.update(p5, dt, progress));

  // Spawn woodsmoke
  if (p5.random() < 0.02) {
    woodsmoke.push(new WoodsmokeParticle(p5, p5.random(state.width), state.height));
  }
  woodsmoke = woodsmoke.filter(w => w.update(p5, dt));
}

export function render(p5, progress) {
  // Draw terraced landscape
  drawTerracedLandscape(p5);

  // Draw woodsmoke (background)
  p5.push();
  p5.blendMode(p5.ADD);
  woodsmoke.forEach(w => w.draw(p5));
  p5.pop();

  // Draw mycelium network
  drawMyceliumNetwork(p5);

  // Draw gnomes
  gnomes.forEach((gnome, i) => drawGnome(p5, gnome, i, progress));

  // Draw spores
  p5.push();
  p5.blendMode(p5.ADD);
  spores.forEach(s => s.draw(p5));
  p5.pop();

  // Draw frost crystals
  frostCrystals.forEach(f => f.draw(p5));
}

function drawTerracedLandscape(p5) {
  p5.push();
  p5.noStroke();

  for (let i = 0; i < 7; i++) {
    const y = state.height * 0.4 + i * 50;
    const shade = p5.map(i, 0, 6, 45, 20);
    p5.fill(shade, shade - 5, shade - 8);

    p5.beginShape();
    p5.vertex(0, y);
    for (let x = 0; x <= state.width; x += 40) {
      const noiseY = p5.noise(x * 0.008, i * 0.5 + state.totalTime * 0.02) * 25;
      p5.vertex(x, y + noiseY);
    }
    p5.vertex(state.width, state.height);
    p5.vertex(0, state.height);
    p5.endShape(p5.CLOSE);
  }

  p5.pop();
}

function drawMyceliumNetwork(p5) {
  p5.push();

  myceliumNodes.forEach((node, i) => {
    // Draw connections
    node.connections.forEach(j => {
      const other = myceliumNodes[j];
      const pulsePos = (Math.sin(node.pulsePhase) * 0.5 + 0.5);

      // Base line
      const rgb = hexToRgb(COLORS.teal);
      p5.stroke(rgb.r, rgb.g, rgb.b, 40);
      p5.strokeWeight(1);
      p5.line(node.x, node.y, other.x, other.y);

      // Pulse traveling along line
      if (node.active || other.active) {
        const px = p5.lerp(node.x, other.x, pulsePos);
        const py = p5.lerp(node.y, other.y, pulsePos);
        const hrgb = hexToRgb(COLORS.honk);
        p5.fill(hrgb.r, hrgb.g, hrgb.b, 180);
        p5.noStroke();
        p5.ellipse(px, py, 5);
      }
    });

    // Draw node
    const trgb = hexToRgb(COLORS.teal);
    p5.fill(trgb.r, trgb.g, trgb.b, node.active ? 150 : 60);
    p5.noStroke();
    p5.ellipse(node.x, node.y, 6);
  });

  p5.pop();
}

function drawGnome(p5, gnome, index, progress) {
  const bob = Math.sin(state.totalTime * 2 + gnome.bobOffset) * 2;
  const mouseDist = p5.dist(state.mouseX, state.mouseY, gnome.x, gnome.y);
  const proximityGlow = p5.map(mouseDist, 0, 150, 0.6, 0, true);
  const totalGlow = gnome.lanternGlow + proximityGlow;

  p5.push();
  p5.translate(gnome.x, gnome.y + bob);

  // Draw cap based on shape
  p5.noStroke();
  p5.fill(p5.red(gnome.capColor), p5.green(gnome.capColor), p5.blue(gnome.capColor));

  const capSize = gnome.size;
  switch (gnome.capShape) {
    case 'round':
      p5.ellipse(0, -capSize * 0.3, capSize * 1.3, capSize * 0.9);
      break;
    case 'pointed':
      p5.beginShape();
      p5.vertex(0, -capSize * 0.8);
      p5.vertex(-capSize * 0.6, -capSize * 0.1);
      p5.vertex(capSize * 0.6, -capSize * 0.1);
      p5.endShape(p5.CLOSE);
      break;
    case 'wavy':
      p5.beginShape();
      for (let a = 0; a < p5.PI; a += 0.2) {
        const r = capSize * 0.6 + Math.sin(a * 5 + state.totalTime) * 3;
        p5.vertex(Math.cos(a + p5.PI) * r, -capSize * 0.2 + Math.sin(a) * -capSize * 0.4);
      }
      p5.endShape(p5.CLOSE);
      break;
    case 'flat':
      p5.ellipse(0, -capSize * 0.25, capSize * 1.4, capSize * 0.5);
      break;
  }

  // Stem/body
  const stemColor = lerpColor(p5, COLORS.bone, COLORS.clay, 0.3);
  p5.fill(p5.red(stemColor), p5.green(stemColor), p5.blue(stemColor));
  p5.rect(-capSize * 0.25, -capSize * 0.25, capSize * 0.5, capSize * 0.65, 2);

  // Geode eyes
  const eyeOffset = gnome.lookAngle < 0 ? -1 : 1;
  const eyeY = -capSize * 0.35;

  // Eye glow
  p5.push();
  p5.blendMode(p5.ADD);
  const ergb = hexToRgb(gnome.eyeColor);
  p5.fill(ergb.r, ergb.g, ergb.b, gnome.eyeGlow * 80);
  p5.ellipse(eyeOffset * capSize * 0.12, eyeY, 5, 5);
  p5.ellipse(-eyeOffset * capSize * 0.12, eyeY, 5, 5);
  p5.pop();

  // Eye dots
  p5.fill(ergb.r, ergb.g, ergb.b, 200);
  p5.ellipse(eyeOffset * capSize * 0.12, eyeY, 3, 3);
  p5.ellipse(-eyeOffset * capSize * 0.12, eyeY, 3, 3);

  // Behavior animations
  if (gnome.behavior === 'waving' && gnome.behaviorTimer > 1) {
    // Draw waving arm
    const waveAngle = Math.sin(state.totalTime * 8) * 0.3;
    p5.push();
    p5.translate(capSize * 0.3, -capSize * 0.1);
    p5.rotate(waveAngle - 0.5);
    p5.stroke(p5.red(stemColor), p5.green(stemColor), p5.blue(stemColor));
    p5.strokeWeight(2);
    p5.line(0, 0, 0, -capSize * 0.4);
    p5.pop();
  }

  // Lantern
  const lanternX = capSize * 0.45;
  const lanternY = -capSize * 0.05;

  // Lantern glow
  p5.push();
  p5.blendMode(p5.ADD);
  const lrgb = hexToRgb(gnome.lanternColor);
  for (let r = 25; r > 0; r -= 6) {
    p5.fill(lrgb.r, lrgb.g, lrgb.b, totalGlow * 0.08 * 255);
    p5.ellipse(lanternX, lanternY, r);
  }
  p5.pop();

  // Lantern body
  p5.fill(gnome.lanternColor);
  p5.ellipse(lanternX, lanternY, 5);

  // Chatting indicator (speech bubbles)
  if (gnome.behavior === 'chatting' && gnome.chattingWith !== -1) {
    const bubblePhase = Math.sin(state.totalTime * 3 + index) * 0.5 + 0.5;
    if (bubblePhase > 0.3) {
      p5.fill(255, 255, 255, bubblePhase * 100);
      p5.ellipse(capSize * 0.4, -capSize * 0.7, 6, 5);
      p5.ellipse(capSize * 0.55, -capSize * 0.85, 4, 3);
    }
  }

  p5.pop();
}

export function getState() {
  return { gnomes, myceliumNodes };
}
