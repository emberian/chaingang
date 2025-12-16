// ═══════════════════════════════════════════════════════════════════════════
// TRAIL BEHAVIOR - Leave visual trail behind moving entity
// Uses circular buffer for O(1) operations instead of array shift/unshift
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

    // Circular buffer for O(1) insert/remove
    this._buffer = new Array(this.length);
    this._head = 0;        // Points to newest entry
    this._count = 0;       // Number of valid entries

    // Cache RGB conversion
    this._cachedRgb = null;
    this._cachedColorStr = null;
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
      // Add current position to circular buffer
      this._head = (this._head + 1) % this.length;
      if (!this._buffer[this._head]) {
        this._buffer[this._head] = { x: 0, y: 0, alpha: 1 };
      }
      this._buffer[this._head].x = transform.x;
      this._buffer[this._head].y = transform.y;
      this._buffer[this._head].alpha = transform.alpha;

      if (this._count < this.length) {
        this._count++;
      }
    } else {
      // Fade existing trail
      if (this._count > 0) {
        this._count--;
      }
    }
  }

  onRender(entity, ctx) {
    if (this._count < 2) return;

    const p5 = ctx.p5;
    const visual = entity.getComponent('visual');
    const baseSize = visual?.size || 10;

    // Cache RGB conversion
    if (typeof this.color === 'string') {
      if (this.color !== this._cachedColorStr) {
        this._cachedColorStr = this.color;
        this._cachedRgb = hexToRgb(this.color);
      }
    } else {
      this._cachedRgb = this.color;
    }
    const rgb = this._cachedRgb;

    p5.push();
    p5.blendMode(p5.ADD);
    p5.noStroke();

    // Iterate through circular buffer from newest to oldest
    for (let i = 1; i < this._count; i++) {
      const idx = (this._head - i + this.length) % this.length;
      const point = this._buffer[idx];
      if (!point) continue;

      const progress = i / this._count;

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
