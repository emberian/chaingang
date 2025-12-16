// ═══════════════════════════════════════════════════════════════════════════
// BEHAVIORS - Export all behaviors for easy importing
// ═══════════════════════════════════════════════════════════════════════════

// Base
export { Behavior, TimedBehavior, IntervalBehavior, SmoothValueBehavior } from './Behavior.js';

// Movement
export { NoiseDriftBehavior } from './movement/NoiseDriftBehavior.js';
export { CenterPullBehavior } from './movement/CenterPullBehavior.js';
export { OrbitBehavior } from './movement/OrbitBehavior.js';
export { WrapBoundsBehavior } from './movement/WrapBoundsBehavior.js';

// Interaction
export { MouseRepelBehavior } from './interaction/MouseRepelBehavior.js';
export { MouseAttractBehavior } from './interaction/MouseAttractBehavior.js';
export { GatherOnStillMouseBehavior } from './interaction/GatherOnStillMouseBehavior.js';
export { ScatterBehavior } from './interaction/ScatterBehavior.js';

// Visual
export { PulseBehavior } from './visual/PulseBehavior.js';
export { FadeBehavior, FadeInBehavior, FadeOutBehavior } from './visual/FadeBehavior.js';
export { GlowBehavior, MouseProximityGlowBehavior } from './visual/GlowBehavior.js';
export { TrailBehavior } from './visual/TrailBehavior.js';
