// ═══════════════════════════════════════════════════════════════════════════
// COLOR PALETTE - The Thirteenth Turning
// ═══════════════════════════════════════════════════════════════════════════

export const COLORS = {
  // Void / Background
  void: '#0a0812',
  voidDeep: '#050308',
  indigo: '#1a1030',

  // Boonhonk Pentad
  boon: '#f0d4a8',    // Gold - abundance, warmth
  bane: '#a8c4e8',    // Frost-blue - challenge, cold
  bone: '#f5f0e6',    // Cream - residue, memory
  bonk: '#d4572a',    // Crimson - impact, autumn
  honk: '#00d4ff',    // Cyan - exclamation, awakening

  // Accent Colors
  violet: '#9932cc',
  teal: '#2dd4bf',
  amber: '#d4a86b',
  gold: '#f0d4a8',
  crimson: '#d4572a',
  pink: '#e8b4d4',
  frost: '#a8c4e8',

  // Environment
  clay: '#8b7355',
  woodsmoke: '#4a4035',
  autumn: '#c4652a',
  ember: '#ff6b35'
};

// Pentad symbols
export const PENTAD = {
  boon: { symbol: '!', color: COLORS.boon, name: 'boon' },
  bane: { symbol: '~', color: COLORS.bane, name: 'bane' },
  bone: { symbol: '^', color: COLORS.bone, name: 'bone' },
  bonk: { symbol: '<>', color: COLORS.bonk, name: 'bonk' },
  honk: { symbol: '?', color: COLORS.honk, name: 'honk' }
};

// Convert hex to RGB object
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  }
  return { r: 255, g: 255, b: 255 };
}

// Lerp between two hex colors
export function lerpColor(p5, hex1, hex2, t) {
  const c1 = p5.color(hex1);
  const c2 = p5.color(hex2);
  return p5.lerpColor(c1, c2, t);
}

// Get color with alpha
export function colorWithAlpha(p5, hex, alpha) {
  const rgb = hexToRgb(hex);
  return p5.color(rgb.r, rgb.g, rgb.b, alpha * 255);
}
