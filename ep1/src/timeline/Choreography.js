// ═══════════════════════════════════════════════════════════════════════════
// CHOREOGRAPHY - Manages segment transitions and scene flow
// ═══════════════════════════════════════════════════════════════════════════

import { Timeline } from './Timeline.js';
import { TransitionRenderer } from './TransitionRenderer.js';

export class Segment {
  constructor(config) {
    this.name = config.name;
    this.duration = config.duration || Infinity;
    this.flexible = config.flexible || false;  // Can extend based on interaction
    this.minDuration = config.minDuration || 0;
    this.maxDuration = config.maxDuration || Infinity;

    // Lifecycle callbacks
    this.onSetup = config.setup || (() => {});
    this.onUpdate = config.update || (() => {});
    this.onRender = config.render || null;  // Optional segment rendering
    this.onTeardown = config.teardown || (() => {});
    this.canExit = config.canExit || (() => true);

    // Internal timeline for segment
    this.timeline = new Timeline({ duration: this.duration });

    // State
    this.active = false;
    this.elapsed = 0;
    this.extendedTime = 0;  // Extra time beyond base duration
    this.state = {};  // Custom segment state
  }

  setup(ctx) {
    this.active = true;
    this.elapsed = 0;
    this.extendedTime = 0;
    this.timeline.reset().play();
    this.onSetup(ctx, this);
  }

  update(ctx, dt) {
    if (!this.active) return;

    this.elapsed += dt;
    this.timeline.update(dt, ctx);
    this.onUpdate(ctx, this, dt);
  }

  render(ctx) {
    if (!this.active || !this.onRender) return;
    this.onRender(ctx, this);
  }

  getProgress() {
    if (this.duration === Infinity) return 0;
    const totalDuration = this.duration + this.extendedTime;
    return Math.min(1, this.elapsed / totalDuration);
  }

  teardown(ctx) {
    this.active = false;
    this.timeline.stop();
    this.onTeardown(ctx, this);
  }

  get progress() {
    // Use getProgress() to ensure consistency (accounts for extendedTime)
    return this.getProgress();
  }

  get isComplete() {
    if (this.duration === Infinity) return false;
    return this.elapsed >= this.duration + this.extendedTime;
  }

  extend(time) {
    if (this.flexible) {
      this.extendedTime += time;
      this.extendedTime = Math.min(
        this.extendedTime,
        this.maxDuration - this.duration
      );
    }
  }
}

export class Choreography {
  constructor(ctx, config = {}) {
    this.ctx = ctx;
    this.segments = new Map();
    this.sequence = [];
    this.currentIndex = -1;
    this.currentSegment = null;

    this.playing = false;
    this.autoAdvance = config.autoAdvance !== false;

    // Callbacks
    this.onSegmentStart = config.onSegmentStart || null;
    this.onSegmentEnd = config.onSegmentEnd || null;
    this.onComplete = config.onComplete || null;

    // Transition state
    this.transitioning = false;
    this.transitionProgress = 0;
    this.transitionDuration = config.transitionDuration || 1;
    this.transitionTarget = 0;
    this.transitionRenderer = new TransitionRenderer();
  }

  // ─── Segment Management ──────────────────────────────────────────────────

  addSegment(config) {
    const segment = config instanceof Segment ? config : new Segment(config);
    this.segments.set(segment.name, segment);
    return segment;
  }

  getSegment(name) {
    return this.segments.get(name);
  }

  setSequence(names) {
    this.sequence = names.filter(name => this.segments.has(name));
    return this;
  }

  // ─── Playback Control ────────────────────────────────────────────────────

  start() {
    if (this.sequence.length === 0) {
      console.warn('Choreography: No segments in sequence');
      return this;
    }
    this.playing = true;
    this.goTo(0);
    return this;
  }

  stop() {
    this.playing = false;
    if (this.currentSegment) {
      this.currentSegment.teardown(this.ctx);
      this.currentSegment = null;
    }
    this.currentIndex = -1;
    return this;
  }

  pause() {
    this.playing = false;
    return this;
  }

  resume() {
    this.playing = true;
    return this;
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  goTo(indexOrName) {
    let index;
    if (typeof indexOrName === 'number') {
      index = indexOrName;
    } else {
      index = this.sequence.indexOf(indexOrName);
      if (index === -1) {
        console.warn(`Choreography: Segment "${indexOrName}" not in sequence`);
        return this;
      }
    }

    if (index < 0 || index >= this.sequence.length) {
      console.warn(`Choreography: Invalid segment index ${index}`);
      return this;
    }

    // Teardown current segment
    if (this.currentSegment) {
      this.currentSegment.teardown(this.ctx);
      this.onSegmentEnd?.(this.currentSegment, this.ctx);
    }

    // Setup new segment
    this.currentIndex = index;
    const name = this.sequence[index];
    this.currentSegment = this.segments.get(name);
    this.currentSegment.setup(this.ctx);
    this.onSegmentStart?.(this.currentSegment, this.ctx);

    return this;
  }

  next() {
    if (this.currentIndex < this.sequence.length - 1) {
      this.startTransition(this.currentIndex + 1);
    } else {
      // End of sequence
      this.playing = false;
      if (this.currentSegment) {
        this.currentSegment.teardown(this.ctx);
        this.onSegmentEnd?.(this.currentSegment, this.ctx);
      }
      this.onComplete?.();
    }
    return this;
  }

  previous() {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    }
    return this;
  }

  // ─── Transitions ─────────────────────────────────────────────────────────

  startTransition(targetIndex) {
    if (!this.currentSegment?.canExit(this.ctx)) {
      return;  // Can't exit current segment yet
    }

    this.transitioning = true;
    this.transitionProgress = 0;
    this.transitionTarget = targetIndex;
    this.transitionRenderer.setTransition(this.currentIndex, targetIndex);
  }

  updateTransition(dt) {
    if (!this.transitioning) return;

    this.transitionProgress += dt / this.transitionDuration;

    if (this.transitionProgress >= 1) {
      this.transitioning = false;
      this.transitionProgress = 0;
      this.goTo(this.transitionTarget);
    }
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(ctx, dt) {
    if (!this.playing) return;

    // Update current segment (even during transitions for visual continuity)
    if (this.currentSegment) {
      this.currentSegment.update(ctx, dt);
    }

    // Handle transitions
    if (this.transitioning) {
      this.updateTransition(dt);
      return;
    }

    // Check for auto-advance (only when not transitioning)
    if (this.currentSegment && this.autoAdvance && this.currentSegment.isComplete) {
      this.next();
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  render(ctx) {
    // Render current segment
    if (this.currentSegment) {
      this.currentSegment.render(ctx);
    }

    // Render transition overlay
    if (this.transitioning) {
      this.transitionRenderer.render(ctx, this.transitionProgress);
    }
  }

  // ─── State ───────────────────────────────────────────────────────────────

  get currentName() {
    return this.sequence[this.currentIndex] || null;
  }

  get progress() {
    if (this.sequence.length === 0) return 0;
    return (this.currentIndex + (this.currentSegment?.getProgress?.() || this.currentSegment?.progress || 0)) / this.sequence.length;
  }

  get isComplete() {
    return this.currentIndex >= this.sequence.length - 1 &&
           this.currentSegment?.isComplete;
  }
}
