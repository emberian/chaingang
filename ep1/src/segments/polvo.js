// ═══════════════════════════════════════════════════════════════════════════
// POLVO SEGMENT - The octopus emerges from the spiral
// "from the spiral, eight arms reach"
// ═══════════════════════════════════════════════════════════════════════════

import { Segment } from '../timeline/Choreography.js';
import { Polvo } from '../entities/characters/Polvo.js';
import { InkSpray, AutumnLeaf } from '../entities/index.js';
import { COLORS } from '../config/colors.js';

export const polvoSegment = new Segment({
  name: 'polvo',
  duration: 35,
  flexible: true,
  minDuration: 20,
  maxDuration: 120,

  setup(ctx, segment) {
    // Spawn Polvo at center
    const polvo = ctx.entities.spawn(Polvo, {
      tags: ['polvo-main'],
      x: ctx.width / 2,
      y: ctx.height / 2,
      bodyColor: COLORS.teal,
      tentacleCount: 8
    });

    // Store segment state
    segment.state = {
      polvo: polvo,
      inkSpawnTimer: 0
    };

    // Start audio drone
    ctx.audio?.updateDrone(2, 0);
  },

  update(ctx, segment, dt) {
    const progress = segment.getProgress();
    const state = segment.state;

    // Update polvo growth progress
    if (state.polvo) {
      state.polvo.setProgress(progress);

      // Polvo subtly follows mouse
      const targetX = ctx.width / 2 + (ctx.input.mouseX - ctx.width / 2) * 0.05;
      const targetY = ctx.height / 2 + (ctx.input.mouseY - ctx.height / 2) * 0.05;
      state.polvo.transform.x += (targetX - state.polvo.transform.x) * dt * 0.5;
      state.polvo.transform.y += (targetY - state.polvo.transform.y) * dt * 0.5;
    }

    // Spawn ink on fast mouse movement
    if (ctx.input.mouseSpeed > 15) {
      state.inkSpawnTimer += dt;
      if (state.inkSpawnTimer > 0.05) {
        state.inkSpawnTimer = 0;
        for (let i = 0; i < 3; i++) {
          ctx.entities.spawn(InkSpray, {
            tags: ['polvo-ink'],
            x: ctx.input.mouseX + (Math.random() - 0.5) * 40,
            y: ctx.input.mouseY + (Math.random() - 0.5) * 40,
            vx: -ctx.input.mouseVel.x * 0.1,
            vy: -ctx.input.mouseVel.y * 0.1
          });
        }
      }
    }

    // Spawn autumn leaves
    if (progress > 0.2 && Math.random() < 0.04) {
      ctx.entities.spawn(AutumnLeaf, {
        tags: ['polvo-leaf'],
        x: Math.random() * ctx.width,
        y: -20,
        width: ctx.width,
        height: ctx.height
      });
    }

    // Extend duration if user is engaged
    if (ctx.input.mouseSpeed > 5 || ctx.input.mouseStillTime > 3) {
      segment.extend(dt * 0.3);
    }

    // Update audio drone
    ctx.audio?.updateDrone(2, progress);
  },

  teardown(ctx, segment) {
    const state = segment.state;

    // Polvo stays for gnomes segment, just reduce prominence
    if (state.polvo) {
      state.polvo.transform.alpha = 0.5;
    }

    // Clean up ink particles
    const inkParticles = ctx.entities.getByTag('polvo-ink');
    for (const p of inkParticles) {
      p.dispose();
    }
  },

  canExit(ctx) {
    return ctx.input.mouseStillTime < 1 || ctx.input.mouseSpeed > 20;
  }
});
