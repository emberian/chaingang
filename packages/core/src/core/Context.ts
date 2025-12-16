// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT - Clean shared context passed to all systems
// Replaces the global state pattern
// ═══════════════════════════════════════════════════════════════════════════

import { EntityManager } from './EntityManager.js';
import type {
  IContext,
  IEntityManager,
  ITimeline,
  IChoreography,
  IAudioEngine,
  IAudioReactor,
  IRenderPipeline,
  P5Instance,
  InputState,
  TimeState,
  Vector2,
  EventCallback
} from '../types/index.js';

export class Context implements IContext {
  p5: P5Instance;

  // Core subsystems (set during initialization)
  entities: IEntityManager;
  timeline: ITimeline | null = null;
  choreography: IChoreography | null = null;
  audio: IAudioEngine | null = null;
  audioReactor: IAudioReactor | null = null;
  render: IRenderPipeline | null = null;

  // Input state (updated each frame)
  input: InputState;

  // Timing
  time: TimeState;

  // Canvas dimensions
  width: number = 0;
  height: number = 0;

  // Event bus for decoupled communication
  private events: Map<string, Set<EventCallback>> = new Map();

  constructor(p5: P5Instance) {
    this.p5 = p5;
    this.entities = new EntityManager();

    this.input = {
      mouseX: 0,
      mouseY: 0,
      prevMouseX: 0,
      prevMouseY: 0,
      mouseVel: { x: 0, y: 0 },
      mouseSpeed: 0,
      mouseStillTime: 0,
      mousePressed: false,
      keys: new Set()
    };

    this.time = {
      total: 0,
      delta: 0,
      frame: 0
    };
  }

  // ─── INITIALIZATION ───────────────────────────────────────────────────────

  init(p5: P5Instance): void {
    this.width = p5.width;
    this.height = p5.height;
  }

  // ─── PER-FRAME UPDATE ─────────────────────────────────────────────────────

  update(dt: number): void {
    const p5 = this.p5;

    // Update timing
    this.time.delta = dt;
    this.time.total += dt;
    this.time.frame++;

    // Update dimensions (in case of resize)
    this.width = p5.width;
    this.height = p5.height;

    // Update input state
    this._updateInput(dt);
  }

  private _updateInput(_dt: number): void {
    const p5 = this.p5;

    // Store previous position
    this.input.prevMouseX = this.input.mouseX;
    this.input.prevMouseY = this.input.mouseY;

    // Update current position
    this.input.mouseX = p5.mouseX;
    this.input.mouseY = p5.mouseY;

    // Calculate velocity
    this.input.mouseVel.x = this.input.mouseX - this.input.prevMouseX;
    this.input.mouseVel.y = this.input.mouseY - this.input.prevMouseY;

    // Calculate speed
    this.input.mouseSpeed = Math.sqrt(
      this.input.mouseVel.x * this.input.mouseVel.x +
      this.input.mouseVel.y * this.input.mouseVel.y
    );

    // Track stillness
    if (this.input.mouseSpeed < 2) {
      this.input.mouseStillTime += _dt;
    } else {
      this.input.mouseStillTime = 0;
    }

    // Mouse pressed state
    this.input.mousePressed = p5.mouseIsPressed;
  }

  // ─── EVENT BUS ────────────────────────────────────────────────────────────

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, data?: unknown): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }

    // Also notify audio reactor if present
    if (this.audioReactor) {
      this.audioReactor.trigger(event, data as Record<string, unknown>);
    }
  }

  // ─── UTILITY ──────────────────────────────────────────────────────────────

  // Get center of canvas
  get center(): Vector2 {
    return { x: this.width / 2, y: this.height / 2 };
  }

  // Check if point is within canvas bounds
  isInBounds(x: number, y: number, margin = 0): boolean {
    return x >= -margin && x <= this.width + margin &&
           y >= -margin && y <= this.height + margin;
  }

  // Random point within canvas
  randomPoint(margin = 0): Vector2 {
    return {
      x: margin + Math.random() * (this.width - 2 * margin),
      y: margin + Math.random() * (this.height - 2 * margin)
    };
  }

  // Mouse distance from a point
  mouseDistanceFrom(x: number, y: number): number {
    const dx = this.input.mouseX - x;
    const dy = this.input.mouseY - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Angle from point to mouse
  angleToMouse(x: number, y: number): number {
    return Math.atan2(
      this.input.mouseY - y,
      this.input.mouseX - x
    );
  }
}
