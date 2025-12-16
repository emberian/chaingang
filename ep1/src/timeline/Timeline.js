// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE - Central timeline for coordinating animations
// ═══════════════════════════════════════════════════════════════════════════

import { Track, track } from './Track.js';

export class Cue {
  constructor(time, callback, config = {}) {
    this.time = time;
    this.callback = callback;
    this.name = config.name || '';
    this.once = config.once !== false;
    this.fired = false;
    this.enabled = true;
  }

  reset() {
    this.fired = false;
  }
}

export class Timeline {
  constructor(config = {}) {
    this.time = 0;
    this.duration = config.duration || Infinity;
    this.playbackRate = 1;
    this.playing = false;
    this.loop = config.loop || false;

    this.tracks = new Map();
    this.cues = [];
    this.reactiveBindings = [];

    // Event callbacks
    this.onComplete = config.onComplete || null;
    this.onLoop = config.onLoop || null;
  }

  // ─── Track Management ────────────────────────────────────────────────────

  addTrack(name, trackOrConfig) {
    const t = trackOrConfig instanceof Track
      ? trackOrConfig
      : new Track({ name, ...trackOrConfig });
    t.name = name;
    this.tracks.set(name, t);
    return t;
  }

  getTrack(name) {
    return this.tracks.get(name);
  }

  removeTrack(name) {
    this.tracks.delete(name);
  }

  // Convenience method to create and add a track
  animate(target, property) {
    const name = `${target?.id || 'obj'}_${property}`;
    const t = track(target, property);
    this.addTrack(name, t);
    return t;
  }

  // ─── Cue Management ──────────────────────────────────────────────────────

  addCue(time, callback, config = {}) {
    const cue = new Cue(time, callback, config);
    this.cues.push(cue);
    this.cues.sort((a, b) => a.time - b.time);
    return cue;
  }

  at(time, callback, config = {}) {
    return this.addCue(time, callback, config);
  }

  removeCue(cue) {
    const index = this.cues.indexOf(cue);
    if (index !== -1) {
      this.cues.splice(index, 1);
    }
  }

  getCue(name) {
    return this.cues.find(c => c.name === name);
  }

  // ─── Reactive Bindings ───────────────────────────────────────────────────

  addReactiveBinding(binding) {
    this.reactiveBindings.push({
      condition: binding.condition,
      effect: binding.effect,
      active: false
    });
    return this;
  }

  // ─── Playback Control ────────────────────────────────────────────────────

  play() {
    this.playing = true;
    return this;
  }

  pause() {
    this.playing = false;
    return this;
  }

  stop() {
    this.playing = false;
    this.seek(0);
    return this;
  }

  toggle() {
    this.playing = !this.playing;
    return this;
  }

  seek(time) {
    const previousTime = this.time;
    this.time = Math.max(0, Math.min(this.duration, time));

    // Reset cues if seeking backwards
    if (time < previousTime) {
      for (const cue of this.cues) {
        if (cue.time > time) {
          cue.fired = false;
        }
      }
    }

    // Update all tracks at new time
    for (const track of this.tracks.values()) {
      track.update(this.time);
    }

    return this;
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;
    return this;
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(dt, ctx = null) {
    if (!this.playing) return;

    const previousTime = this.time;
    this.time += dt * this.playbackRate;

    // Check reactive bindings
    if (ctx) {
      for (const binding of this.reactiveBindings) {
        const shouldActivate = binding.condition(ctx);
        if (shouldActivate && !binding.active) {
          binding.effect(this, ctx);
          binding.active = true;
        } else if (!shouldActivate && binding.active) {
          binding.active = false;
        }
      }
    }

    // Check for completion
    if (this.time >= this.duration) {
      if (this.loop) {
        this.time = this.time % this.duration;
        // Reset cues for next loop
        for (const cue of this.cues) {
          cue.fired = false;
        }
        this.onLoop?.();
      } else {
        this.time = this.duration;
        this.playing = false;
        this.onComplete?.();
      }
    }

    // Update tracks
    for (const track of this.tracks.values()) {
      track.update(this.time);
    }

    // Fire cues
    for (const cue of this.cues) {
      if (!cue.enabled) continue;
      if (cue.fired && cue.once) continue;

      if (cue.time >= previousTime && cue.time <= this.time) {
        cue.callback(ctx, this);
        cue.fired = true;
      }
    }
  }

  // ─── State ───────────────────────────────────────────────────────────────

  get progress() {
    return this.duration === Infinity ? 0 : this.time / this.duration;
  }

  get isComplete() {
    return this.time >= this.duration && !this.loop;
  }

  reset() {
    this.time = 0;
    this.playing = false;
    for (const cue of this.cues) {
      cue.fired = false;
    }
    for (const binding of this.reactiveBindings) {
      binding.active = false;
    }
    return this;
  }
}
