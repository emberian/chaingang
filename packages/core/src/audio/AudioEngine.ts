// ═══════════════════════════════════════════════════════════════════════════
// AUDIO ENGINE - Central audio controller using Web Audio API
// ═══════════════════════════════════════════════════════════════════════════

import type {
  IAudioEngine,
  IAudioGenerator,
  IContext,
  ToneConfig,
  NoiseConfig
} from '../types/index.js';

export interface AudioEngineConfig {
  masterVolume?: number;
}

export class AudioEngine implements IAudioEngine {
  audioContext: AudioContext | null = null;
  masterGain: GainNode | null = null;
  initialized: boolean = false;

  masterVolume: number;
  muted: boolean = false;

  // Effect nodes
  protected compressor: DynamicsCompressorNode | null = null;
  protected filter: BiquadFilterNode | null = null;

  // Active generators
  protected generators: Map<string, IAudioGenerator> = new Map();

  constructor(config: AudioEngineConfig = {}) {
    this.masterVolume = config.masterVolume !== undefined ? config.masterVolume : 0.5;
  }

  // ─── Initialization ──────────────────────────────────────────────────────

  async init(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Create audio context (must be triggered by user interaction)
      this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();

      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;

      // Create compressor for smooth dynamics
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      // Create master filter
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 20000;
      this.filter.Q.value = 0.5;

      // Connect chain: sources -> filter -> compressor -> masterGain -> destination
      this.filter.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.initialized = true;
      console.log('AudioEngine initialized');

      return true;
    } catch (error) {
      console.error('AudioEngine initialization failed:', error);
      return false;
    }
  }

  // ─── Master Controls ─────────────────────────────────────────────────────

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.masterVolume,
        this.audioContext.currentTime,
        0.1
      );
    }
  }

  mute(): void {
    this.muted = true;
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
    }
  }

  unmute(): void {
    this.muted = false;
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(
        this.masterVolume,
        this.audioContext.currentTime,
        0.1
      );
    }
  }

  toggleMute(): void {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  setFilterFrequency(frequency: number): void {
    if (this.filter && this.audioContext) {
      this.filter.frequency.setTargetAtTime(frequency, this.audioContext.currentTime, 0.1);
    }
  }

  // ─── Generator Management ────────────────────────────────────────────────

  addGenerator(name: string, generator: IAudioGenerator): IAudioGenerator {
    generator.audioEngine = this;
    generator.init(this);
    this.generators.set(name, generator);
    return generator;
  }

  getGenerator(name: string): IAudioGenerator | undefined {
    return this.generators.get(name);
  }

  removeGenerator(name: string): void {
    const generator = this.generators.get(name);
    if (generator) {
      generator.dispose();
      this.generators.delete(name);
    }
  }

  // ─── Sound Creation Helpers ──────────────────────────────────────────────

  createOscillator(type: OscillatorType = 'sine', frequency = 440): OscillatorNode | null {
    if (!this.initialized || !this.audioContext) return null;

    const osc = this.audioContext.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    return osc;
  }

  createGain(value = 1): GainNode | null {
    if (!this.initialized || !this.audioContext) return null;

    const gain = this.audioContext.createGain();
    gain.gain.value = value;
    return gain;
  }

  createFilter(type: BiquadFilterType = 'lowpass', frequency = 1000, Q = 1): BiquadFilterNode | null {
    if (!this.initialized || !this.audioContext) return null;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    return filter;
  }

  // Connect a source to the master output
  connectToMaster(node: AudioNode): void {
    if (this.filter) {
      node.connect(this.filter);
    }
  }

  // ─── Quick Play Methods ──────────────────────────────────────────────────

  playTone(frequency: number, duration = 0.2, config: ToneConfig = {}): void {
    if (!this.initialized || !this.audioContext) return;

    const osc = this.createOscillator(config.type || 'sine', frequency);
    const gain = this.createGain(0);

    if (!osc || !gain) return;

    osc.connect(gain);
    this.connectToMaster(gain);

    const now = this.audioContext.currentTime;
    const volume = config.volume || 0.1;
    const attack = config.attack || 0.01;
    const release = config.release || 0.1;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.setValueAtTime(volume, now + duration - release);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  playNoise(duration = 0.1, config: NoiseConfig = {}): void {
    if (!this.initialized || !this.audioContext) return;

    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gain = this.createGain(0);
    const filter = this.createFilter('bandpass', config.frequency || 1000, config.Q || 2);

    if (!gain || !filter) return;

    source.connect(filter);
    filter.connect(gain);
    this.connectToMaster(gain);

    const now = this.audioContext.currentTime;
    const volume = config.volume || 0.05;

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.start(now);
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(ctx: IContext, dt: number): void {
    if (!this.initialized) return;

    for (const generator of this.generators.values()) {
      generator.update(ctx, dt);
    }
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  dispose(): void {
    for (const generator of this.generators.values()) {
      generator.dispose();
    }
    this.generators.clear();

    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  get currentTime(): number {
    return this.audioContext?.currentTime || 0;
  }
}
