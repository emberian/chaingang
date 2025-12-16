// ═══════════════════════════════════════════════════════════════════════════
// SEGMENT - Individual segment within a choreography
// ═══════════════════════════════════════════════════════════════════════════

import { Timeline } from './Timeline.js';
import type {
  ISegment,
  ITimeline,
  IContext,
  SegmentConfig
} from '../types/index.js';

export class Segment<TState = Record<string, unknown>> implements ISegment<TState> {
  name: string;
  duration: number;
  flexible: boolean;
  minDuration: number;
  maxDuration: number;

  // Lifecycle callbacks
  private onSetup: (ctx: IContext, segment: ISegment<TState>) => void;
  private onUpdateCb: (ctx: IContext, segment: ISegment<TState>, dt: number) => void;
  private onRenderCb: ((ctx: IContext, segment: ISegment<TState>) => void) | null;
  private onTeardownCb: (ctx: IContext, segment: ISegment<TState>) => void;
  private canExitCb: (ctx: IContext) => boolean;

  // Internal timeline for segment
  timeline: ITimeline;

  // State
  active: boolean = false;
  elapsed: number = 0;
  extendedTime: number = 0;
  state: TState;

  constructor(config: SegmentConfig<TState>) {
    this.name = config.name;
    this.duration = config.duration || Infinity;
    this.flexible = config.flexible || false;
    this.minDuration = config.minDuration || 0;
    this.maxDuration = config.maxDuration || Infinity;

    // Lifecycle callbacks
    this.onSetup = config.setup || (() => {});
    this.onUpdateCb = config.update || (() => {});
    this.onRenderCb = config.render || null;
    this.onTeardownCb = config.teardown || (() => {});
    this.canExitCb = config.canExit || (() => true);

    // Internal timeline for segment
    this.timeline = new Timeline({ duration: this.duration });

    // State
    this.state = {} as TState;
  }

  setup(ctx: IContext): void {
    this.active = true;
    this.elapsed = 0;
    this.extendedTime = 0;
    this.timeline.reset().play();
    this.onSetup(ctx, this);
  }

  update(ctx: IContext, dt: number): void {
    if (!this.active) return;

    this.elapsed += dt;
    this.timeline.update(dt, ctx);
    this.onUpdateCb(ctx, this, dt);
  }

  render(ctx: IContext): void {
    if (!this.active || !this.onRenderCb) return;
    this.onRenderCb(ctx, this);
  }

  getProgress(): number {
    if (this.duration === Infinity) return 0;
    const totalDuration = this.duration + this.extendedTime;
    return Math.min(1, this.elapsed / totalDuration);
  }

  teardown(ctx: IContext): void {
    this.active = false;
    this.timeline.stop();
    this.onTeardownCb(ctx, this);
  }

  canExit(ctx: IContext): boolean {
    return this.canExitCb(ctx);
  }

  get progress(): number {
    if (this.duration === Infinity) return 0;
    return Math.min(1, this.elapsed / this.duration);
  }

  get isComplete(): boolean {
    if (this.duration === Infinity) return false;
    return this.elapsed >= this.duration + this.extendedTime;
  }

  extend(time: number): void {
    if (this.flexible) {
      this.extendedTime += time;
      this.extendedTime = Math.min(
        this.extendedTime,
        this.maxDuration - this.duration
      );
    }
  }
}
