// ═══════════════════════════════════════════════════════════════════════════
// TITAN SEGMENT - The Thirteenth Turning, you are the question and the answer
// "clay and memory take form"
// ═══════════════════════════════════════════════════════════════════════════

import { Segment } from '../timeline/Choreography.js';
import { Titan } from '../entities/characters/Titan.js';
import { AuroraTrail, PentadSymbol } from '../entities/index.js';
import { COLORS, hexToRgb } from '../config/colors.js';

export const titanSegment = new Segment({
  name: 'titan',
  duration: 25,
  flexible: true,
  minDuration: 20,
  maxDuration: 120,

  setup(ctx, segment) {
    // Spawn titan
    const titan = ctx.entities.spawn(Titan, {
      tags: ['titan-main'],
      x: ctx.width / 2,
      y: ctx.height / 2,
      onHeartbeat: () => ctx.audio?.playHeartbeat()
    });

    // Create background pentad symbols
    const types = ['boon', 'bane', 'bone', 'bonk', 'honk'];
    for (let i = 0; i < 25; i++) {
      ctx.entities.spawn(PentadSymbol, {
        tags: ['titan-symbol'],
        type: types[i % 5],
        opacity: 0.25,
        width: ctx.width,
        height: ctx.height
      });
    }

    // Store segment state
    segment.state = {
      titan,
      frameCounter: 0
    };

    // Start audio drone
    ctx.audio?.updateDrone(4, 0);
  },

  update(ctx, segment, dt) {
    const progress = segment.getProgress();
    const state = segment.state;

    // Update titan progress
    if (state.titan) {
      state.titan.setProgress(progress);
    }

    // Spawn aurora trails from mouse every 2 frames
    state.frameCounter++;
    if (state.frameCounter >= 2) {
      state.frameCounter = 0;
      ctx.entities.spawn(AuroraTrail, {
        tags: ['titan-aurora'],
        x: ctx.input.mouseX,
        y: ctx.input.mouseY
      });
    }

    // Extend when user is engaged with titan
    if (state.titan) {
      const titanDist = Math.hypot(
        ctx.input.mouseX - state.titan.transform.x,
        ctx.input.mouseY - state.titan.transform.y
      );
      if (titanDist < 250) {
        segment.extend(dt * 0.5);
      }
    }

    // Update audio drone
    ctx.audio?.updateDrone(4, progress);
  },

  render(ctx, segment) {
    const p = ctx.p5;
    const centerX = ctx.width / 2;
    const centerY = ctx.height / 2;

    // Draw faint background spiral (continuity from Polvo scene)
    p.push();
    p.translate(centerX, centerY);
    p.blendMode(p.ADD);

    const violetRgb = hexToRgb(COLORS.violet);
    p.stroke(violetRgb.r, violetRgb.g, violetRgb.b, 30);
    p.strokeWeight(1);
    p.noFill();

    p.beginShape();
    for (let a = 0; a < Math.PI * 2 * 4; a += 0.2) {
      const r = a * 18;
      p.curveVertex(
        Math.cos(a + ctx.time.total * 0.1) * r,
        Math.sin(a + ctx.time.total * 0.1) * r
      );
    }
    p.endShape();

    p.pop();
  },

  teardown(ctx, segment) {
    // Titan stays for ending
    // Clean up aurora
    const auroras = ctx.entities.getByTag('titan-aurora');
    for (const a of auroras) {
      ctx.entities.dispose(a);
    }

    // Clean up symbols
    const symbols = ctx.entities.getByTag('titan-symbol');
    for (const s of symbols) {
      ctx.entities.dispose(s);
    }
  }
});
