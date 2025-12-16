// ═══════════════════════════════════════════════════════════════════════════
// AUDIO REACTOR - Maps visual events to audio responses
// ═══════════════════════════════════════════════════════════════════════════

import type {
  IAudioReactor,
  IAudioEngine,
  IContext,
  AudioEventCallback,
  ContinuousMappingConfig
} from '../types/index.js';

interface ContinuousMapping extends ContinuousMappingConfig {
  currentValue: number;
}

export class AudioReactor implements IAudioReactor {
  audioEngine: IAudioEngine;
  mappings: Map<string, AudioEventCallback[]> = new Map();
  continuousMappings: ContinuousMapping[] = [];
  enabled: boolean = true;

  constructor(audioEngine: IAudioEngine) {
    this.audioEngine = audioEngine;
  }

  // ─── Event Mappings ──────────────────────────────────────────────────────

  // Map a discrete event to an audio response
  map(eventName: string, callback: AudioEventCallback): this {
    if (!this.mappings.has(eventName)) {
      this.mappings.set(eventName, []);
    }
    this.mappings.get(eventName)!.push(callback);
    return this;
  }

  // Map continuous context values to audio parameters
  mapContinuous(config: ContinuousMappingConfig): this {
    this.continuousMappings.push({
      source: config.source,
      target: config.target,
      min: config.min || 0,
      max: config.max || 1,
      smoothing: config.smoothing || 0.1,
      currentValue: 0
    });
    return this;
  }

  // Trigger an event
  trigger(eventName: string, data: Record<string, unknown> = {}): void {
    if (!this.enabled) return;

    const handlers = this.mappings.get(eventName);
    if (handlers) {
      for (const handler of handlers) {
        handler(data, this.audioEngine);
      }
    }
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(ctx: IContext, _dt: number): void {
    if (!this.enabled) return;

    // Process continuous mappings
    for (const mapping of this.continuousMappings) {
      const rawValue = mapping.source(ctx);
      const normalizedValue = Math.max(mapping.min ?? 0, Math.min(mapping.max ?? 1, rawValue));

      // Smooth the value
      mapping.currentValue += (normalizedValue - mapping.currentValue) * (mapping.smoothing ?? 0.1);

      // Apply to target
      mapping.target(mapping.currentValue, this.audioEngine, ctx);
    }
  }

  // ─── Preset Mappings ─────────────────────────────────────────────────────

  // Common mapping: particle spawn creates soft chime
  mapParticleSpawn(): this {
    return this.map('particle-spawn', (event, audio) => {
      if (!audio.initialized) return;

      const velocity = (event.velocity as number) || 0;
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
  mapMouseToFilter(): this {
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
  mapStillnessToVolume(): this {
    return this.mapContinuous({
      source: (ctx) => ctx.input.mouseStillTime,
      target: (_value, _audio) => {
        // Lower volume when mouse is still for a while
        // This would be applied to specific generators
      },
      min: 0,
      max: 5,
      smoothing: 0.1
    });
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  clear(): void {
    this.mappings.clear();
    this.continuousMappings = [];
  }
}
