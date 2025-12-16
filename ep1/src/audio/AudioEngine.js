// ═══════════════════════════════════════════════════════════════════════════
// AUDIO ENGINE - Central audio controller using Web Audio API
// ═══════════════════════════════════════════════════════════════════════════

// Scene-specific drone frequencies
const SCENE_DRONES = [
  { freq: 55, detune: -5 },    // Scene 1: Deep void drone
  { freq: 82, detune: 0 },     // Scene 2: Rising ignition
  { freq: 110, detune: 5 },    // Scene 3: Polvo awakening
  { freq: 98, detune: -2 },    // Scene 4: Mycocousin gathering
  { freq: 73, detune: 3 },     // Scene 5: Titan presence
  { freq: 130, detune: 0 }     // Scene 6: Transcendence
];

export { SCENE_DRONES };

export class AudioEngine {
  constructor(config = {}) {
    this.audioContext = null;
    this.masterGain = null;
    this.initialized = false;

    this.masterVolume = config.masterVolume !== undefined ? config.masterVolume : 0.5;
    this.muted = false;

    // Effect nodes
    this.compressor = null;
    this.reverb = null;
    this.filter = null;

    // Drone oscillator
    this.droneOsc = null;
    this.droneGain = null;
    this.droneFilter = null;
    this.currentScene = 0;

    // Active sounds
    this.activeSounds = new Map();
    this.generators = new Map();
  }

  // ─── Initialization ──────────────────────────────────────────────────────

  async init() {
    if (this.initialized) return;

    try {
      // Create audio context (must be triggered by user interaction)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

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

      // Create ambient drone
      this.droneOsc = this.audioContext.createOscillator();
      this.droneGain = this.audioContext.createGain();
      this.droneFilter = this.audioContext.createBiquadFilter();

      this.droneOsc.type = 'sine';
      this.droneOsc.frequency.value = SCENE_DRONES[0].freq;
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.value = 200;
      this.droneGain.gain.value = 0.15;

      this.droneOsc.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);
      this.droneOsc.start();

      this.initialized = true;
      console.log('AudioEngine initialized');

      return true;
    } catch (error) {
      console.error('AudioEngine initialization failed:', error);
      return false;
    }
  }

  // ─── Master Controls ─────────────────────────────────────────────────────

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.masterVolume,
        this.audioContext.currentTime,
        0.1
      );
    }
  }

  mute() {
    this.muted = true;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
    }
  }

  unmute() {
    this.muted = false;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.masterVolume,
        this.audioContext.currentTime,
        0.1
      );
    }
  }

  toggleMute() {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  setFilterFrequency(frequency) {
    if (this.filter) {
      this.filter.frequency.setTargetAtTime(frequency, this.audioContext.currentTime, 0.1);
    }
  }

  // ─── Generator Management ────────────────────────────────────────────────

  addGenerator(name, generator) {
    generator.audioEngine = this;
    generator.init(this);
    this.generators.set(name, generator);
    return generator;
  }

  getGenerator(name) {
    return this.generators.get(name);
  }

  removeGenerator(name) {
    const generator = this.generators.get(name);
    if (generator) {
      generator.dispose();
      this.generators.delete(name);
    }
  }

  // ─── Sound Creation Helpers ──────────────────────────────────────────────

  createOscillator(type = 'sine', frequency = 440) {
    if (!this.initialized) return null;

    const osc = this.audioContext.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    return osc;
  }

  createGain(value = 1) {
    if (!this.initialized) return null;

    const gain = this.audioContext.createGain();
    gain.gain.value = value;
    return gain;
  }

  createFilter(type = 'lowpass', frequency = 1000, Q = 1) {
    if (!this.initialized) return null;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    return filter;
  }

  // Connect a source to the master output
  connectToMaster(node) {
    if (this.filter) {
      node.connect(this.filter);
    }
  }

  // ─── Quick Play Methods ──────────────────────────────────────────────────

  playTone(frequency, duration = 0.2, config = {}) {
    if (!this.initialized) return;

    const osc = this.createOscillator(config.type || 'sine', frequency);
    const gain = this.createGain(0);

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

  playNoise(duration = 0.1, config = {}) {
    if (!this.initialized) return;

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

    source.connect(filter);
    filter.connect(gain);
    this.connectToMaster(gain);

    const now = this.audioContext.currentTime;
    const volume = config.volume || 0.05;

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.start(now);
  }

  // ─── Scene Audio Methods ────────────────────────────────────────────────

  // Update drone for current scene
  updateDrone(scene, progress) {
    if (!this.initialized || !this.droneOsc) return;

    this.currentScene = scene;
    const current = SCENE_DRONES[scene] || SCENE_DRONES[0];
    const next = SCENE_DRONES[scene + 1] || current;

    // Smoothly transition drone frequency
    const targetFreq = current.freq + (next.freq - current.freq) * progress * 0.3;
    this.droneOsc.frequency.setTargetAtTime(targetFreq, this.audioContext.currentTime, 0.5);
  }

  // Play the HONK sound - goose honk with sawtooth + square
  playHonk() {
    if (!this.initialized) return;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.value = 185;
    osc2.type = 'square';
    osc2.frequency.value = 92;

    filter.type = 'lowpass';
    filter.frequency.value = 600;

    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.setTargetAtTime(0.001, now + 0.3, 0.1);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  // Play bone whisper - filtered noise for fading, memory
  playBoneWhisper() {
    if (!this.initialized) return;

    const bufferSize = this.audioContext.sampleRate * 0.4;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin(Math.PI * i / bufferSize);
      data[i] = (Math.random() * 2 - 1) * env * 0.08;
    }

    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();

    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 3;
    gain.gain.value = 0.06;

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // Play mycelium pulse - low frequency thump
  playMyceliumPulse() {
    if (!this.initialized) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = 60;

    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.setTargetAtTime(0.001, now + 0.1, 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(now + 0.2);
  }

  // Play heartbeat for titan - double beat
  playHeartbeat() {
    if (!this.initialized) return;

    const playBeat = (delay, freq, duration) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const now = this.audioContext.currentTime;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.1, now + delay + 0.02);
      gain.gain.setTargetAtTime(0.001, now + delay + 0.05, duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.2);
    };

    playBeat(0, 50, 0.08);
    playBeat(0.15, 45, 0.1);
  }

  // Play autumn wind - filtered noise
  playAutumnWind() {
    if (!this.initialized) return;

    const bufferSize = this.audioContext.sampleRate * 1.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin(Math.PI * i / bufferSize);
      data[i] = (Math.random() * 2 - 1) * env * 0.03;
    }

    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();

    filter.type = 'lowpass';
    filter.frequency.value = 300;
    gain.gain.value = 0.04;

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // Play chime - for letter appearances, completions
  playChime(baseFreq = 523) {
    if (!this.initialized) return;

    const frequencies = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    frequencies.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const now = this.audioContext.currentTime;
      gain.gain.setValueAtTime(0.04, now + i * 0.05);
      gain.gain.setTargetAtTime(0.001, now + i * 0.05 + 0.15, 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.6);
    });
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(ctx, dt) {
    if (!this.initialized) return;

    for (const generator of this.generators.values()) {
      generator.update(ctx, dt);
    }
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  dispose() {
    for (const generator of this.generators.values()) {
      generator.dispose();
    }
    this.generators.clear();

    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  get currentTime() {
    return this.audioContext?.currentTime || 0;
  }
}
