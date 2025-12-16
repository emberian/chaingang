// ═══════════════════════════════════════════════════════════════════════════
// AUDIO REACTOR - Maps visual events to audio responses
// ═══════════════════════════════════════════════════════════════════════════

export class AudioReactor {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.mappings = new Map();
    this.continuousMappings = [];
    this.enabled = true;
  }

  // ─── Event Mappings ──────────────────────────────────────────────────────

  // Map a discrete event to an audio response
  map(eventName, callback) {
    if (!this.mappings.has(eventName)) {
      this.mappings.set(eventName, []);
    }
    this.mappings.get(eventName).push(callback);
    return this;
  }

  // Map continuous context values to audio parameters
  mapContinuous(config) {
    this.continuousMappings.push({
      source: config.source,    // Function that returns value from context
      target: config.target,    // Function to apply to audio
      min: config.min || 0,
      max: config.max || 1,
      smoothing: config.smoothing || 0.1,
      currentValue: 0
    });
    return this;
  }

  // Trigger an event
  trigger(eventName, data = {}) {
    if (!this.enabled) return;

    const handlers = this.mappings.get(eventName);
    if (handlers) {
      for (const handler of handlers) {
        handler(data, this.audioEngine);
      }
    }
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(ctx, dt) {
    if (!this.enabled) return;

    // Process continuous mappings
    for (const mapping of this.continuousMappings) {
      const rawValue = mapping.source(ctx);
      const normalizedValue = Math.max(mapping.min, Math.min(mapping.max, rawValue));

      // Smooth the value
      mapping.currentValue += (normalizedValue - mapping.currentValue) * mapping.smoothing;

      // Apply to target
      mapping.target(mapping.currentValue, this.audioEngine, ctx);
    }
  }

  // ─── Preset Mappings ─────────────────────────────────────────────────────

  // Common mapping: particle spawn creates soft chime
  mapParticleSpawn() {
    return this.map('particle-spawn', (event, audio) => {
      if (!audio.initialized) return;

      const velocity = event.velocity || 0;
      const frequency = 200 + Math.random() * 400 + velocity * 50;

      audio.playTone(frequency, 0.3, {
        type: 'sine',
        volume: 0.02 + Math.random() * 0.02,
        attack: 0.01,
        release: 0.2
      });
    });
  }

  // Common mapping: mouse movement affects filter
  mapMouseToFilter() {
    return this.mapContinuous({
      source: (ctx) => ctx.input.mouseSpeed,
      target: (value, audio) => {
        const frequency = 200 + value * 50;
        audio.setFilterFrequency(Math.min(frequency, 15000));
      },
      min: 0,
      max: 300,
      smoothing: 0.05
    });
  }

  // Common mapping: mouse stillness affects volume
  mapStillnessToVolume() {
    return this.mapContinuous({
      source: (ctx) => ctx.input.mouseStillTime,
      target: (value, audio) => {
        // Lower volume when mouse is still for a while
        const volumeMultiplier = value > 2 ? 0.3 : 1;
        // This would be applied to specific generators
      },
      min: 0,
      max: 5,
      smoothing: 0.1
    });
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  clear() {
    this.mappings.clear();
    this.continuousMappings = [];
  }
}
