// ═══════════════════════════════════════════════════════════════════════════
// SEGMENTS - Export all experience segments
// ═══════════════════════════════════════════════════════════════════════════

export { voidSegment } from './void.js';
export { ignitionSegment } from './ignition.js';
export { polvoSegment } from './polvo.js';
export { gnomesSegment } from './gnomes.js';
export { titanSegment } from './titan.js';
export { endingSegment } from './ending.js';

// Default segment sequence
export const defaultSequence = [
  'void',
  'ignition',
  'polvo',
  'gnomes',
  'titan',
  'ending'
];
