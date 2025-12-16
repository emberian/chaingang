// ═══════════════════════════════════════════════════════════════════════════
// GNOMES SEGMENT - Mycocousin gathering on terraced landscape
// "lanterns flicker in the terraced dark"
// ═══════════════════════════════════════════════════════════════════════════

import { Segment } from '../timeline/Choreography.js';
import { Gnome } from '../entities/characters/Gnome.js';
import { SporeParticle, WoodsmokeParticle, FrostCrystal } from '../entities/index.js';
import { COLORS, hexToRgb, lerpColor } from '../config/colors.js';

// Pre-cached RGB values for render performance
const TEAL_RGB = hexToRgb(COLORS.teal);
const HONK_RGB = hexToRgb(COLORS.honk);

export const gnomesSegment = new Segment({
  name: 'gnomes',
  duration: 30,
  flexible: true,
  minDuration: 20,
  maxDuration: 90,

  setup(ctx, segment) {
    const p = ctx.p5;

    // Create gnomes (100 for performance, 888 in lore)
    const gnomes = [];
    for (let i = 0; i < 100; i++) {
      const terrace = Math.floor(Math.random() * 6);
      const terraceY = ctx.height * 0.45 + terrace * 45;

      const gnome = ctx.entities.spawn(Gnome, {
        tags: ['gnome'],
        x: ctx.width * 0.05 + Math.random() * ctx.width * 0.9,
        y: terraceY + (Math.random() - 0.5) * 30
      });
      gnomes.push(gnome);
    }

    // Find chatting pairs
    gnomes.forEach((g, i) => {
      if (g.behavior === 'chatting' && g.chattingWith === -1) {
        for (let j = i + 1; j < gnomes.length; j++) {
          const other = gnomes[j];
          if (other.behavior === 'chatting' && other.chattingWith === -1) {
            const dist = Math.hypot(g.transform.x - other.transform.x, g.transform.y - other.transform.y);
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
    const myceliumNodes = [];
    for (let i = 0; i < 50; i++) {
      myceliumNodes.push({
        x: ctx.width * 0.02 + Math.random() * ctx.width * 0.96,
        y: ctx.height * 0.35 + Math.random() * ctx.height * 0.6,
        connections: [],
        pulsePhase: Math.random() * Math.PI * 2,
        active: false
      });
    }

    // Connect nearby nodes
    for (let i = 0; i < myceliumNodes.length; i++) {
      for (let j = i + 1; j < myceliumNodes.length; j++) {
        const d = Math.hypot(
          myceliumNodes[i].x - myceliumNodes[j].x,
          myceliumNodes[i].y - myceliumNodes[j].y
        );
        if (d < 140 && Math.random() < 0.35) {
          myceliumNodes[i].connections.push(j);
        }
      }
    }

    // Create spores
    for (let i = 0; i < 60; i++) {
      ctx.entities.spawn(SporeParticle, {
        tags: ['gnome-spore'],
        width: ctx.width,
        height: ctx.height
      });
    }

    // Create frost crystals on edges
    const edges = ['top', 'left', 'right'];
    edges.forEach(edge => {
      for (let i = 0; i < 8; i++) {
        ctx.entities.spawn(FrostCrystal, {
          tags: ['gnome-frost'],
          edge: edge,
          width: ctx.width,
          height: ctx.height
        });
      }
    });

    // Store segment state
    segment.state = {
      gnomes,
      myceliumNodes,
      windSoundTimer: 0
    };

    // Start audio drone
    ctx.audio?.updateDrone(3, 0);
  },

  update(ctx, segment, dt) {
    const progress = segment.getProgress();
    const state = segment.state;

    // Wind sound occasionally
    state.windSoundTimer += dt;
    if (state.windSoundTimer > 8 && Math.random() < 0.01) {
      ctx.audio?.playAutumnWind();
      state.windSoundTimer = 0;
    }

    // Update mycelium nodes
    state.myceliumNodes.forEach((node, i) => {
      node.pulsePhase += dt * 2;

      // Ripple activation from mouse
      const mouseDist = Math.hypot(ctx.input.mouseX - node.x, ctx.input.mouseY - node.y);
      if (mouseDist < 100) {
        if (!node.active) {
          ctx.audio?.playMyceliumPulse();
        }
        node.active = true;
      } else {
        node.active = node.active && Math.random() > 0.02;
      }
    });

    // Spawn woodsmoke
    if (Math.random() < 0.02) {
      ctx.entities.spawn(WoodsmokeParticle, {
        tags: ['gnome-smoke'],
        x: Math.random() * ctx.width,
        y: ctx.height
      });
    }

    // Update frost crystals growth
    const frostCrystals = ctx.entities.getByTag('gnome-frost');
    frostCrystals.forEach(f => {
      if (f.setSceneProgress) f.setSceneProgress(progress);
    });

    // Extend segment if engaging with gnomes
    if (ctx.input.mouseSpeed > 50) {
      segment.extend(dt * 0.2);
    }

    // Update audio drone
    ctx.audio?.updateDrone(3, progress);
  },

  render(ctx, segment) {
    const p = ctx.p5;
    const state = segment.state;

    // Draw terraced landscape
    drawTerracedLandscape(p, ctx);

    // Draw mycelium network
    drawMyceliumNetwork(p, ctx, state.myceliumNodes);
  },

  teardown(ctx, segment) {
    // Clean up gnomes
    const gnomes = ctx.entities.getByTag('gnome');
    for (const g of gnomes) {
      g.transform.alpha = 0;
      g.dispose();
    }

    // Clean up spores and frost
    ['gnome-spore', 'gnome-frost', 'gnome-smoke'].forEach(tag => {
      const entities = ctx.entities.getByTag(tag);
      for (const e of entities) {
        e.dispose();
      }
    });
  }
});

function drawTerracedLandscape(p, ctx) {
  p.push();
  p.noStroke();

  for (let i = 0; i < 7; i++) {
    const y = ctx.height * 0.4 + i * 50;
    const shade = 45 - i * (25 / 6);
    p.fill(shade, shade - 5, shade - 8);

    p.beginShape();
    p.vertex(0, y);
    for (let x = 0; x <= ctx.width; x += 40) {
      const noiseY = p.noise(x * 0.008, i * 0.5 + ctx.time.total * 0.02) * 25;
      p.vertex(x, y + noiseY);
    }
    p.vertex(ctx.width, ctx.height);
    p.vertex(0, ctx.height);
    p.endShape(p.CLOSE);
  }

  p.pop();
}

function drawMyceliumNetwork(p, ctx, nodes) {
  p.push();

  nodes.forEach((node, i) => {
    // Draw connections
    node.connections.forEach(j => {
      const other = nodes[j];
      const pulsePos = (Math.sin(node.pulsePhase) * 0.5 + 0.5);

      // Base line
      p.stroke(TEAL_RGB.r, TEAL_RGB.g, TEAL_RGB.b, 40);
      p.strokeWeight(1);
      p.line(node.x, node.y, other.x, other.y);

      // Pulse traveling along line
      if (node.active || other.active) {
        const px = node.x + (other.x - node.x) * pulsePos;
        const py = node.y + (other.y - node.y) * pulsePos;
        p.fill(HONK_RGB.r, HONK_RGB.g, HONK_RGB.b, 180);
        p.noStroke();
        p.ellipse(px, py, 5);
      }
    });

    // Draw node
    p.fill(TEAL_RGB.r, TEAL_RGB.g, TEAL_RGB.b, node.active ? 150 : 60);
    p.noStroke();
    p.ellipse(node.x, node.y, 6);
  });

  p.pop();
}
