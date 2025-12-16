// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT - Base class for entity components
// ═══════════════════════════════════════════════════════════════════════════

export class Component {
  constructor(config = {}) {
    this.entity = null; // Set when attached to entity
    this.enabled = true;
    Object.assign(this, config);
  }

  // Called when component is attached to an entity
  onAttach(entity) {
    this.entity = entity;
  }

  // Called when component is removed from entity
  onDetach() {
    this.entity = null;
  }

  // Override in subclasses for per-frame updates
  update(ctx, dt) {}

  // Override in subclasses for rendering
  render(ctx) {}
}

// ─── TRANSFORM COMPONENT ──────────────────────────────────────────────────
export class TransformComponent extends Component {
  constructor(config = {}) {
    super(config);
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.rotation = config.rotation || 0;
    this.scaleX = config.scaleX || 1;
    this.scaleY = config.scaleY || 1;
    this.alpha = config.alpha !== undefined ? config.alpha : 1;
  }

  // Apply transform to p5 context
  apply(p5) {
    p5.translate(this.x, this.y);
    p5.rotate(this.rotation);
    p5.scale(this.scaleX, this.scaleY);
  }
}

// ─── PHYSICS COMPONENT ────────────────────────────────────────────────────
export class PhysicsComponent extends Component {
  constructor(config = {}) {
    super(config);
    this.velocity = config.velocity || { x: 0, y: 0 };
    this.acceleration = config.acceleration || { x: 0, y: 0 };
    this.friction = config.friction !== undefined ? config.friction : 0.99;
    this.mass = config.mass || 1;
    this.maxSpeed = config.maxSpeed || Infinity;
  }

  update(ctx, dt) {
    if (!this.entity) return;

    const transform = this.entity.transform;

    // Apply acceleration
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;

    // Apply friction (frame-rate independent using exponential decay)
    // friction^(dt*60) normalizes to 60fps behavior
    const frictionFactor = Math.pow(this.friction, dt * 60);
    this.velocity.x *= frictionFactor;
    this.velocity.y *= frictionFactor;

    // Clamp to max speed
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
    }

    // Update position (scaled by dt for frame-rate independence)
    transform.x += this.velocity.x * dt * 60;
    transform.y += this.velocity.y * dt * 60;

    // Reset acceleration each frame
    this.acceleration.x = 0;
    this.acceleration.y = 0;
  }

  applyForce(fx, fy) {
    this.acceleration.x += fx / this.mass;
    this.acceleration.y += fy / this.mass;
  }

  setVelocity(vx, vy) {
    this.velocity.x = vx;
    this.velocity.y = vy;
  }
}

// ─── VISUAL COMPONENT ─────────────────────────────────────────────────────
export class VisualComponent extends Component {
  constructor(config = {}) {
    super(config);
    this.shape = config.shape || 'ellipse'; // ellipse, rect, custom
    this.color = config.color || '#ffffff';
    this.size = config.size || 10;
    this.sizeY = config.sizeY || null; // For non-uniform shapes
    this.strokeColor = config.strokeColor || null;
    this.strokeWeight = config.strokeWeight || 0;
    this.customRender = config.customRender || null; // Function for custom rendering

    // Pre-cache RGB values to avoid per-frame p5.color() calls
    this._cachedColorStr = null;
    this._cachedRgb = null;
  }

  render(ctx) {
    if (!this.entity || !this.enabled) return;

    const p5 = ctx.p5;
    const transform = this.entity.transform;

    p5.push();
    transform.apply(p5);

    // Apply alpha
    const alpha = transform.alpha * 255;

    // Set colors
    if (this.strokeColor && this.strokeWeight > 0) {
      p5.stroke(this.strokeColor);
      p5.strokeWeight(this.strokeWeight);
    } else {
      p5.noStroke();
    }

    // Cache color RGB conversion (avoid p5.color() call every frame)
    if (typeof this.color === 'string') {
      if (this.color !== this._cachedColorStr) {
        this._cachedColorStr = this.color;
        const c = p5.color(this.color);
        this._cachedRgb = [c.levels[0], c.levels[1], c.levels[2]];
      }
      p5.fill(this._cachedRgb[0], this._cachedRgb[1], this._cachedRgb[2], alpha);
    } else {
      p5.fill(this.color);
    }

    // Draw shape
    const sizeY = this.sizeY || this.size;

    if (this.customRender) {
      this.customRender(p5, this, this.entity);
    } else {
      switch (this.shape) {
        case 'ellipse':
          p5.ellipse(0, 0, this.size, sizeY);
          break;
        case 'rect':
          p5.rectMode(p5.CENTER);
          p5.rect(0, 0, this.size, sizeY);
          break;
        case 'triangle':
          p5.triangle(
            0, -this.size / 2,
            -this.size / 2, this.size / 2,
            this.size / 2, this.size / 2
          );
          break;
      }
    }

    p5.pop();
  }
}

// ─── LIFESPAN COMPONENT ───────────────────────────────────────────────────
export class LifespanComponent extends Component {
  constructor(config = {}) {
    super(config);
    this.maxLife = config.maxLife || config.lifespan || 1;
    this.life = this.maxLife;
    this.fadeIn = config.fadeIn || 0; // Seconds to fade in
    this.fadeOut = config.fadeOut || 0.3; // Seconds to fade out
    this.autoDispose = config.autoDispose !== false;
  }

  get progress() {
    return 1 - (this.life / this.maxLife);
  }

  get normalized() {
    return this.life / this.maxLife;
  }

  update(ctx, dt) {
    this.life -= dt;

    // Calculate alpha based on fade
    if (this.entity) {
      let alpha = 1;

      const age = this.maxLife - this.life;
      if (this.fadeIn > 0 && age < this.fadeIn) {
        alpha = age / this.fadeIn;
      }
      if (this.fadeOut > 0 && this.life < this.fadeOut) {
        alpha = Math.min(alpha, this.life / this.fadeOut);
      }

      this.entity.transform.alpha = alpha;
    }

    // Auto dispose when dead
    if (this.life <= 0 && this.autoDispose && this.entity) {
      this.entity.dispose();
    }
  }

  isDead() {
    return this.life <= 0;
  }

  reset() {
    this.life = this.maxLife;
  }
}
