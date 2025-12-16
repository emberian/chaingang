// ═══════════════════════════════════════════════════════════════════════════
// AUDIO GENERATOR - Base class for procedural audio generators
// ═══════════════════════════════════════════════════════════════════════════

import type {
  IAudioGenerator,
  IAudioEngine,
  IContext
} from '../types/index.js';

export abstract class AudioGenerator implements IAudioGenerator {
  audioEngine: IAudioEngine | null = null;

  init(audioEngine: IAudioEngine): void {
    this.audioEngine = audioEngine;
  }

  abstract update(ctx: IContext, dt: number): void;

  dispose(): void {
    this.audioEngine = null;
  }
}
