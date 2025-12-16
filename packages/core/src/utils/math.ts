// ═══════════════════════════════════════════════════════════════════════════
// MATH UTILITIES - @chaingang/core
// ═══════════════════════════════════════════════════════════════════════════

import type { Vector2 } from '../types/index.js';

let idCounter = 0;

export function generateId(): string {
  return `e_${++idCounter}_${Math.random().toString(36).substr(2, 6)}`;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function magnitude(vec: Vector2): number {
  return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}

export function normalize(vec: Vector2): Vector2 {
  const mag = magnitude(vec);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: vec.x / mag, y: vec.y / mag };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clampResult = false
): number {
  const mapped = ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  if (clampResult) {
    return clamp(mapped, Math.min(outMin, outMax), Math.max(outMin, outMax));
  }
  return mapped;
}

export function random(min = 0, max = 1): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function angle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Get nested property by path (e.g., 'transform.x')
export function getProperty(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

// Set nested property by path
export function setProperty(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] == null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

// Interpolate between values (supports numbers, objects)
export function interpolate(from: unknown, to: unknown, t: number): unknown {
  if (typeof from === 'number' && typeof to === 'number') {
    return lerp(from, to, t);
  }

  if (typeof from === 'object' && typeof to === 'object' && from !== null && to !== null) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(from as Record<string, unknown>)) {
      if (key in (to as Record<string, unknown>)) {
        result[key] = interpolate(
          (from as Record<string, unknown>)[key],
          (to as Record<string, unknown>)[key],
          t
        );
      } else {
        result[key] = (from as Record<string, unknown>)[key];
      }
    }
    return result;
  }

  // For non-interpolatable values, snap at t >= 0.5
  return t < 0.5 ? from : to;
}
