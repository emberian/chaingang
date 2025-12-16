// ═══════════════════════════════════════════════════════════════════════════
// PROCEDURAL AUDIO - The Thirteenth Turning
// ═══════════════════════════════════════════════════════════════════════════

let audioCtx = null;
let masterGain = null;
let droneOsc = null;
let droneGain = null;
let isInitialized = false;

// Scene-specific drone frequencies
const SCENE_DRONES = [
  { freq: 55, detune: -5 },    // Scene 1: Deep void drone
  { freq: 82, detune: 0 },     // Scene 2: Rising ignition
  { freq: 110, detune: 5 },    // Scene 3: Polvo awakening
  { freq: 98, detune: -2 },    // Scene 4: Mycocousin gathering
  { freq: 73, detune: 3 },     // Scene 5: Titan presence
  { freq: 130, detune: 0 }     // Scene 6: Transcendence
];

// Initialize audio context (call on user interaction)
export function initAudio() {
  if (isInitialized) return;

  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.25;
    masterGain.connect(audioCtx.destination);

    // Create ambient drone
    droneOsc = audioCtx.createOscillator();
    droneGain = audioCtx.createGain();
    const droneFilter = audioCtx.createBiquadFilter();

    droneOsc.type = 'sine';
    droneOsc.frequency.value = SCENE_DRONES[0].freq;
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 200;
    droneGain.gain.value = 0.15;

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);
    droneOsc.start();

    isInitialized = true;
  } catch (e) {
    console.warn('Audio initialization failed:', e);
  }
}

// Update drone for current scene
export function updateDrone(scene, progress) {
  if (!isInitialized || !droneOsc) return;

  const current = SCENE_DRONES[scene] || SCENE_DRONES[0];
  const next = SCENE_DRONES[scene + 1] || current;

  // Smoothly transition drone frequency
  const targetFreq = current.freq + (next.freq - current.freq) * progress * 0.3;
  droneOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.5);
}

// Play a chime (for letter appearances, completions)
export function playChime(baseFreq = 523) {
  if (!isInitialized) return;

  const frequencies = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
  frequencies.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime + i * 0.05);
    gain.gain.setTargetAtTime(0.001, audioCtx.currentTime + i * 0.05 + 0.15, 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(audioCtx.currentTime + i * 0.05);
    osc.stop(audioCtx.currentTime + i * 0.05 + 0.6);
  });
}

// Play the HONK sound
export function playHonk() {
  if (!isInitialized) return;

  // Main honk tone
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc1.type = 'sawtooth';
  osc1.frequency.value = 185;
  osc2.type = 'square';
  osc2.frequency.value = 92;

  filter.type = 'lowpass';
  filter.frequency.value = 600;

  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.setTargetAtTime(0.001, audioCtx.currentTime + 0.3, 0.1);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc1.start();
  osc2.start();
  osc1.stop(audioCtx.currentTime + 0.5);
  osc2.stop(audioCtx.currentTime + 0.5);
}

// Play bone whisper (for fading, memory)
export function playBoneWhisper() {
  if (!isInitialized) return;

  const bufferSize = audioCtx.sampleRate * 0.4;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const env = Math.sin(Math.PI * i / bufferSize);
    data[i] = (Math.random() * 2 - 1) * env * 0.08;
  }

  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  filter.type = 'bandpass';
  filter.frequency.value = 900;
  filter.Q.value = 3;
  gain.gain.value = 0.06;

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start();
}

// Play mycelium pulse
export function playMyceliumPulse() {
  if (!isInitialized) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 60;
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.setTargetAtTime(0.001, audioCtx.currentTime + 0.1, 0.05);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

// Play heartbeat for titan
export function playHeartbeat() {
  if (!isInitialized) return;

  const playBeat = (delay, freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + delay + 0.02);
    gain.gain.setTargetAtTime(0.001, audioCtx.currentTime + delay + 0.05, duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration + 0.2);
  };

  playBeat(0, 50, 0.08);
  playBeat(0.15, 45, 0.1);
}

// Play autumn wind
export function playAutumnWind() {
  if (!isInitialized) return;

  const bufferSize = audioCtx.sampleRate * 1.5;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const env = Math.sin(Math.PI * i / bufferSize);
    data[i] = (Math.random() * 2 - 1) * env * 0.03;
  }

  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  filter.type = 'lowpass';
  filter.frequency.value = 300;
  gain.gain.value = 0.04;

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start();
}

// Resume audio context (needed after user interaction)
export function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
