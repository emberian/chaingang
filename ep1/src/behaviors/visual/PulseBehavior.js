// ═══════════════════════════════════════════════════════════════════════════
// PULSE BEHAVIOR - Oscillating visual properties
// ═══════════════════════════════════════════════════════════════════════════

import { Behavior } from '../Behavior.js';

export class PulseBehavior extends Behavior {
  constructor(config = {}) {
    super(config);
    this.frequency = config.frequency || 2;      // Pulses per second
    this.property = config.property || 'size';   // 'size', 'alpha', 'scale', 'custom'
    this.min = config.min || 0.8;                // Minimum multiplier
    this.max = config.max || 1.2;                // Maximum multiplier
    this.offset = config.offset || Math.random() * Math.PI * 2; // Phase offset
    this.waveform = config.waveform || 'sine';   // 'sine', 'square', 'triangle'
  }

  onUpdate(entity, ctx, dt) {
    // Calculate wave value
    const phase = ctx.time.total * this.frequency * Math.PI * 2 + this.offset;
    let wave;

    switch (this.waveform) {
      case 'square':
        wave = Math.sin(phase) > 0 ? 1 : 0;
        break;
      case 'triangle':
        wave = Math.abs(((phase / Math.PI) % 2) - 1);
        break;
      case 'sine':
      default:
        wave = (Math.sin(phase) + 1) / 2; // Normalize to 0-1
    }

    // Map to min-max range
    const value = this.min + wave * (this.max - this.min);

    // Apply to property
    switch (this.property) {
      case 'size': {
        const visual = entity.getComponent('visual');
        if (visual && visual._baseSize === undefined) {
          visual._baseSize = visual.size;
        }
        if (visual && visual._baseSize) {
          visual.size = visual._baseSize * value;
        }
        break;
      }
      case 'alpha':
        entity.transform.alpha = value;
        break;
      case 'scale':
        entity.transform.scaleX = value;
        entity.transform.scaleY = value;
        break;
      case 'rotation':
        entity.transform.rotation = value * Math.PI * 2;
        break;
    }
  }

  onAttach(entity) {
    // Store base values
    const visual = entity.getComponent('visual');
    if (visual && this.property === 'size') {
      visual._baseSize = visual.size;
    }
  }
}
