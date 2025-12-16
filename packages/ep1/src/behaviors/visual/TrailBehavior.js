// ═══════════════════════════════════════════════════════════════════════════
// TRAIL BEHAVIOR - Leave visual trail behind moving entity
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';
import { hexToRgb } from '../../config/colors.js';

export class TrailBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.length = config.length || 10;           // Number of trail points
    this.color = config.color || '#00d4ff';
    this.fadeOut = config.fadeOut !== false;     // Trail fades toward end
    this.sizeDecay = config.sizeDecay || 0.8;    // Size multiplier per point
    this.minSpeed = config.minSpeed || 0;        // Minimum speed to show trail
    this.history = [];
  }

  onUpdate(entity, ctx, dt) {
    const transform = entity.transform;

    // Calculate speed
    const physics = entity.getComponent('physics');
    let speed = 0;
    if (physics) {
      speed = Math.sqrt(physics.velocity.x ** 2 + physics.velocity.y ** 2);
    }

    // Only record if moving fast enough
    if (speed > this.minSpeed) {
      // Add current position to history
      this.history.unshift({
        x: transform.x,
        y: transform.y,
        alpha: transform.alpha
      });

      // Trim to max length
      if (this.history.length > this.length) {
        this.history.pop();
      }
    } else {
      // Fade existing trail
      if (this.history.length > 0) {
        this.history.pop();
      }
    }
  }

  onRender(entity, ctx) {
    if (this.history.length < 2) return;

    const p5 = ctx.p5;
    const visual = entity.getComponent('visual');
    const baseSize = visual?.size || 10;

    const rgb = typeof this.color === 'string'
      ? hexToRgb(this.color)
      : this.color;

    p5.push();
    p5.blendMode(p5.ADD);
    p5.noStroke();

    for (let i = 1; i < this.history.length; i++) {
      const point = this.history[i];
      const progress = i / this.history.length;

      // Calculate alpha (fade toward end)
      const alpha = this.fadeOut
        ? (1 - progress) * point.alpha * 0.5
        : point.alpha * 0.5;

      // Calculate size (decay toward end)
      const size = baseSize * Math.pow(this.sizeDecay, i);

      p5.fill(rgb.r, rgb.g, rgb.b, alpha * 255);
      p5.ellipse(point.x, point.y, size);
    }

    p5.pop();
  }
}
