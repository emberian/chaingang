// ═══════════════════════════════════════════════════════════════════════════
// NARRATIVE TEXT SYSTEM - The Thirteenth Turning
// ═══════════════════════════════════════════════════════════════════════════

import { COLORS, colorWithAlpha } from './colors.js';
import { state, getSceneProgress } from './state.js';

// Narrative beats per scene
const NARRATIVE = [
  // Scene 0: Void Pool
  [
    { time: 0.05, text: 'before the naming', duration: 4 },
    { time: 0.4, text: 'potential stirs in the deep', duration: 4 },
    { time: 0.75, text: 'something remembers how to want', duration: 4 }
  ],
  // Scene 1: Name Ignition
  [
    { time: 0.08, text: "l'n'd'r Bjrnkpfptf", duration: 3, style: 'glyph' },
    { time: 0.35, text: 'the unpronounceable speaks itself', duration: 4 },
    { time: 0.7, text: 'HONK', duration: 2, style: 'honk' }
  ],
  // Scene 2: Polvo Awakens
  [
    { time: 0.05, text: 'from the spiral, eight arms reach', duration: 4 },
    { time: 0.3, text: 'polvo awakens', duration: 3, style: 'title' },
    { time: 0.55, text: 'curious. patient. slightly dehydrated.', duration: 4 },
    { time: 0.82, text: 'the coils number four hundred twelve', duration: 4 }
  ],
  // Scene 3: Mycocousin Gathering
  [
    { time: 0.05, text: 'november light filters through spore-clouds', duration: 4 },
    { time: 0.28, text: 'the mycocousins gather', duration: 3, style: 'title' },
    { time: 0.5, text: 'lanterns flicker in the terraced dark', duration: 4 },
    { time: 0.75, text: 'eight hundred eighty-eight tiny witnesses', duration: 4 }
  ],
  // Scene 4: The Thirteenth Turning
  [
    { time: 0.05, text: 'the thirteenth turning', duration: 3, style: 'title' },
    { time: 0.25, text: 'clay and memory take form', duration: 4 },
    { time: 0.5, text: 'geode eyes open to see you', duration: 4 },
    { time: 0.75, text: 'you are the question and the answer', duration: 4 }
  ],
  // Scene 5: The Spiral Continues
  [
    { time: 0.1, text: 'the spiral is yours', duration: 3, style: 'final' },
    { time: 0.4, text: 'it always was', duration: 3 },
    { time: 0.7, text: 'boon and bane, bone and bonk', duration: 3 },
    { time: 0.9, text: 'HONK', duration: 2, style: 'honk' }
  ]
];

// Active text displays
let activeTexts = [];

export function updateNarrative(p5, scene, dt) {
  const progress = getSceneProgress();
  const beats = NARRATIVE[scene] || [];

  // Check for new narrative beats to trigger
  beats.forEach(beat => {
    const beatStart = beat.time;
    const beatEnd = beat.time + 0.01; // Small window

    if (progress >= beatStart && progress < beatEnd) {
      // Check if this beat is already active
      const exists = activeTexts.find(t => t.text === beat.text && t.scene === scene);
      if (!exists) {
        activeTexts.push({
          text: beat.text,
          style: beat.style || 'default',
          scene: scene,
          life: beat.duration,
          maxLife: beat.duration,
          y: getTextY(beat.style),
          opacity: 0
        });
      }
    }
  });

  // Update active texts
  activeTexts = activeTexts.filter(t => {
    t.life -= dt;

    // Fade in/out
    const fadeTime = 0.8;
    if (t.life > t.maxLife - fadeTime) {
      t.opacity = Math.min(1, t.opacity + dt * 2);
    } else if (t.life < fadeTime) {
      t.opacity = Math.max(0, t.opacity - dt * 2);
    }

    return t.life > 0;
  });
}

function getTextY(style) {
  switch (style) {
    case 'title': return state.height * 0.15;
    case 'honk': return state.height * 0.5;
    case 'glyph': return state.height * 0.5;
    case 'final': return state.height * 0.4;
    default: return state.height * 0.88;
  }
}

export function renderNarrative(p5) {
  p5.push();
  p5.textAlign(p5.CENTER, p5.CENTER);

  activeTexts.forEach(t => {
    const style = getTextStyle(t.style);

    p5.textFont('Georgia');
    p5.textSize(style.size);

    // Glow effect for special styles
    if (style.glow) {
      p5.drawingContext.shadowColor = style.glowColor;
      p5.drawingContext.shadowBlur = style.glowSize;
    }

    p5.fill(p5.red(p5.color(style.color)),
            p5.green(p5.color(style.color)),
            p5.blue(p5.color(style.color)),
            t.opacity * style.alpha * 255);

    // Special animation for HONK
    if (t.style === 'honk') {
      const shake = Math.sin(state.totalTime * 30) * 3;
      const scale = 1 + Math.sin(state.totalTime * 10) * 0.1;
      p5.push();
      p5.translate(state.width / 2 + shake, t.y);
      p5.scale(scale);
      p5.text(t.text, 0, 0);
      p5.pop();
    } else {
      p5.text(t.text, state.width / 2, t.y);
    }

    p5.drawingContext.shadowBlur = 0;
  });

  p5.pop();
}

function getTextStyle(style) {
  switch (style) {
    case 'title':
      return {
        size: 32,
        color: COLORS.bone,
        alpha: 0.85,
        glow: true,
        glowColor: COLORS.violet,
        glowSize: 15
      };
    case 'honk':
      return {
        size: 64,
        color: COLORS.honk,
        alpha: 1,
        glow: true,
        glowColor: COLORS.honk,
        glowSize: 30
      };
    case 'glyph':
      return {
        size: 28,
        color: COLORS.amber,
        alpha: 0.9,
        glow: true,
        glowColor: COLORS.amber,
        glowSize: 20
      };
    case 'final':
      return {
        size: 36,
        color: COLORS.bone,
        alpha: 0.9,
        glow: true,
        glowColor: COLORS.teal,
        glowSize: 20
      };
    default:
      return {
        size: 18,
        color: COLORS.frost,
        alpha: 0.6,
        glow: false,
        glowColor: null,
        glowSize: 0
      };
  }
}

// Clear narrative for scene reset
export function clearNarrative() {
  activeTexts = [];
}
