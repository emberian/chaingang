// ═══════════════════════════════════════════════════════════════════════════
// DRONE GENERATOR - Creates evolving ambient drone sounds
// ═══════════════════════════════════════════════════════════════════════════

export class DroneGenerator {
  constructor(config = {}) {
    this.audioEngine = null;
    this.initialized = false;

    // Configuration
    this.baseFrequency = config.baseFrequency || 55;  // Low A
    this.harmonics = config.harmonics || [1, 2, 3, 5, 8];  // Harmonic ratios
    this.volume = config.volume || 0.1;
    this.filterFrequency = config.filterFrequency || 800;

    // Nodes
    this.oscillators = [];
    this.gains = [];
    this.masterGain = null;
    this.filter = null;

    // Modulation
    this.lfoPhase = 0;
    this.lfoSpeed = config.lfoSpeed || 0.1;
    this.lfoDepth = config.lfoDepth || 0.3;

    // State
    this.playing = false;
    this.fadeTime = config.fadeTime || 2;
  }

  init(audioEngine) {
    this.audioEngine = audioEngine;
    if (!audioEngine.initialized) return;

    const ctx = audioEngine.audioContext;

    // Create master gain for this drone
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0;

    // Create filter
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.filterFrequency;
    this.filter.Q.value = 2;

    // Connect to audio engine
    this.masterGain.connect(this.filter);
    audioEngine.connectToMaster(this.filter);

    // Create oscillators for each harmonic
    for (let i = 0; i < this.harmonics.length; i++) {
      const harmonic = this.harmonics[i];
      const frequency = this.baseFrequency * harmonic;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = frequency;

      const gain = ctx.createGain();
      // Lower volume for higher harmonics
      gain.gain.value = 1 / (i + 1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.oscillators.push(osc);
      this.gains.push(gain);
    }

    this.initialized = true;
  }

  start() {
    if (!this.initialized) return;

    this.playing = true;
    const ctx = this.audioEngine.audioContext;
    this.masterGain.gain.setTargetAtTime(this.volume, ctx.currentTime, this.fadeTime);
  }

  stop() {
    if (!this.initialized) return;

    this.playing = false;
    const ctx = this.audioEngine.audioContext;
    this.masterGain.gain.setTargetAtTime(0, ctx.currentTime, this.fadeTime);
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.playing && this.masterGain) {
      const ctx = this.audioEngine.audioContext;
      this.masterGain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
    }
  }

  setFilterFrequency(frequency) {
    this.filterFrequency = frequency;
    if (this.filter) {
      const ctx = this.audioEngine.audioContext;
      this.filter.frequency.setTargetAtTime(frequency, ctx.currentTime, 0.1);
    }
  }

  setBaseFrequency(frequency) {
    this.baseFrequency = frequency;
    if (this.initialized) {
      const ctx = this.audioEngine.audioContext;
      for (let i = 0; i < this.oscillators.length; i++) {
        const newFreq = frequency * this.harmonics[i];
        this.oscillators[i].frequency.setTargetAtTime(newFreq, ctx.currentTime, 0.5);
      }
    }
  }

  update(ctx, dt) {
    if (!this.initialized || !this.playing) return;

    // LFO modulation
    this.lfoPhase += dt * this.lfoSpeed * Math.PI * 2;

    const lfoValue = Math.sin(this.lfoPhase);
    const filterMod = 1 + lfoValue * this.lfoDepth;

    // Modulate filter
    if (this.filter) {
      const audioCtx = this.audioEngine.audioContext;
      this.filter.frequency.setTargetAtTime(
        this.filterFrequency * filterMod,
        audioCtx.currentTime,
        0.05
      );
    }

    // Subtle detuning for organic feel
    for (let i = 0; i < this.oscillators.length; i++) {
      const detune = Math.sin(this.lfoPhase * (0.3 + i * 0.1)) * 5;
      this.oscillators[i].detune.value = detune;
    }
  }

  dispose() {
    for (const osc of this.oscillators) {
      osc.stop();
      osc.disconnect();
    }
    this.oscillators = [];

    for (const gain of this.gains) {
      gain.disconnect();
    }
    this.gains = [];

    if (this.masterGain) {
      this.masterGain.disconnect();
    }
    if (this.filter) {
      this.filter.disconnect();
    }
  }
}
