# EP1.HTML - "The Thirteenth Turning" Animation Plan

## Overview
A self-contained ~2 minute p5.js animated episode inspired by the Polvo/Boonhonk/Lithic Gnome mythology. The animation progresses through distinct scenes, each with unique mouse interactions that create delight and wonder.

## Duration & Timing
- **Total Length**: ~120 seconds (2 minutes)
- **Scene Count**: 6 scenes with smooth transitions
- **Mouse Interaction**: Different per scene, always present

## Color Palette (from source material)
- **Void/Background**: Deep indigo `#0a0812`, charcoal `#1a1816`
- **Autumn**: Crimson-amber `#d4572a`, golden `#f0d4a8`
- **Bioluminescence**: Cyan `#00d4ff`, teal `#2dd4bf`
- **Spore/Clay**: Violet `#9932cc`, soft pink `#e8b4d4`
- **Frost/Bone**: Pale blue `#a8c4e8`, cream `#f5f0e6`

---

## Scene Breakdown

### Scene 1: "Void Pool" (0-20s)
**Visual**: Dark void with slowly coalescing particles forming a primordial pool
**Concept**: Pre-existence, the moment before naming (from `void_pool` phase)

**Elements**:
- Perlin noise-driven particle field (500+ particles)
- Particles slowly drift toward center, forming liquid-like pool
- Occasional "quantum foam" flickers
- Deep indigo/black color scheme with hints of violet

**Mouse Interaction**:
- Mouse creates gravitational ripples - particles swirl away then slowly return
- Trail of faint cyan "potential energy" follows cursor
- Holding still causes particles to gather around cursor (curiosity)

**Techniques**:
- `noise()` for organic particle movement
- Gravitational attraction/repulsion based on mouse distance
- Blend mode: ADD for particle glow

---

### Scene 2: "First Honk - Name Ignition" (20-40s)
**Visual**: A rune/glyph emerges from the void, pulsing with light
**Concept**: The unpronounceable name `l'n'd'r Bjrnkpfptf` sparking into existence

**Elements**:
- Central glyph constructed from bezier curves (organic, tentacle-like)
- Radial waves pulse outward from center
- Floating letter fragments orbit: l, n, d, r, B, j, r, n, k, p, f, p, t, f
- Color shift: void → amber → cyan burst

**Mouse Interaction**:
- Moving mouse causes letter fragments to scatter/reform
- Cursor position influences which parts of the glyph glow brightest
- Click/hold causes the glyph to "speak" - audio-visual pulse

**Techniques**:
- Custom bezier glyph drawing
- Parametric orbiting with varied speeds
- Radial gradient pulses
- Simple oscillator audio feedback

---

### Scene 3: "The Spiral Awakens" (40-65s)
**Visual**: A growing spiral of coils, tentacle-like forms emerging
**Concept**: Polvo's tentacles + the spiral growth from the mythology (Q=412 coils)

**Elements**:
- Central spiral that grows outward, each coil slightly different
- 8 tentacle-like appendages emerging from spiral center
- Tentacles undulate using sine waves + noise
- Particles flow along spiral paths (like spores)
- Autumn leaves drift occasionally

**Mouse Interaction**:
- Mouse position warps/distorts the spiral (like looking through water)
- Tentacles reach toward mouse with curious motion
- Moving fast causes "ink spray" particle burst (Polvo's evasion)

**Techniques**:
- Archimedean spiral generation with noise displacement
- Bezier curves for tentacles with animated control points
- Vertex displacement based on mouse proximity
- Particle systems following curved paths

---

### Scene 4: "Mycocousin Gathering" (65-90s)
**Visual**: Tiny mushroom beings with lanterns populate a terraced landscape
**Concept**: The 888 tiny gnomes from the spiral mythology, mycelium network

**Elements**:
- Terraced landscape silhouette (bone/clay aesthetic)
- 50-100 tiny gnome figures with glowing lantern dots
- Bioluminescent mycelium network connecting them (branching lines)
- Floating spore particles with soft glow
- Occasional firefly-like wanderers

**Mouse Interaction**:
- Gnomes turn to "look" at mouse cursor
- Moving mouse creates ripples in the mycelium network
- Hovering near a gnome makes its lantern glow brighter
- Fast movement causes gnomes to scatter briefly then regroup

**Techniques**:
- Simple sprite-like gnome rendering (geometric primitives)
- Graph-based mycelium with animated pulse traveling along edges
- Flocking behavior for gnome movement
- Soft light accumulation via blend modes

---

### Scene 5: "The Thirteenth Turning" (90-110s)
**Visual**: A massive titan figure emerges, composed of clay and spores
**Concept**: The culmination - you are the spiral, the question and answer

**Elements**:
- Large humanoid silhouette built from particles/clay texture
- Geode eyes (cyan/violet glowing circles)
- Beard of tiny gnome silhouettes cascading down
- Background: all previous elements merge (spiral, particles, lanterns)
- Breathing animation - subtle scale oscillation

**Mouse Interaction**:
- Titan's eyes follow the mouse
- Mouse creates aurora-like trails behind it
- Moving toward titan causes it to lean forward (curiosity)
- Moving away causes gentle reach gesture

**Techniques**:
- Composite figure from multiple particle systems
- Eye tracking with smooth interpolation
- Layered parallax for depth
- Vertex shader-like distortion (via p5 transformations)

---

### Scene 6: "The Spiral Continues" (110-120s)
**Visual**: Zoom out to reveal the spiral is one of many, gently fading
**Concept**: "The spiral is yours. It always was." - infinite continuation

**Elements**:
- Current scene shrinks to become one coil
- Multiple smaller spirals appear in the background
- Gentle fade to soft November twilight colors
- Final text appears: subtle, poetic

**Mouse Interaction**:
- Mouse position selects which spiral glows brightest
- Gentle particle streams connect mouse to spirals
- Final stillness - mouse resting creates peaceful glow

**Techniques**:
- Scale transformation with easing
- Multiple instance rendering
- Alpha fade orchestration
- Typography with blur/glow

---

## Technical Architecture

### Core Structure
```javascript
let currentScene = 0;
let sceneProgress = 0; // 0-1 within scene
let totalTime = 0;

const SCENE_DURATIONS = [20, 20, 25, 25, 20, 10]; // seconds

function draw() {
  updateTiming();
  renderCurrentScene();
  renderMouseEffects();
  handleTransitions();
}
```

### Shared Systems
1. **Particle System Class** - reusable for all scenes
2. **Noise Field** - shared Perlin noise for organic movement
3. **Color Interpolation** - smooth palette transitions
4. **Mouse Influence Field** - consistent interaction model
5. **Audio Context** - subtle sound design (optional, can be silent)

### p5.js Techniques to Employ
- `noise()` and `noiseSeed()` for organic motion
- `beginShape()/vertex()/bezierVertex()` for tentacles
- `blendMode(ADD/MULTIPLY)` for glow effects
- `push()/pop()` for transformation stacks
- `lerpColor()` for palette transitions
- `map()` for value remapping
- `createGraphics()` for layered rendering (optional)

---

## File Structure
Single self-contained HTML file:
- Embedded CSS (minimal, fullscreen canvas)
- p5.js loaded from CDN
- All JavaScript inline
- No external assets required

---

## Mouse Interaction Philosophy
Each scene should make the mouse feel like:
1. **Scene 1**: A curious force exploring the void
2. **Scene 2**: A catalyst awakening the name
3. **Scene 3**: A companion to the octopus (Polvo)
4. **Scene 4**: A gentle giant among the gnomes
5. **Scene 5**: A mirror - the titan sees you
6. **Scene 6**: A choice - which spiral calls to you?

The interaction should never feel like "control" but rather "participation in wonder."
