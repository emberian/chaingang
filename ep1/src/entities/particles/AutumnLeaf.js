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
    this.colorRgb = hexToRgb(this.color); // Pre-cache RGB

    // Position
    if (config.x !== undefined) this.transform.x = config.x;
    if (config.y !== undefined) this.transform.y = config.y;
  }

  onUpdate(ctx, dt) {
    const physics = this.getComponent('physics');

    // Wobble motion - apply as force so PhysicsComponent handles it
    physics.applyForce(Math.sin(ctx.time.total + this.wobbleOffset) * 1.2, 0);

    // Wind gusts
    if (Math.random() < 0.01) {
      physics.applyForce((Math.random() - 0.5) * 60, 0);
    }

    // Rotation
    this.rotation += this.rotSpeed * dt * 60;

    // Remove if off screen (position updated by PhysicsComponent)
    if (this.transform.y > ctx.height + 50) {
      this.dispose();
    }
  }

  onRender(ctx) {
    const p = ctx.p5;
    const rgb = this.colorRgb; // Use pre-cached RGB

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
