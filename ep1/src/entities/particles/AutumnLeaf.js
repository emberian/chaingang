// ═══════════════════════════════════════════════════════════════════════════
// AUTUMN LEAF - Falling leaf particle with wind and rotation
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { PhysicsComponent } from '../../core/Component.js';
import { COLORS, hexToRgb } from '../../config/colors.js';

export class AutumnLeaf extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['particle', 'leaf', ...(config.tags || [])]
    });

    this.layer = 'particles';

    // Add physics
    this.addComponent('physics', new PhysicsComponent({
      velocity: {
        x: config.vx ?? (Math.random() - 0.5),
        y: config.vy ?? (0.5 + Math.random())
      },
      friction: 0.99
    }));

    // Leaf properties
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.06;
    this.size = config.size || (8 + Math.random() * 10);
    this.wobbleOffset = Math.random() * 1000;
    this.color = config.color || (Math.random() < 0.6 ? COLORS.crimson : COLORS.amber);

    // Position
    if (config.x !== undefined) this.transform.x = config.x;
    if (config.y !== undefined) this.transform.y = config.y;
  }

  onUpdate(ctx, dt) {
    const physics = this.getComponent('physics');

    // Wobble motion
    physics.velocity.x += Math.sin(ctx.time.total + this.wobbleOffset) * 0.02;

    // Wind gusts
    if (Math.random() < 0.01) {
      physics.velocity.x += (Math.random() - 0.5);
    }

    // Rotation
    this.rotation += this.rotSpeed;

    // Update position
    this.transform.x += physics.velocity.x;
    this.transform.y += physics.velocity.y;

    // Remove if off screen
    if (this.transform.y > ctx.height + 50) {
      ctx.entities.dispose(this);
    }
  }

  onRender(ctx) {
    const p = ctx.p5;
    const rgb = hexToRgb(this.color);

    p.push();
    p.translate(this.transform.x, this.transform.y);
    p.rotate(this.rotation);

    p.fill(rgb.r, rgb.g, rgb.b, this.transform.alpha * 180);
    p.noStroke();

    // Leaf shape using bezier
    p.beginShape();
    p.vertex(0, -this.size / 2);
    p.bezierVertex(
      this.size / 2, -this.size / 4,
      this.size / 2, this.size / 4,
      0, this.size / 2
    );
    p.bezierVertex(
      -this.size / 2, this.size / 4,
      -this.size / 2, -this.size / 4,
      0, -this.size / 2
    );
    p.endShape();

    // Leaf vein
    p.stroke(rgb.r * 0.7, rgb.g * 0.7, rgb.b * 0.7, this.transform.alpha * 100);
    p.strokeWeight(0.5);
    p.line(0, -this.size / 2 + 2, 0, this.size / 2 - 2);

    p.pop();
  }
}
