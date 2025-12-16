// ═══════════════════════════════════════════════════════════════════════════
// EPISODE 1: THE THIRTEENTH TURNING
// A ~3.5 minute animated journey through the Polvo/Boonhonk mythology
// ═══════════════════════════════════════════════════════════════════════════

import p5 from 'p5';

// Core modules
import { COLORS, hexToRgb } from './colors.js';
import {
  state,
  updateTiming,
  updateMouse,
  getSceneProgress,
  SCENE_DURATIONS,
  TOTAL_DURATION,
  resetState
} from './state.js';
import { initAudio, resumeAudio, updateDrone } from './audio.js';
import { initCursor, updateCursor } from './cursor.js';
import { updateNarrative, renderNarrative, clearNarrative } from './narrative.js';
import { renderTransition } from './transitions.js';

// Scenes
import * as scene1 from './scenes/scene1-void.js';
import * as scene2 from './scenes/scene2-ignition.js';
import * as scene3 from './scenes/scene3-polvo.js';
import * as scene4 from './scenes/scene4-gnomes.js';
import * as scene5 from './scenes/scene5-titan.js';
import * as scene6 from './scenes/scene6-ending.js';

const scenes = [scene1, scene2, scene3, scene4, scene5, scene6];

// Graphics buffers
let bgGradient = null;
let previousScene = -1;

// ─── P5 SKETCH ─────────────────────────────────────────────────────────────
const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.RGB, 255, 255, 255, 255);
    p.noiseSeed(42);

    // Store dimensions
    state.width = p.width;
    state.height = p.height;

    // Create background gradient
    createBackgroundGradient(p);

    // Initialize cursor
    initCursor();

    // Initialize all scenes
    scenes.forEach(scene => scene.init(p));

    // Register scene reset functions
    state.scenes = {
      scene1: { reset: () => scene1.reset(p) },
      scene2: { reset: () => scene2.reset(p) },
      scene3: { reset: () => scene3.reset(p) },
      scene4: { reset: () => scene4.reset(p) },
      scene5: { reset: () => scene5.reset(p) },
      scene6: { reset: () => scene6.reset(p) }
    };
  };

  p.draw = () => {
    const dt = p.deltaTime / 1000;

    // Update timing
    updateTiming(dt);
    updateMouse(p, dt);

    // Update audio drone
    updateDrone(state.currentScene, getSceneProgress());

    // Update cursor
    updateCursor(state.currentScene, getSceneProgress());

    // Update narrative
    updateNarrative(p, state.currentScene, dt);

    // Check for scene change
    if (state.currentScene !== previousScene) {
      // Initialize new scene if needed
      scenes[state.currentScene].init(p);
      previousScene = state.currentScene;
    }

    // Draw background
    drawBackground(p);

    // Update and render current scene
    const progress = getSceneProgress();
    scenes[state.currentScene].update(p, dt, progress);
    scenes[state.currentScene].render(p, progress);

    // Render transitions between scenes
    if (state.isTransitioning && state.currentScene > 0) {
      renderTransition(p, state.currentScene - 1, state.currentScene, state.transitionProgress);
    }

    // Draw vignette
    drawVignette(p);

    // Render narrative text
    renderNarrative(p);

    // Draw progress bar
    drawProgressBar(p);

    // Draw episode intro title
    drawEpisodeTitle(p);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    state.width = p.width;
    state.height = p.height;
    createBackgroundGradient(p);

    // Reinitialize scenes for new dimensions
    scenes.forEach(scene => {
      if (scene.reset) scene.reset(p);
    });
  };

  p.mousePressed = () => {
    // Initialize audio on first interaction
    initAudio();
    resumeAudio();
  };

  p.touchStarted = () => {
    // Initialize audio on first interaction
    initAudio();
    resumeAudio();
    return false; // Prevent default
  };
};

// ─── BACKGROUND ────────────────────────────────────────────────────────────
function createBackgroundGradient(p) {
  bgGradient = p.createGraphics(state.width, state.height);
  const c1 = bgGradient.color(5, 3, 8);
  const c2 = bgGradient.color(26, 16, 48);

  for (let y = 0; y < state.height; y++) {
    const inter = p.map(y, 0, state.height, 0, 1);
    bgGradient.stroke(bgGradient.lerpColor(c1, c2, inter * 0.3));
    bgGradient.line(0, y, state.width, y);
  }
}

function drawBackground(p) {
  if (bgGradient) {
    p.image(bgGradient, 0, 0);
  } else {
    p.background(10, 8, 18);
  }

  // Scene-specific tint overlay for later scenes
  if (state.currentScene >= 3) {
    const tintAlpha = p.map(state.currentScene, 3, 5, 0.03, 0.1);
    p.push();
    p.noStroke();
    p.fill(26, 16, 48, tintAlpha * 255);
    p.rect(0, 0, state.width, state.height);
    p.pop();
  }
}

function drawVignette(p) {
  p.push();
  p.noStroke();

  const gradient = p.drawingContext.createRadialGradient(
    state.width / 2, state.height / 2, 0,
    state.width / 2, state.height / 2, Math.max(state.width, state.height) * 0.7
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.7, 'rgba(0,0,0,0.15)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.5)');

  p.drawingContext.fillStyle = gradient;
  p.rect(0, 0, state.width, state.height);
  p.pop();
}

// ─── UI ELEMENTS ───────────────────────────────────────────────────────────
function drawProgressBar(p) {
  const progressRatio = state.totalTime / TOTAL_DURATION;

  p.push();
  p.noStroke();

  // Background track
  p.fill(30, 25, 40, 80);
  p.rect(state.width * 0.1, state.height - 10, state.width * 0.8, 4, 2);

  // Progress fill
  const progCol = p.lerpColor(p.color(COLORS.violet), p.color(COLORS.honk), progressRatio);
  p.fill(p.red(progCol), p.green(progCol), p.blue(progCol), 150);
  p.rect(state.width * 0.1, state.height - 10, state.width * 0.8 * progressRatio, 4, 2);

  // Scene markers with pentad symbols
  const pentadSymbols = ['!', '~', '^', '<>', '?'];
  let markerX = state.width * 0.1;

  for (let i = 0; i < SCENE_DURATIONS.length - 1; i++) {
    markerX += (SCENE_DURATIONS[i] / TOTAL_DURATION) * state.width * 0.8;

    // Marker dot
    const isActive = state.currentScene > i;
    p.fill(isActive ? 150 : 80, isActive ? 140 : 70, isActive ? 180 : 100, 120);
    p.ellipse(markerX, state.height - 8, 6, 6);

    // Pentad symbol above (subtle)
    if (i < pentadSymbols.length) {
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(8);
      p.fill(100, 90, 120, 60);
      p.text(pentadSymbols[i], markerX, state.height - 20);
    }
  }

  p.pop();
}

function drawEpisodeTitle(p) {
  // Show episode title at very beginning
  if (state.totalTime < 5) {
    const opacity = state.totalTime < 2.5 ? state.totalTime / 2.5 : (5 - state.totalTime) / 2.5;

    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('Georgia');

    // Main title
    p.textSize(42);
    const boneRgb = hexToRgb(COLORS.bone);
    p.fill(boneRgb.r, boneRgb.g, boneRgb.b, opacity * 0.85 * 255);
    p.text("The Thirteenth Turning", state.width / 2, state.height / 2 - 35);

    // Subtitle
    p.textSize(18);
    const frostRgb = hexToRgb(COLORS.frost);
    p.fill(frostRgb.r, frostRgb.g, frostRgb.b, opacity * 0.5 * 255);
    p.text("episode one", state.width / 2, state.height / 2 + 15);

    // Instruction
    if (state.totalTime > 2) {
      p.textSize(13);
      p.fill(100, 90, 120, opacity * 0.5 * 255);
      p.text("move your cursor to participate", state.width / 2, state.height / 2 + 55);
    }

    p.pop();
  }
}

// ─── INITIALIZE ────────────────────────────────────────────────────────────
new p5(sketch);
