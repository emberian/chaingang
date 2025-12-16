// ═══════════════════════════════════════════════════════════════════════════
// MATH UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

let idCounter = 0;

export function generateId() {
  return `e_${++idCounter}_${Math.random().toString(36).substr(2, 6)}`;
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function magnitude(vec) {
  return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}

export function normalize(vec) {
  const mag = magnitude(vec);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: vec.x / mag, y: vec.y / mag };
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function map(value, inMin, inMax, outMin, outMax, clampResult = false) {
  const mapped = ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  if (clampResult) {
    return clamp(mapped, Math.min(outMin, outMax), Math.max(outMin, outMax));
  }
  return mapped;
}

export function random(min = 0, max = 1) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Get/set nested property by path (e.g., 'transform.x')
export function getProperty(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

export function setProperty(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] == null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

// Interpolate between values (supports numbers, objects, colors)
export function interpolate(from, to, t) {
  if (typeof from === 'number' && typeof to === 'number') {
    return lerp(from, to, t);
  }

  if (typeof from === 'object' && typeof to === 'object') {
    const result = {};
    for (const key of Object.keys(from)) {
      if (key in to) {
        result[key] = interpolate(from[key], to[key], t);
      } else {
        result[key] = from[key];
      }
    }
    return result;
  }

  // For non-interpolatable values, snap at t >= 0.5
  return t < 0.5 ? from : to;
}
