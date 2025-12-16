// ═══════════════════════════════════════════════════════════════════════════
// CHIME GENERATOR - Creates bell-like chime sounds
// ═══════════════════════════════════════════════════════════════════════════

export class ChimeGenerator {
  constructor(config = {}) {
    this.audioEngine = null;
    this.initialized = false;

    // Configuration
    this.baseVolume = config.volume || 0.05;
    this.decay = config.decay || 1.5;
    this.harmonicRatios = config.harmonics || [1, 2.4, 5.95, 8.5];  // Bell-like overtones

    // Scale (pentatonic by default for pleasing random notes)
    this.scale = config.scale || [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];  // Pentatonic
    this.baseNote = config.baseNote || 60;  // Middle C

    // Rate limiting
    this.maxConcurrent = config.maxConcurrent || 8;
    this.activeChimes = 0;
    this.cooldown = config.cooldown || 0.05;
    this.lastChimeTime = 0;
  }

  init(audioEngine) {
    this.audioEngine = audioEngine;
    this.initialized = audioEngine.initialized;
  }

  midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  play(config = {}) {
    if (!this.initialized || !this.audioEngine.initialized) return;

    // Rate limiting
    const now = this.audioEngine.currentTime;
    if (now - this.lastChimeTime < this.cooldown) return;
    if (this.activeChimes >= this.maxConcurrent) return;

    this.lastChimeTime = now;
    this.activeChimes++;

    const audioCtx = this.audioEngine.audioContext;

    // Determine frequency
    let frequency;
    if (config.frequency) {
      frequency = config.frequency;
    } else if (config.note !== undefined) {
      frequency = this.midiToFrequency(config.note);
    } else {
      // Random note from scale
      const scaleIndex = Math.floor(Math.random() * this.scale.length);
      const midiNote = this.baseNote + this.scale[scaleIndex];
      frequency = this.midiToFrequency(midiNote);
    }

    const volume = config.volume || this.baseVolume;
    const decay = config.decay || this.decay;

    // Create chime (multiple oscillators for bell-like sound)
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;

    // Apply envelope
    const attackTime = 0.005;
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + attackTime);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    // Create harmonics
    for (let i = 0; i < this.harmonicRatios.length; i++) {
      const ratio = this.harmonicRatios[i];
      const harmFreq = frequency * ratio;

      // Skip if frequency is too high
      if (harmFreq > 15000) continue;

      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = harmFreq;

      const gain = audioCtx.createGain();
      // Higher harmonics decay faster and are quieter
      const harmonicVolume = 1 / Math.pow(i + 1, 1.5);
      gain.gain.value = harmonicVolume;

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    }

    this.audioEngine.connectToMaster(masterGain);

    // Clean up after sound completes
    setTimeout(() => {
      this.activeChimes = Math.max(0, this.activeChimes - 1);
    }, (decay + 0.2) * 1000);
  }

  // Play a chord
  playChord(notes, config = {}) {
    const delay = config.stagger || 0;
    notes.forEach((note, i) => {
      setTimeout(() => {
        this.play({ ...config, note });
      }, i * delay * 1000);
    });
  }

  // Play random chime from scale
  playRandom(config = {}) {
    this.play(config);
  }

  update(ctx, dt) {
    // ChimeGenerator doesn't need continuous updates
  }

  dispose() {
    // No persistent resources to clean up
  }
}
