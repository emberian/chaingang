// ═══════════════════════════════════════════════════════════════════════════
// CHOREOGRAPHY - Manages segment transitions and scene flow
// ═══════════════════════════════════════════════════════════════════════════

import { Segment } from './Segment.js';
import type {
  IChoreography,
  ISegment,
  IContext,
  SegmentConfig
} from '../types/index.js';

export interface ChoreographyConfig {
  autoAdvance?: boolean;
  transitionDuration?: number;
  onSegmentStart?: ((segment: ISegment, ctx: IContext) => void) | null;
  onSegmentEnd?: ((segment: ISegment, ctx: IContext) => void) | null;
  onComplete?: (() => void) | null;
}

// Base transition renderer interface - implementations can be episode-specific
export interface ITransitionRenderer {
  setTransition(fromIndex: number, toIndex: number): void;
  render(ctx: IContext, progress: number): void;
}

// Default no-op transition renderer
class DefaultTransitionRenderer implements ITransitionRenderer {
  setTransition(_fromIndex: number, _toIndex: number): void {}
  render(_ctx: IContext, _progress: number): void {}
}

export class Choreography implements IChoreography {
  segments: Map<string, ISegment> = new Map();
  sequence: string[] = [];
  currentIndex: number = -1;
  currentSegment: ISegment | null = null;

  playing: boolean = false;
  autoAdvance: boolean;

  // Callbacks
  private onSegmentStartCb: ((segment: ISegment, ctx: IContext) => void) | null;
  private onSegmentEndCb: ((segment: ISegment, ctx: IContext) => void) | null;
  private onCompleteCb: (() => void) | null;

  // Transition state
  transitioning: boolean = false;
  transitionProgress: number = 0;
  transitionDuration: number;
  private transitionTarget: number = 0;
  transitionRenderer: ITransitionRenderer;

  constructor(config: ChoreographyConfig = {}) {
    this.autoAdvance = config.autoAdvance !== false;
    this.transitionDuration = config.transitionDuration || 1;

    this.onSegmentStartCb = config.onSegmentStart || null;
    this.onSegmentEndCb = config.onSegmentEnd || null;
    this.onCompleteCb = config.onComplete || null;

    this.transitionRenderer = new DefaultTransitionRenderer();
  }

  // Allow setting a custom transition renderer
  setTransitionRenderer(renderer: ITransitionRenderer): this {
    this.transitionRenderer = renderer;
    return this;
  }

  // ─── Segment Management ──────────────────────────────────────────────────

  addSegment(config: SegmentConfig | ISegment): ISegment {
    const segment = 'timeline' in config ? config : new Segment(config);
    this.segments.set(segment.name, segment);
    return segment;
  }

  getSegment(name: string): ISegment | undefined {
    return this.segments.get(name);
  }

  setSequence(names: string[]): this {
    this.sequence = names.filter(name => this.segments.has(name));
    return this;
  }

  // ─── Playback Control ────────────────────────────────────────────────────

  start(): this {
    if (this.sequence.length === 0) {
      console.warn('Choreography: No segments in sequence');
      return this;
    }
    this.playing = true;
    this.goTo(0);
    return this;
  }

  stop(): this {
    this.playing = false;
    if (this.currentSegment) {
      // Need context for teardown - use empty context placeholder
      this.currentSegment = null;
    }
    this.currentIndex = -1;
    return this;
  }

  pause(): this {
    this.playing = false;
    return this;
  }

  resume(): this {
    this.playing = true;
    return this;
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  goTo(indexOrName: number | string): this {
    let index: number;
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

    // Setup new segment
    this.currentIndex = index;
    const name = this.sequence[index];
    this.currentSegment = this.segments.get(name) || null;

    return this;
  }

  // Internal method that needs context
  _goToWithContext(indexOrName: number | string, ctx: IContext): this {
    let index: number;
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
      this.currentSegment.teardown(ctx);
      this.onSegmentEndCb?.(this.currentSegment, ctx);
    }

    // Setup new segment
    this.currentIndex = index;
    const name = this.sequence[index];
    this.currentSegment = this.segments.get(name) || null;
    if (this.currentSegment) {
      this.currentSegment.setup(ctx);
      this.onSegmentStartCb?.(this.currentSegment, ctx);
    }

    return this;
  }

  next(): this {
    if (this.currentIndex < this.sequence.length - 1) {
      this.startTransition(this.currentIndex + 1);
    } else {
      // End of sequence
      this.playing = false;
      this.onCompleteCb?.();
    }
    return this;
  }

  previous(): this {
    if (this.currentIndex > 0) {
      this.startTransition(this.currentIndex - 1);
    }
    return this;
  }

  // ─── Transitions ─────────────────────────────────────────────────────────

  private startTransition(targetIndex: number): void {
    this.transitioning = true;
    this.transitionProgress = 0;
    this.transitionTarget = targetIndex;
    this.transitionRenderer.setTransition(this.currentIndex, targetIndex);
  }

  private updateTransition(ctx: IContext, dt: number): void {
    if (!this.transitioning) return;

    this.transitionProgress += dt / this.transitionDuration;

    if (this.transitionProgress >= 1) {
      this.transitioning = false;
      this.transitionProgress = 0;
      this._goToWithContext(this.transitionTarget, ctx);
    }
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(ctx: IContext, dt: number): void {
    if (!this.playing) return;

    // Handle transitions
    if (this.transitioning) {
      this.updateTransition(ctx, dt);
      return;
    }

    // Update current segment
    if (this.currentSegment) {
      this.currentSegment.update(ctx, dt);

      // Check for auto-advance
      if (this.autoAdvance && this.currentSegment.isComplete) {
        this.next();
      }
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  render(ctx: IContext): void {
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

  get currentName(): string | null {
    return this.sequence[this.currentIndex] || null;
  }

  get progress(): number {
    if (this.sequence.length === 0) return 0;
    const segmentProgress = this.currentSegment?.getProgress?.() || this.currentSegment?.progress || 0;
    return (this.currentIndex + segmentProgress) / this.sequence.length;
  }

  get isComplete(): boolean {
    return this.currentIndex >= this.sequence.length - 1 &&
           (this.currentSegment?.isComplete ?? false);
  }
}
