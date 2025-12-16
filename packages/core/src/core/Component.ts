// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT - Base class for entity components
// ═══════════════════════════════════════════════════════════════════════════

import type {
  IComponent,
  ITransformComponent,
  IPhysicsComponent,
  IVisualComponent,
  ILifespanComponent,
  IEntity,
  IContext,
  P5Instance,
  Vector2,
  TransformConfig,
  PhysicsConfig,
  VisualConfig,
  LifespanConfig
} from '../types/index.js';

// ─── BASE COMPONENT ──────────────────────────────────────────────────────────

export class Component implements IComponent {
  entity: IEntity | null = null;
  enabled = true;

  constructor(config: Record<string, unknown> = {}) {
    Object.assign(this, config);
  }

  onAttach(entity: IEntity): void {
    this.entity = entity;
  }

  onDetach(): void {
    this.entity = null;
  }

  update(_ctx: IContext, _dt: number): void {}

  render?(_ctx: IContext): void {}
}

// ─── TRANSFORM COMPONENT ─────────────────────────────────────────────────────

export class TransformComponent extends Component implements ITransformComponent {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;

  constructor(config: Partial<TransformConfig> = {}) {
    super();
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.rotation = config.rotation ?? 0;
    this.scaleX = config.scaleX ?? 1;
    this.scaleY = config.scaleY ?? 1;
    this.alpha = config.alpha ?? 1;
  }

  get scale(): number {
    return this.scaleX;
  }

  set scale(value: number) {
    this.scaleX = value;
    this.scaleY = value;
  }

  apply(p5: P5Instance): void {
    p5.translate(this.x, this.y);
    p5.rotate(this.rotation);
    p5.scale(this.scaleX, this.scaleY);
  }
}

// ─── PHYSICS COMPONENT ───────────────────────────────────────────────────────

export class PhysicsComponent extends Component implements IPhysicsComponent {
  velocity: Vector2;
  acceleration: Vector2;
  friction: number;
  mass: number;
  maxSpeed: number;

  constructor(config: PhysicsConfig = {}) {
    super();
    this.velocity = config.velocity ?? { x: 0, y: 0 };
    this.acceleration = config.acceleration ?? { x: 0, y: 0 };
    this.friction = config.friction ?? 0.99;
    this.mass = config.mass ?? 1;
    this.maxSpeed = config.maxSpeed ?? Infinity;
  }

  update(_ctx: IContext, dt: number): void {
    if (!this.entity) return;

    const transform = this.entity.transform;

    // Apply acceleration
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;

    // Apply friction
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;

    // Clamp to max speed
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
    }

    // Update position
    transform.x += this.velocity.x;
    transform.y += this.velocity.y;

    // Reset acceleration each frame
    this.acceleration.x = 0;
    this.acceleration.y = 0;
  }

  applyForce(fx: number, fy: number): void {
    this.acceleration.x += fx / this.mass;
    this.acceleration.y += fy / this.mass;
  }

  setVelocity(vx: number, vy: number): void {
    this.velocity.x = vx;
    this.velocity.y = vy;
  }
}

// ─── VISUAL COMPONENT ────────────────────────────────────────────────────────

export class VisualComponent extends Component implements IVisualComponent {
  shape: string;
  color: string;
  size: number;
  sizeY: number | null;
  strokeColor: string | null;
  strokeWeight: number;
  customRender: ((p5: P5Instance, visual: VisualComponent, entity: IEntity) => void) | null;

  constructor(config: VisualConfig = {}) {
    super();
    this.shape = config.shape ?? 'ellipse';
    this.color = config.color ?? '#ffffff';
    this.size = config.size ?? 10;
    this.sizeY = config.sizeY ?? null;
    this.strokeColor = config.strokeColor ?? null;
    this.strokeWeight = config.strokeWeight ?? 0;
    this.customRender = config.customRender ?? null;
  }

  render(ctx: IContext): void {
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

    const c = p5.color(this.color);
    p5.fill(p5.red(c), p5.green(c), p5.blue(c), alpha);

    // Draw shape
    const sizeY = this.sizeY ?? this.size;

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

// ─── LIFESPAN COMPONENT ──────────────────────────────────────────────────────

export class LifespanComponent extends Component implements ILifespanComponent {
  maxLife: number;
  life: number;
  fadeIn: number;
  fadeOut: number;
  autoDispose: boolean;

  constructor(config: LifespanConfig = {}) {
    super();
    this.maxLife = config.maxLife ?? config.lifespan ?? 1;
    this.life = this.maxLife;
    this.fadeIn = config.fadeIn ?? 0;
    this.fadeOut = config.fadeOut ?? 0.3;
    this.autoDispose = config.autoDispose !== false;
  }

  get progress(): number {
    return 1 - (this.life / this.maxLife);
  }

  get normalized(): number {
    return this.life / this.maxLife;
  }

  update(_ctx: IContext, dt: number): void {
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

  isDead(): boolean {
    return this.life <= 0;
  }

  reset(): void {
    this.life = this.maxLife;
  }
}
