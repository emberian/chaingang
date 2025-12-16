// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE - Central timeline for coordinating animations
// ═══════════════════════════════════════════════════════════════════════════

import { Track, track } from './Track.js';
import type {
  ITimeline,
  ITrack,
  ICue,
  IContext,
  CueCallback,
  CueConfig,
  TrackConfig
} from '../types/index.js';

export class Cue implements ICue {
  time: number;
  callback: CueCallback;
  name: string;
  once: boolean;
  fired: boolean;
  enabled: boolean;

  constructor(time: number, callback: CueCallback, config: CueConfig = {}) {
    this.time = time;
    this.callback = callback;
    this.name = config.name || '';
    this.once = config.once !== false;
    this.fired = false;
    this.enabled = true;
  }

  reset(): void {
    this.fired = false;
  }
}

interface ReactiveBinding {
  condition: (ctx: IContext) => boolean;
  effect: (timeline: ITimeline, ctx: IContext) => void;
  active: boolean;
}

export interface TimelineConfig {
  duration?: number;
  loop?: boolean;
  onComplete?: (() => void) | null;
  onLoop?: (() => void) | null;
}

export class Timeline implements ITimeline {
  time: number = 0;
  duration: number;
  playbackRate: number = 1;
  playing: boolean = false;
  loop: boolean;

  tracks: Map<string, ITrack> = new Map();
  cues: ICue[] = [];
  reactiveBindings: ReactiveBinding[] = [];

  // Event callbacks
  onComplete: (() => void) | null;
  onLoop: (() => void) | null;

  constructor(config: TimelineConfig = {}) {
    this.duration = config.duration || Infinity;
    this.loop = config.loop || false;
    this.onComplete = config.onComplete || null;
    this.onLoop = config.onLoop || null;
  }

  // ─── Track Management ────────────────────────────────────────────────────

  addTrack(name: string, trackOrConfig: ITrack | TrackConfig): ITrack {
    const t = trackOrConfig instanceof Track
      ? trackOrConfig
      : new Track({ name, ...trackOrConfig });
    t.name = name;
    this.tracks.set(name, t);
    return t;
  }

  getTrack(name: string): ITrack | undefined {
    return this.tracks.get(name);
  }

  removeTrack(name: string): void {
    this.tracks.delete(name);
  }

  // Convenience method to create and add a track
  animate(target: object, property: string): ITrack {
    const targetId = (target as { id?: string })?.id || 'obj';
    const name = `${targetId}_${property}`;
    const t = track(target, property);
    this.addTrack(name, t);
    return t;
  }

  // ─── Cue Management ──────────────────────────────────────────────────────

  addCue(time: number, callback: CueCallback, config: CueConfig = {}): ICue {
    const cue = new Cue(time, callback, config);
    this.cues.push(cue);
    this.cues.sort((a, b) => a.time - b.time);
    return cue;
  }

  at(time: number, callback: CueCallback, config: CueConfig = {}): ICue {
    return this.addCue(time, callback, config);
  }

  removeCue(cue: ICue): void {
    const index = this.cues.indexOf(cue);
    if (index !== -1) {
      this.cues.splice(index, 1);
    }
  }

  getCue(name: string): ICue | undefined {
    return this.cues.find(c => c.name === name);
  }

  // ─── Reactive Bindings ───────────────────────────────────────────────────

  addReactiveBinding(binding: Omit<ReactiveBinding, 'active'>): this {
    this.reactiveBindings.push({
      condition: binding.condition,
      effect: binding.effect,
      active: false
    });
    return this;
  }

  // ─── Playback Control ────────────────────────────────────────────────────

  play(): this {
    this.playing = true;
    return this;
  }

  pause(): this {
    this.playing = false;
    return this;
  }

  stop(): this {
    this.playing = false;
    this.seek(0);
    return this;
  }

  toggle(): this {
    this.playing = !this.playing;
    return this;
  }

  seek(time: number): this {
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
    for (const trk of this.tracks.values()) {
      trk.update(this.time);
    }

    return this;
  }

  setPlaybackRate(rate: number): this {
    this.playbackRate = rate;
    return this;
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(dt: number, ctx: IContext | null = null): void {
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
    for (const trk of this.tracks.values()) {
      trk.update(this.time);
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

  get progress(): number {
    return this.duration === Infinity ? 0 : this.time / this.duration;
  }

  get isComplete(): boolean {
    return this.time >= this.duration && !this.loop;
  }

  reset(): this {
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
