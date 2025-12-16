// ═══════════════════════════════════════════════════════════════════════════
// ENDING SEGMENT - The Spiral Continues
// "the spiral is yours. it always was."
// ═══════════════════════════════════════════════════════════════════════════

import { Segment } from '../timeline/Choreography.js';
import { PentadSymbol } from '../entities/index.js';
import { COLORS, hexToRgb, lerpColor } from '../config/colors.js';

export const endingSegment = new Segment({
  name: 'ending',
  duration: 30,
  flexible: false,

  setup(ctx, segment) {
    const p = ctx.p5;

    // Create multiple final spirals
    const finalSpirals = [];
    for (let i = 0; i < 12; i++) {
      finalSpirals.push({
        x: ctx.width * 0.1 + Math.random() * ctx.width * 0.8,
        y: ctx.height * 0.1 + Math.random() * ctx.height * 0.8,
        size: 30 + Math.random() * 50,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (0.01 + Math.random() * 0.02) * (Math.random() < 0.5 ? 1 : -1),
        opacity: 0,
        glowIntensity: 0,
        color: lerpColor(COLORS.violet, COLORS.teal, Math.random())
      });
    }

    // Create prominent pentad symbols
    const types = ['boon', 'bane', 'bone', 'bonk', 'honk'];
    for (let i = 0; i < 30; i++) {
      ctx.entities.spawn(PentadSymbol, {
        tags: ['ending-symbol'],
        type: types[i % 5],
        opacity: 0.4,
        width: ctx.width,
        height: ctx.height
      });
    }

    // Store segment state
    segment.state = {
      finalSpirals,
      montagePhase: 0,
      colorExplosionTriggered: false,
      colorExplosionParticles: [],
      finalHonkTriggered: false
    };

    // Start audio drone
    ctx.audio?.updateDrone(5, 0);
  },

  update(ctx, segment, dt) {
    const progress = segment.getProgress();
    const state = segment.state;

    // Update spirals
    state.finalSpirals.forEach(spiral => {
      spiral.opacity += (progress * 0.7 - spiral.opacity) * 0.05;
      spiral.rotation += spiral.rotationSpeed;

      // Mouse selects nearest spiral
      const dToMouse = Math.hypot(ctx.input.mouseX - spiral.x, ctx.input.mouseY - spiral.y);
      spiral.glowIntensity += (Math.max(0, 1 - dToMouse / 200) - spiral.glowIntensity) * 0.1;
    });

    // Montage phase (rapid scene flashbacks)
    if (progress > 0.3 && progress < 0.5) {
      state.montagePhase = (progress - 0.3) / 0.2;
    } else {
      state.montagePhase = 0;
    }

    // Color explosion near end
    if (progress > 0.85 && !state.colorExplosionTriggered) {
      state.colorExplosionTriggered = true;
      triggerColorExplosion(ctx, state);
      ctx.audio?.playChime(659); // E5
    }

    // Update color explosion particles
    state.colorExplosionParticles = state.colorExplosionParticles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dt * 0.5;
      return p.life > 0;
    });

    // Final HONK
    if (progress > 0.92 && !state.finalHonkTriggered) {
      state.finalHonkTriggered = true;
      ctx.audio?.playHonk();
    }

    // Update audio drone
    ctx.audio?.updateDrone(5, progress);
  },

  render(ctx, segment) {
    const p = ctx.p5;
    const progress = segment.getProgress();
    const state = segment.state;
    const centerX = ctx.width / 2;
    const centerY = ctx.height / 2;

    // Zoom out effect
    const zoomScale = 1 - progress * 0.4 * Math.min(1, progress / 0.6);

    // Draw montage flashes
    if (state.montagePhase > 0) {
      drawMontageFlashes(p, ctx, state.montagePhase);
    }

    // Current scene shrinks (main spiral)
    p.push();
    p.translate(centerX, centerY);
    p.scale(zoomScale);

    // Draw main spiral
    const tealRgb = hexToRgb(COLORS.teal);
    p.noFill();
    p.stroke(tealRgb.r, tealRgb.g, tealRgb.b, 0.5 * 255);
    p.strokeWeight(2);
    p.beginShape();
    for (let a = 0; a < Math.PI * 2 * 5; a += 0.15) {
      const r = a * 12 + p.noise(a * 0.3, ctx.time.total * 0.3) * 12;
      p.curveVertex(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.endShape();

    // Central glow
    p.blendMode(p.ADD);
    const honkRgb = hexToRgb(COLORS.honk);
    for (let r = 60; r > 0; r -= 12) {
      p.fill(honkRgb.r, honkRgb.g, honkRgb.b, 0.06 * 255);
      p.noStroke();
      p.ellipse(0, 0, r * 2);
    }
    p.pop();

    // Draw multiple smaller spirals
    state.finalSpirals.forEach(spiral => drawFinalSpiral(p, ctx, spiral));

    // Draw spiral connections
    drawSpiralConnections(p, ctx, state.finalSpirals);

    // Draw color explosion
    drawColorExplosion(p, state.colorExplosionParticles);

    // Peaceful glow when mouse is still
    if (ctx.input.mouseStillTime > 2) {
      p.push();
      p.blendMode(p.ADD);
      const peaceGlow = Math.min(0.3, (ctx.input.mouseStillTime - 2) / 3 * 0.3);
      const boneRgb = hexToRgb(COLORS.bone);
      for (let r = 70; r > 0; r -= 12) {
        p.fill(boneRgb.r, boneRgb.g, boneRgb.b, peaceGlow * 0.12 * 255);
        p.noStroke();
        p.ellipse(ctx.input.mouseX, ctx.input.mouseY, r);
      }
      p.pop();
    }
  },

  teardown(ctx, segment) {
    // Clean up symbols
    const symbols = ctx.entities.getByTag('ending-symbol');
    for (const s of symbols) {
      ctx.entities.dispose(s);
    }

    // Clean up all remaining entities
    const allEntities = ctx.entities.getActive();
    for (const entity of allEntities) {
      ctx.entities.dispose(entity);
    }

    ctx.emit('experience-complete');
  }
});

function triggerColorExplosion(ctx, state) {
  const colors = [COLORS.boon, COLORS.bane, COLORS.bone, COLORS.bonk, COLORS.honk];

  for (let i = 0; i < 100; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 9;
    state.colorExplosionParticles.push({
      x: ctx.width / 2,
      y: ctx.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 8 + Math.random() * 17,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1
    });
  }
}

function drawMontageFlashes(p, ctx, phase) {
  const flashIndex = Math.floor(phase * 5);
  const flashAlpha = Math.sin(phase * Math.PI * 5) * 0.3;

  if (flashAlpha > 0) {
    const flashColors = [COLORS.violet, COLORS.amber, COLORS.teal, COLORS.boon, COLORS.honk];
    const rgb = hexToRgb(flashColors[flashIndex % 5]);

    p.push();
    p.noStroke();
    p.fill(rgb.r, rgb.g, rgb.b, flashAlpha * 255);
    p.rect(0, 0, ctx.width, ctx.height);
    p.pop();
  }
}

function drawFinalSpiral(p, ctx, spiral) {
  p.push();
  p.translate(spiral.x, spiral.y);
  p.rotate(spiral.rotation);
  p.scale(spiral.size / 50);

  // Draw mini spiral
  p.noFill();
  const honkRgb = hexToRgb(COLORS.honk);
  const spiralRgb = hexToRgb(spiral.color);
  const rgb = {
    r: spiralRgb.r + (honkRgb.r - spiralRgb.r) * spiral.glowIntensity,
    g: spiralRgb.g + (honkRgb.g - spiralRgb.g) * spiral.glowIntensity,
    b: spiralRgb.b + (honkRgb.b - spiralRgb.b) * spiral.glowIntensity
  };
  p.stroke(rgb.r, rgb.g, rgb.b, spiral.opacity * 255);
  p.strokeWeight(1.5);

  p.beginShape();
  for (let a = 0; a < Math.PI * 2 * 3; a += 0.2) {
    const r = a * 5;
    p.curveVertex(Math.cos(a) * r, Math.sin(a) * r);
  }
  p.endShape();

  // Glow on selected
  if (spiral.glowIntensity > 0.1) {
    p.push();
    p.blendMode(p.ADD);
    p.fill(honkRgb.r, honkRgb.g, honkRgb.b, spiral.glowIntensity * 0.25 * 255);
    p.noStroke();
    p.ellipse(0, 0, 35);
    p.pop();
  }

  p.pop();
}

function drawSpiralConnections(p, ctx, spirals) {
  p.push();
  p.blendMode(p.ADD);
  const honkRgb = hexToRgb(COLORS.honk);

  spirals.forEach(spiral => {
    if (spiral.glowIntensity > 0.2) {
      p.stroke(honkRgb.r, honkRgb.g, honkRgb.b, spiral.glowIntensity * 0.35 * 255);
      p.strokeWeight(1);

      // Curved line from mouse to spiral
      p.noFill();
      p.beginShape();
      p.curveVertex(ctx.input.mouseX, ctx.input.mouseY);
      p.curveVertex(ctx.input.mouseX, ctx.input.mouseY);
      p.curveVertex(
        (ctx.input.mouseX + spiral.x) / 2 + Math.sin(ctx.time.total * 2) * 30,
        (ctx.input.mouseY + spiral.y) / 2 + Math.cos(ctx.time.total * 2) * 30
      );
      p.curveVertex(spiral.x, spiral.y);
      p.curveVertex(spiral.x, spiral.y);
      p.endShape();
    }
  });

  p.pop();
}

function drawColorExplosion(p, particles) {
  p.push();
  p.blendMode(p.ADD);
  p.noStroke();

  particles.forEach(particle => {
    const rgb = hexToRgb(particle.color);
    p.fill(rgb.r, rgb.g, rgb.b, particle.life * 0.6 * 255);
    p.ellipse(particle.x, particle.y, particle.size * particle.life);
  });

  p.pop();
}
