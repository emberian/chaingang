// ═══════════════════════════════════════════════════════════════════════════
// FADE BEHAVIOR - Smooth alpha transitions
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior, TimedBehavior } from '../Behavior.js';

export class FadeBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.targetAlpha = config.targetAlpha || 0;   // Target alpha value
    this.speed = config.speed || 1;               // Units per second
    this.easing = config.easing || 'linear';      // Easing function
  }

  onUpdate(entity, ctx, dt) {
    const current = entity.transform.alpha;
    const target = this.targetAlpha;
    const diff = target - current;

    if (Math.abs(diff) < 0.01) {
      entity.transform.alpha = target;
      return;
    }

    // Apply easing
    let step = this.speed * dt;
    if (this.easing === 'ease-out') {
      step *= Math.abs(diff);
    }

    // Move toward target
    if (diff > 0) {
      entity.transform.alpha = Math.min(target, current + step);
    } else {
      entity.transform.alpha = Math.max(target, current - step);
    }
  }

  // Static factory methods
  static fadeIn(duration = 1) {
    return new FadeInBehavior({ duration });
  }

  static fadeOut(duration = 1) {
    return new FadeOutBehavior({ duration });
  }
}

// ─── FADE IN BEHAVIOR ─────────────────────────────────────────────────────
export class FadeInBehavior extends TimedBehavior {
  constructor(config = {}) {
    super(config);
    this.targetAlpha = config.targetAlpha || 1;
  }

  onAttach(entity) {
    entity.transform.alpha = 0;
  }

  onUpdate(entity, ctx, dt) {
    super.onUpdate(entity, ctx, dt);
    entity.transform.alpha = this.progress * this.targetAlpha;
  }
}

// ─── FADE OUT BEHAVIOR ────────────────────────────────────────────────────
export class FadeOutBehavior extends TimedBehavior {
  constructor(config = {}) {
    super(config);
    this.disposeOnComplete = config.disposeOnComplete !== false;
    this._startAlpha = 1;
  }

  onAttach(entity) {
    this._startAlpha = entity.transform.alpha;
  }

  onUpdate(entity, ctx, dt) {
    super.onUpdate(entity, ctx, dt);
    entity.transform.alpha = this._startAlpha * (1 - this.progress);

    if (this.progress >= 1 && this.disposeOnComplete) {
      entity.dispose();
    }
  }
}
