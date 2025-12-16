// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE - The Thirteenth Turning
// ═══════════════════════════════════════════════════════════════════════════

// Scene durations in seconds (extended timeline ~3.5 minutes)
export const SCENE_DURATIONS = [28, 28, 38, 38, 32, 25];
export const TOTAL_DURATION = SCENE_DURATIONS.reduce((a, b) => a + b, 0);
export const TRANSITION_DURATION = 2.5;
export const LOOP_ANIMATION = true;

// Global state object
export const state = {
  // Timing
  totalTime: 0,
  currentScene: 0,
  sceneTime: 0,
  transitionProgress: 0,
  isTransitioning: false,

  // Mouse
  mouseX: 0,
  mouseY: 0,
  mouseVel: { x: 0, y: 0 },
  prevMouse: { x: 0, y: 0 },
  mouseStillTime: 0,
  mouseSpeed: 0,

  // Scene-specific state (will be populated by scenes)
  scenes: {},

  // Graphics buffers
  buffers: {},

  // Dimensions
  width: 0,
  height: 0
};

// Update timing state
export function updateTiming(dt) {
  state.totalTime += dt;

  // Calculate current scene
  let accumulated = 0;
  for (let i = 0; i < SCENE_DURATIONS.length; i++) {
    if (state.totalTime < accumulated + SCENE_DURATIONS[i]) {
      // Check for scene transition
      if (state.currentScene !== i) {
        state.isTransitioning = true;
        state.transitionProgress = 0;
      }
      state.currentScene = i;
      state.sceneTime = state.totalTime - accumulated;
      break;
    }
    accumulated += SCENE_DURATIONS[i];
  }

  // Update transition progress
  if (state.isTransitioning) {
    state.transitionProgress += dt / TRANSITION_DURATION;
    if (state.transitionProgress >= 1) {
      state.isTransitioning = false;
      state.transitionProgress = 1;
    }
  }

  // Handle end of animation
  if (state.totalTime >= TOTAL_DURATION) {
    if (LOOP_ANIMATION) {
      resetState();
    } else {
      state.currentScene = SCENE_DURATIONS.length - 1;
      state.sceneTime = SCENE_DURATIONS[state.currentScene];
    }
  }
}

// Update mouse state
export function updateMouse(p5, dt) {
  state.mouseX = p5.mouseX;
  state.mouseY = p5.mouseY;

  state.mouseVel.x = state.mouseX - state.prevMouse.x;
  state.mouseVel.y = state.mouseY - state.prevMouse.y;
  state.mouseSpeed = Math.sqrt(
    state.mouseVel.x * state.mouseVel.x +
    state.mouseVel.y * state.mouseVel.y
  );

  if (state.mouseSpeed < 2) {
    state.mouseStillTime += dt;
  } else {
    state.mouseStillTime = 0;
  }

  state.prevMouse.x = state.mouseX;
  state.prevMouse.y = state.mouseY;
}

// Reset state for loop
export function resetState() {
  state.totalTime = 0;
  state.currentScene = 0;
  state.sceneTime = 0;
  state.transitionProgress = 0;
  state.isTransitioning = false;

  // Reset scene-specific state
  Object.keys(state.scenes).forEach(key => {
    if (state.scenes[key].reset) {
      state.scenes[key].reset();
    }
  });
}

// Get scene progress (0-1)
export function getSceneProgress() {
  return state.sceneTime / SCENE_DURATIONS[state.currentScene];
}
