// ═══════════════════════════════════════════════════════════════════════════
// NARRATIVE TEXT - Dynamic text display system for story beats
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { COLORS, hexToRgb } from '../../config/colors.js';

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

// Text style definitions
const TEXT_STYLES = {
  default: {
    size: 18,
    color: COLORS.frost,
    alpha: 0.6,
    glow: false,
    glowColor: null,
    glowSize: 0,
    yPosition: 0.88
  },
  title: {
    size: 32,
    color: COLORS.bone,
    alpha: 0.85,
    glow: true,
    glowColor: COLORS.violet,
    glowSize: 15,
    yPosition: 0.15
  },
  honk: {
    size: 64,
    color: COLORS.honk,
    alpha: 1,
    glow: true,
    glowColor: COLORS.honk,
    glowSize: 30,
    yPosition: 0.5,
    animated: true
  },
  glyph: {
    size: 28,
    color: COLORS.amber,
    alpha: 0.9,
    glow: true,
    glowColor: COLORS.amber,
    glowSize: 20,
    yPosition: 0.5
  },
  final: {
    size: 36,
    color: COLORS.bone,
    alpha: 0.9,
    glow: true,
    glowColor: COLORS.teal,
    glowSize: 20,
    yPosition: 0.4
  }
};

export { NARRATIVE };

export class NarrativeText extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      tags: ['ui', 'narrative', ...(config.tags || [])]
    });

    this.layer = 'ui';

    // Active text displays
    this.activeTexts = [];

    // Current state
    this.currentScene = 0;
    this.sceneProgress = 0;

    // Font
    this.font = config.font || 'Georgia';

    // Fade timing
    this.fadeTime = config.fadeTime || 0.8;

    // Audio callback for HONK
    this.onHonk = config.onHonk || null;
  }

  setSceneProgress(scene, progress) {
    // Check for scene change
    if (scene !== this.currentScene) {
      this.currentScene = scene;
      // Don't clear texts immediately - let them fade out
    }

    const prevProgress = this.sceneProgress;
    this.sceneProgress = progress;

    // Check for new narrative beats to trigger
    const beats = NARRATIVE[scene] || [];

    beats.forEach(beat => {
      const beatStart = beat.time;
      const beatEnd = beat.time + 0.01; // Small window

      // Trigger if we crossed the beat time
      if (progress >= beatStart && prevProgress < beatStart) {
        // Check if this beat is already active
        const exists = this.activeTexts.find(t => t.text === beat.text && t.scene === scene);
        if (!exists) {
          this.activeTexts.push({
            text: beat.text,
            style: beat.style || 'default',
            scene: scene,
            life: beat.duration,
            maxLife: beat.duration,
            opacity: 0
          });

          // Trigger HONK callback
          if (beat.style === 'honk' && this.onHonk) {
            this.onHonk();
          }
        }
      }
    });
  }

  onUpdate(ctx, dt) {
    // Update active texts
    this.activeTexts = this.activeTexts.filter(t => {
      t.life -= dt;

      // Fade in/out
      if (t.life > t.maxLife - this.fadeTime) {
        t.opacity = Math.min(1, t.opacity + dt * 2);
      } else if (t.life < this.fadeTime) {
        t.opacity = Math.max(0, t.opacity - dt * 2);
      }

      return t.life > 0;
    });
  }

  onRender(ctx) {
    const p = ctx.p5;

    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont(this.font);

    this.activeTexts.forEach(t => {
      const style = TEXT_STYLES[t.style] || TEXT_STYLES.default;
      const y = ctx.height * style.yPosition;

      p.textSize(style.size);

      // Glow effect for special styles
      if (style.glow) {
        const glowRgb = hexToRgb(style.glowColor);
        p.drawingContext.shadowColor = `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${t.opacity})`;
        p.drawingContext.shadowBlur = style.glowSize;
      }

      const colorRgb = hexToRgb(style.color);
      p.fill(colorRgb.r, colorRgb.g, colorRgb.b, t.opacity * style.alpha * 255);

      // Special animation for HONK
      if (style.animated) {
        const shake = Math.sin(ctx.time.total * 30) * 3;
        const scale = 1 + Math.sin(ctx.time.total * 10) * 0.1;
        p.push();
        p.translate(ctx.width / 2 + shake, y);
        p.scale(scale);
        p.text(t.text, 0, 0);
        p.pop();
      } else {
        p.text(t.text, ctx.width / 2, y);
      }

      p.drawingContext.shadowBlur = 0;
    });

    p.pop();
  }

  // Clear all narrative texts
  clear() {
    this.activeTexts = [];
  }
}
