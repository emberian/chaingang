// ═══════════════════════════════════════════════════════════════════════════
// TRANSITION RENDERER - Visual effects for segment transitions
// ═══════════════════════════════════════════════════════════════════════════

import { COLORS, hexToRgb } from '../config/colors.js';

// Transition types per segment boundary
const TRANSITION_TYPES = [
  'fade',       // 0->1: Void to Ignition
  'spiral',     // 1->2: Ignition to Polvo
  'portal',     // 2->3: Polvo to Gnomes
  'converge',   // 3->4: Gnomes to Titan
  'zoom',       // 4->5: Titan to Ending
];

export class TransitionRenderer {
  constructor() {
    this.fromIndex = 0;
    this.toIndex = 0;
  }

  setTransition(fromIndex, toIndex) {
    this.fromIndex = fromIndex;
    this.toIndex = toIndex;
  }

  render(ctx, progress) {
    const p = ctx.p5;
    const type = TRANSITION_TYPES[this.fromIndex] || 'fade';
    const eased = easeInOutCubic(progress);

    switch (type) {
      case 'fade':
        this.renderFade(p, ctx, eased);
        break;
      case 'spiral':
        this.renderSpiral(p, ctx, eased);
        break;
      case 'portal':
        this.renderPortal(p, ctx, eased);
        break;
      case 'converge':
        this.renderConverge(p, ctx, eased);
        break;
      case 'zoom':
        this.renderZoom(p, ctx, eased);
        break;
    }
  }

  renderFade(p, ctx, progress) {
    // Simple crossfade with color wash
    const rgb = hexToRgb(COLORS.indigo);

    p.push();
    p.noStroke();

    if (progress < 0.5) {
      // Fade to color
      const alpha = progress * 2;
      p.fill(rgb.r, rgb.g, rgb.b, alpha * 0.8 * 255);
      p.rect(0, 0, ctx.width, ctx.height);
    } else {
      // Fade from color
      const alpha = (1 - progress) * 2;
      p.fill(rgb.r, rgb.g, rgb.b, alpha * 0.8 * 255);
      p.rect(0, 0, ctx.width, ctx.height);
    }

    p.pop();
  }

  renderSpiral(p, ctx, progress) {
    // Spiral wipe revealing next scene
    const voidRgb = hexToRgb(COLORS.void);
    const tealRgb = hexToRgb(COLORS.teal);

    p.push();
    p.translate(ctx.width / 2, ctx.height / 2);

    const maxRadius = Math.sqrt(ctx.width * ctx.width + ctx.height * ctx.height) / 2;
    const currentRadius = maxRadius * progress;

    // Draw spiral mask
    p.noStroke();
    p.fill(voidRgb.r, voidRgb.g, voidRgb.b, 255);

    // Create spiral shape
    p.beginShape();
    const coils = 3;
    for (let a = 0; a < Math.PI * 2 * coils; a += 0.1) {
      const r = (a / (Math.PI * 2 * coils)) * currentRadius;
      const thickness = 50 + Math.sin(a * 2) * 20;
      p.vertex(Math.cos(a) * (r + thickness), Math.sin(a) * (r + thickness));
    }
    for (let a = Math.PI * 2 * coils; a > 0; a -= 0.1) {
      const r = (a / (Math.PI * 2 * coils)) * currentRadius;
      p.vertex(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.endShape(p.CLOSE);

    // Spiral edge glow
    p.noFill();
    p.stroke(tealRgb.r, tealRgb.g, tealRgb.b, (1 - progress) * 200);
    p.strokeWeight(3);
    p.beginShape();
    for (let a = 0; a < Math.PI * 2 * coils; a += 0.1) {
      const r = (a / (Math.PI * 2 * coils)) * currentRadius;
      p.vertex(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.endShape();

    p.pop();
  }

  renderPortal(p, ctx, progress) {
    // <> portal opening effect
    const voidDeepRgb = hexToRgb(COLORS.voidDeep);
    const bonkRgb = hexToRgb(COLORS.bonk);

    p.push();
    p.translate(ctx.width / 2, ctx.height / 2);

    const maxSize = Math.max(ctx.width, ctx.height);
    const portalWidth = progress * maxSize * 1.5;
    const portalHeight = progress * maxSize * 0.8;

    // Dark edges closing/opening
    p.noStroke();
    p.fill(voidDeepRgb.r, voidDeepRgb.g, voidDeepRgb.b, 255);

    // Left chevron
    if (progress < 1) {
      p.beginShape();
      p.vertex(-ctx.width / 2, -ctx.height / 2);
      p.vertex(-portalWidth / 2, 0);
      p.vertex(-ctx.width / 2, ctx.height / 2);
      p.vertex(-ctx.width / 2, -ctx.height / 2);
      p.endShape(p.CLOSE);

      // Right chevron
      p.beginShape();
      p.vertex(ctx.width / 2, -ctx.height / 2);
      p.vertex(portalWidth / 2, 0);
      p.vertex(ctx.width / 2, ctx.height / 2);
      p.vertex(ctx.width / 2, -ctx.height / 2);
      p.endShape(p.CLOSE);
    }

    // Portal edge glow
    p.stroke(bonkRgb.r, bonkRgb.g, bonkRgb.b, (1 - Math.abs(progress - 0.5) * 2) * 255);
    p.strokeWeight(4);
    p.noFill();

    // < symbol
    p.line(-portalWidth / 2 - 20, -portalHeight / 3, -portalWidth / 2, 0);
    p.line(-portalWidth / 2, 0, -portalWidth / 2 - 20, portalHeight / 3);

    // > symbol
    p.line(portalWidth / 2 + 20, -portalHeight / 3, portalWidth / 2, 0);
    p.line(portalWidth / 2, 0, portalWidth / 2 + 20, portalHeight / 3);

    p.pop();
  }

  renderConverge(p, ctx, progress) {
    // Elements converging to center
    const numElements = 20;
    const convergeProg = easeOutBack(progress);

    p.push();

    for (let i = 0; i < numElements; i++) {
      const angle = (i / numElements) * Math.PI * 2;
      const startDist = Math.max(ctx.width, ctx.height);
      const endDist = 0;
      const dist = startDist + (endDist - startDist) * convergeProg;

      const x = ctx.width / 2 + Math.cos(angle) * dist;
      const y = ctx.height / 2 + Math.sin(angle) * dist;

      const size = 20 + Math.sin(i * 0.5) * 10;
      const alpha = (1 - progress) * 0.6;

      // Mix of pentad colors
      const colors = [COLORS.boon, COLORS.bane, COLORS.bone, COLORS.bonk, COLORS.honk];
      const rgb = hexToRgb(colors[i % 5]);

      p.noStroke();
      p.fill(rgb.r, rgb.g, rgb.b, alpha * 255);
      p.ellipse(x, y, size);
    }

    // Center flash at end
    if (progress > 0.8) {
      const flashAlpha = (progress - 0.8) * 5;
      p.fill(255, 255, 255, flashAlpha * 100);
      p.ellipse(ctx.width / 2, ctx.height / 2, (progress - 0.8) * 500);
    }

    p.pop();
  }

  renderZoom(p, ctx, progress) {
    // Zoom into spiral effect
    const tealRgb = hexToRgb(COLORS.teal);
    const voidDeepRgb = hexToRgb(COLORS.voidDeep);

    p.push();
    p.translate(ctx.width / 2, ctx.height / 2);

    const zoomScale = 1 + progress * 10;
    p.scale(zoomScale);
    p.rotate(progress * Math.PI);

    // Spiral that zooms past
    p.noFill();
    p.stroke(tealRgb.r, tealRgb.g, tealRgb.b, (1 - progress) * 150);
    p.strokeWeight(2 / zoomScale);

    p.beginShape();
    for (let a = 0; a < Math.PI * 2 * 5; a += 0.1) {
      const r = a * 10;
      p.vertex(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.endShape();

    p.pop();

    // Fade overlay
    if (progress > 0.7) {
      p.fill(voidDeepRgb.r, voidDeepRgb.g, voidDeepRgb.b, (progress - 0.7) * 3.33 * 255);
      p.noStroke();
      p.rect(0, 0, ctx.width, ctx.height);
    }
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
