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
  PulseBehavior
} from '../behaviors/index.js';
import { COLORS, hexToRgb } from '../config/colors.js';

// Pre-cached RGB values for render performance
const HONK_RGB = hexToRgb(COLORS.honk);
const VIOLET_RGB = hexToRgb(COLORS.violet);

export const voidSegment = new Segment({
  name: 'void',
  duration: 28,
  flexible: true,
  minDuration: 15,
  maxDuration: 60,

  setup(ctx, segment) {
    // Create 150 void particles (reduced from 600 for performance)
    // GlowBehavior removed - causes overlapping visual mess
    const colors = [COLORS.violet, COLORS.blush, COLORS.magenta];
    for (let i = 0; i < 150; i++) {
      ctx.entities.spawn(Particle, {
        tags: ['void-particle'],
        x: Math.random() * ctx.width,
        y: Math.random() * ctx.height,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.6 + Math.random() * 0.4,
        behaviors: [
          NoiseDriftBehavior,
          CenterPullBehavior,
          MouseRepelBehavior,
          GatherOnStillMouseBehavior,
          WrapBoundsBehavior,
          PulseBehavior
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
    const newCenterPull = 0.0002 + progress * 0.002;
    segment.state.centerPull = newCenterPull;

    // Apply center pull to particle behaviors
    const particles = ctx.entities.getByTag('void-particle');
    for (const particle of particles) {
      const centerPull = particle.behaviors.find(b => b.constructor.name === 'CenterPullBehavior');
      if (centerPull) {
        centerPull.strength = newCenterPull;
      }
    }

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

    // Mouse trail (uses pre-cached HONK_RGB)
    p.noStroke();
    for (let i = 0; i < 10; i++) {
      const trailX = ctx.input.mouseX - ctx.input.mouseVel.x * i * 0.3;
      const trailY = ctx.input.mouseY - ctx.input.mouseVel.y * i * 0.3;
      const alpha = (1 - i / 10) * 0.2;
      p.fill(HONK_RGB.r, HONK_RGB.g, HONK_RGB.b, alpha * 255);
      p.ellipse(trailX, trailY, 10 - i);
    }

    // Quantum foam flickers (uses pre-cached VIOLET_RGB)
    if (Math.random() < 0.03) {
      p.fill(VIOLET_RGB.r, VIOLET_RGB.g, VIOLET_RGB.b, (0.1 + Math.random() * 0.2) * 255);
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

      for (let r = 200; r > 0; r -= 30) {
        p.fill(VIOLET_RGB.r, VIOLET_RGB.g, VIOLET_RGB.b, glowIntensity * 0.05 * 255);
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
