// ═══════════════════════════════════════════════════════════════════════════
// TRACK - Animates a property over time using keyframes
// ═══════════════════════════════════════════════════════════════════════════

import { Easing } from './Easing.js';
import { setProperty, interpolate } from '../utils/math.js';
import type { ITrack, IKeyframe, EasingFunction, TrackConfig } from '../types/index.js';

export class Keyframe implements IKeyframe {
  time: number;
  value: unknown;
  easing: EasingFunction;

  constructor(time: number, value: unknown, easing: string | EasingFunction = 'linear') {
    this.time = time;
    this.value = value;
    this.easing = typeof easing === 'string' ? Easing.get(easing) : easing;
  }
}

export class Track implements ITrack {
  name: string;
  target: object | null;
  property: string | null;
  keyframes: IKeyframe[];
  enabled: boolean;
  loop: boolean;
  pingPong: boolean;

  private _sorted: boolean = false;

  constructor(config: TrackConfig = {}) {
    this.name = config.name || 'track';
    this.target = config.target || null;
    this.property = config.property || null;
    this.keyframes = [];
    this.enabled = true;
    this.loop = config.loop || false;
    this.pingPong = config.pingPong || false;
  }

  // ─── Keyframe Management ─────────────────────────────────────────────────

  addKeyframe(time: number, value: unknown, easing: string | EasingFunction = 'linear'): this {
    this.keyframes.push(new Keyframe(time, value, easing));
    this._sorted = false;
    return this;
  }

  at(time: number, value: unknown, easing?: string | EasingFunction): this {
    return this.addKeyframe(time, value, easing);
  }

  removeKeyframe(time: number): this {
    this.keyframes = this.keyframes.filter(k => k.time !== time);
    return this;
  }

  clear(): this {
    this.keyframes = [];
    this._sorted = false;
    return this;
  }

  // ─── Timeline Integration ────────────────────────────────────────────────

  get duration(): number {
    if (this.keyframes.length === 0) return 0;
    this.ensureSorted();
    return this.keyframes[this.keyframes.length - 1].time;
  }

  private ensureSorted(): void {
    if (!this._sorted) {
      this.keyframes.sort((a, b) => a.time - b.time);
      this._sorted = true;
    }
  }

  // ─── Evaluation ──────────────────────────────────────────────────────────

  getValue(time: number): unknown {
    if (this.keyframes.length === 0) return null;
    this.ensureSorted();

    const duration = this.duration;
    if (duration === 0) return this.keyframes[0].value;

    // Handle looping
    if (this.loop && time > duration) {
      if (this.pingPong) {
        const cycles = Math.floor(time / duration);
        time = time % duration;
        if (cycles % 2 === 1) {
          time = duration - time;
        }
      } else {
        time = time % duration;
      }
    }

    // Clamp to keyframe range
    time = Math.max(0, Math.min(duration, time));

    // Find surrounding keyframes
    let prevKey = this.keyframes[0];
    let nextKey = this.keyframes[this.keyframes.length - 1];

    for (let i = 0; i < this.keyframes.length - 1; i++) {
      if (this.keyframes[i].time <= time && this.keyframes[i + 1].time >= time) {
        prevKey = this.keyframes[i];
        nextKey = this.keyframes[i + 1];
        break;
      }
    }

    // Calculate progress
    const keyDuration = nextKey.time - prevKey.time;
    if (keyDuration === 0) return prevKey.value;

    const t = (time - prevKey.time) / keyDuration;
    const easedT = nextKey.easing(t);

    // Interpolate
    return interpolate(prevKey.value, nextKey.value, easedT);
  }

  update(time: number): void {
    if (!this.enabled || !this.target || !this.property) return;

    const value = this.getValue(time);
    if (value !== null) {
      setProperty(this.target as Record<string, unknown>, this.property, value);
    }
  }

  // ─── Chaining ────────────────────────────────────────────────────────────

  setTarget(target: object, property: string): this {
    this.target = target;
    this.property = property;
    return this;
  }
}

// ─── TRACK BUILDER ─────────────────────────────────────────────────────────

export function track(target: object, property: string): Track {
  return new Track({ target, property });
}
