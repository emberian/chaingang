// ═══════════════════════════════════════════════════════════════════════════
// TRACK - Animates a property over time using keyframes
// ═══════════════════════════════════════════════════════════════════════════

import { Easing } from './Easing.js';
import { setProperty, interpolate } from '../utils/math.js';

export class Keyframe {
  constructor(time, value, easing = 'linear') {
    this.time = time;
    this.value = value;
    this.easing = typeof easing === 'string' ? Easing.get(easing) : easing;
  }
}

export class Track {
  constructor(config = {}) {
    this.name = config.name || 'track';
    this.target = config.target || null;        // Target object
    this.property = config.property || null;    // Property path (e.g., 'transform.x')
    this.keyframes = [];
    this.enabled = true;
    this.loop = config.loop || false;
    this.pingPong = config.pingPong || false;

    // Cache for sorted keyframes
    this._sorted = false;
  }

  // ─── Keyframe Management ─────────────────────────────────────────────────

  addKeyframe(time, value, easing = 'linear') {
    this.keyframes.push(new Keyframe(time, value, easing));
    this._sorted = false;
    return this;
  }

  at(time, value, easing) {
    return this.addKeyframe(time, value, easing);
  }

  removeKeyframe(time) {
    this.keyframes = this.keyframes.filter(k => k.time !== time);
    return this;
  }

  clear() {
    this.keyframes = [];
    this._sorted = false;
    return this;
  }

  // ─── Timeline Integration ────────────────────────────────────────────────

  get duration() {
    if (this.keyframes.length === 0) return 0;
    this.ensureSorted();
    return this.keyframes[this.keyframes.length - 1].time;
  }

  ensureSorted() {
    if (!this._sorted) {
      this.keyframes.sort((a, b) => a.time - b.time);
      this._sorted = true;
    }
  }

  // ─── Evaluation ──────────────────────────────────────────────────────────

  getValue(time) {
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

  update(time) {
    if (!this.enabled || !this.target || !this.property) return;

    const value = this.getValue(time);
    if (value !== null) {
      setProperty(this.target, this.property, value);
    }
  }

  // ─── Chaining ────────────────────────────────────────────────────────────

  setTarget(target, property) {
    this.target = target;
    this.property = property;
    return this;
  }
}

// ─── TRACK BUILDER ─────────────────────────────────────────────────────────

export function track(target, property) {
  return new Track({ target, property });
}
