// ═══════════════════════════════════════════════════════════════════════════
// EASING - Comprehensive easing function library
// ═══════════════════════════════════════════════════════════════════════════

// All functions take t in [0,1] and return value in [0,1]

export const Easing = {
  // ─── Linear ──────────────────────────────────────────────────────────────
  linear: (t) => t,

  // ─── Quadratic ───────────────────────────────────────────────────────────
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // ─── Cubic ───────────────────────────────────────────────────────────────
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // ─── Quartic ─────────────────────────────────────────────────────────────
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // ─── Quintic ─────────────────────────────────────────────────────────────
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

  // ─── Sine ────────────────────────────────────────────────────────────────
  easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: (t) => Math.sin(t * Math.PI / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // ─── Exponential ─────────────────────────────────────────────────────────
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t) => {
    if (t === 0 || t === 1) return t;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // ─── Circular ────────────────────────────────────────────────────────────
  easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t) => Math.sqrt(1 - (--t) * t),
  easeInOutCirc: (t) => t < 0.5
    ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // ─── Back ────────────────────────────────────────────────────────────────
  easeInBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // ─── Elastic ─────────────────────────────────────────────────────────────
  easeInElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1
      : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // ─── Bounce ──────────────────────────────────────────────────────────────
  easeInBounce: (t) => 1 - Easing.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t) => t < 0.5
    ? (1 - Easing.easeOutBounce(1 - 2 * t)) / 2
    : (1 + Easing.easeOutBounce(2 * t - 1)) / 2,

  // ─── Custom ──────────────────────────────────────────────────────────────

  // Smooth step (Hermite interpolation)
  smoothStep: (t) => t * t * (3 - 2 * t),

  // Smoother step
  smootherStep: (t) => t * t * t * (t * (t * 6 - 15) + 10),

  // Create bezier easing
  bezier: (x1, y1, x2, y2) => {
    // Attempt to find t for given x using Newton-Raphson
    const epsilon = 1e-6;
    const cubicBezier = (t, p1, p2) => {
      const u = 1 - t;
      return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
    };

    return (x) => {
      if (x === 0 || x === 1) return x;

      let t = x;
      for (let i = 0; i < 8; i++) {
        const currentX = cubicBezier(t, x1, x2) - x;
        if (Math.abs(currentX) < epsilon) break;

        const derivative = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
        if (Math.abs(derivative) < epsilon) break;

        t -= currentX / derivative;
      }

      return cubicBezier(t, y1, y2);
    };
  },

  // Get easing function by name
  get(name) {
    return this[name] || this.linear;
  }
};

// Common aliases
Easing.ease = Easing.easeInOutCubic;
Easing.easeIn = Easing.easeInQuad;
Easing.easeOut = Easing.easeOutQuad;
Easing.easeInOut = Easing.easeInOutQuad;
