// ═══════════════════════════════════════════════════════════════════════════
// VOID SEGMENT - Opening sequence with drifting particles in darkness
// "before the naming, potential stirs in the deep"
// ═══════════════════════════════════════════════════════════════════════════

import { Segment } from '../timeline/Choreography.js';
import { Particle, ParticleEmitter } from '../entities/Particle.js';
import { PentadSymbol, WoodsmokeParticle } from '../entities/index.js';
import {
  NoiseDriftBehavior,
  CenterPullBehavior,
  MouseRepelBehavior,
  GatherOnStillMouseBehavior,
  WrapBoundsBehavior,
  PulseBehavior,
  GlowBehavior
} from '../behaviors/index.js';
import { COLORS, hexToRgb } from '../config/colors.js';

export const voidSegment = new Segment({
  name: 'void',
  duration: 28,
  flexible: true,
  minDuration: 15,
  maxDuration: 60,

  setup(ctx, segment) {
    // Create 600 void particles
    for (let i = 0; i < 600; i++) {
      const colors = [COLORS.violet, COLORS.blush, COLORS.magenta];
      ctx.entities.spawn(Particle, {
        tags: ['void-particle'],
        x: Math.random() * ctx.width,
        y: Math.random() * ctx.height,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.5 + Math.random() * 0.3,
        behaviors: [
          NoiseDriftBehavior,
          CenterPullBehavior,
          MouseRepelBehavior,
          GatherOnStillMouseBehavior,
          WrapBoundsBehavior,
          PulseBehavior,
          GlowBehavior
        ]
      });
    }

    // Create floating pentad symbols (sparse)
    const types = ['boon', 'bane', 'bone', 'bonk', 'honk'];
    for (let i = 0; i < 15; i++) {
      ctx.entities.spawn(PentadSymbol, {
        tags: ['void-symbol'],
        type: types[i % 5],
        opacity: 0.15, // Keep them subtle in this scene
        width: ctx.width,
        height: ctx.height
      });
    }

    // Store segment state
    segment.state = {
      centerPull: 0.0002
    };

    // Start audio drone
    ctx.audio?.updateDrone(0, 0);
  },

  update(ctx, segment, dt) {
    const progress = segment.getProgress();

    // Increase center pull as scene progresses
    segment.state.centerPull = 0.0002 + progress * 0.002;

    // Spawn woodsmoke occasionally
    if (Math.random() < 0.03) {
      ctx.entities.spawn(WoodsmokeParticle, {
        tags: ['void-smoke'],
        x: Math.random() * ctx.width,
        y: ctx.height
      });
    }

    // Dynamic behavior based on mouse stillness
    if (ctx.input.mouseStillTime > 3) {
      segment.extend(dt * 0.5);
    }

    // Update audio drone
    ctx.audio?.updateDrone(0, progress);
  },

  render(ctx, segment) {
    const p = ctx.p5;
    const progress = segment.getProgress();

    p.push();
    p.blendMode(p.ADD);

    // Mouse trail
    p.noStroke();
    const honkRgb = hexToRgb(COLORS.honk);
    for (let i = 0; i < 10; i++) {
      const trailX = ctx.input.mouseX - ctx.input.mouseVel.x * i * 0.3;
      const trailY = ctx.input.mouseY - ctx.input.mouseVel.y * i * 0.3;
      const alpha = (1 - i / 10) * 0.2;
      p.fill(honkRgb.r, honkRgb.g, honkRgb.b, alpha * 255);
      p.ellipse(trailX, trailY, 10 - i);
    }

    // Quantum foam flickers
    if (Math.random() < 0.03) {
      const violetRgb = hexToRgb(COLORS.violet);
      p.fill(violetRgb.r, violetRgb.g, violetRgb.b, (0.1 + Math.random() * 0.2) * 255);
      p.noStroke();
      p.ellipse(
        Math.random() * ctx.width,
        Math.random() * ctx.height,
        20 + Math.random() * 40
      );
    }

    // Central gathering glow as progress increases
    if (progress > 0.3) {
      const glowIntensity = (progress - 0.3) / 0.7 * 0.3;
      const violetRgb = hexToRgb(COLORS.violet);

      for (let r = 200; r > 0; r -= 30) {
        p.fill(violetRgb.r, violetRgb.g, violetRgb.b, glowIntensity * 0.05 * 255);
        p.noStroke();
        p.ellipse(ctx.width / 2, ctx.height / 2, r * 2);
      }
    }

    p.pop();
  },

  teardown(ctx, segment) {
    // Fade void particles (but don't remove - continuity)
    const particles = ctx.entities.getByTag('void-particle');
    for (const p of particles) {
      p.transform.alpha *= 0.5;
    }

    // Mark as dormant
    ctx.entities.markDormant('void-smoke');
  },

  canExit(ctx) {
    return ctx.input.mouseStillTime < 2;
  }
});
