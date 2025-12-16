// ═══════════════════════════════════════════════════════════════════════════
// CURSOR - Scene-aware custom cursor entity
// Transforms based on current scene with animated shapes
// ═══════════════════════════════════════════════════════════════════════════

import { Entity } from '../../core/Entity.js';
import { COLORS } from '../../config/colors.js';

// Cursor configurations per scene
const CURSOR_CONFIGS = [
  // Scene 0: Void - pulsing probe/question
  {
    shape: 'probe',
    color: COLORS.violet,
    size: 20,
    glow: true
  },
  // Scene 1: Ignition - spark
  {
    shape: 'spark',
    color: COLORS.amber,
    size: 24,
    glow: true
  },
  // Scene 2: Polvo - tentacle tendril
  {
    shape: 'tendril',
    color: COLORS.teal,
    size: 28,
    glow: true
  },
  // Scene 3: Gnomes - lantern
  {
    shape: 'lantern',
    color: COLORS.boon,
    size: 22,
    glow: true
  },
  // Scene 4: Titan - geode eye
  {
    shape: 'eye',
    color: COLORS.honk,
    size: 26,
    glow: true
  },
  // Scene 5: Ending - spiral
  {
    shape: 'spiral',
    color: COLORS.bone,
    size: 24,
    glow: true
  }
];

export class Cursor extends Entity {
  constructor(config = {}) {
    super({ ...config, layer: 'ui' });

    this.cursorEl = null;
    this.currentScene = 0;
    this.transitionProgress = 0;
    this.isTransitioning = false;

    // Cached SVG elements for reuse
    this._svg = null;
    this._lastShape = null;
    this._lastSize = 0;
  }

  onSpawn(ctx) {
    this.cursorEl = document.getElementById('custom-cursor');
    if (this.cursorEl) {
      // Create reusable SVG element
      this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this._svg.setAttribute('viewBox', '0 0 24 24');
      this._svg.style.overflow = 'visible';

      // Add glow filter once
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <filter id="cursor-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      `;
      this._svg.appendChild(defs);
      this._svg.style.filter = 'url(#cursor-glow)';
      this.cursorEl.appendChild(this._svg);

      this.updateCursorStyle(ctx);
    }
  }

  setScene(sceneIndex, transitioning = false, transitionProgress = 0) {
    this.currentScene = sceneIndex;
    this.isTransitioning = transitioning;
    this.transitionProgress = transitionProgress;
  }

  onUpdate(ctx, dt) {
    // Re-acquire element if lost (e.g., after hot reload)
    if (!this.cursorEl) {
      this.cursorEl = document.getElementById('custom-cursor');
      if (!this.cursorEl) return;

      // Recreate SVG structure if element was re-acquired
      if (!this._svg) {
        this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this._svg.setAttribute('viewBox', '0 0 24 24');
        this._svg.style.overflow = 'visible';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
          <filter id="cursor-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        `;
        this._svg.appendChild(defs);
        this._svg.style.filter = 'url(#cursor-glow)';
        this.cursorEl.appendChild(this._svg);
      }
    }

    // Position cursor
    this.cursorEl.style.left = ctx.input.mouseX + 'px';
    this.cursorEl.style.top = ctx.input.mouseY + 'px';

    // Update visual style
    this.updateCursorStyle(ctx);
  }

  updateCursorStyle(ctx) {
    if (!this.cursorEl || !ctx || !this._svg) return;

    const scene = this.currentScene;
    const config = CURSOR_CONFIGS[scene] || CURSOR_CONFIGS[0];
    const nextConfig = CURSOR_CONFIGS[scene + 1] || config;

    // Interpolate during transitions
    const t = this.isTransitioning ? this.transitionProgress : 0;
    const size = config.size + (nextConfig.size - config.size) * t;

    // Update SVG size
    this._svg.setAttribute('width', size);
    this._svg.setAttribute('height', size);

    const totalTime = ctx.time.total;
    const pulsePhase = (totalTime * 2) % (Math.PI * 2);
    const pulse = 0.8 + Math.sin(pulsePhase) * 0.2;
    const mouseVel = ctx.input.mouseVel || { x: 0, y: 0 };

    // Build SVG content - only rebuild if shape changed or for animated shapes
    let svgContent = '';

    switch (config.shape) {
      case 'probe':
        svgContent = `
          <circle cx="12" cy="12" r="${8 * pulse}" fill="none" stroke="${config.color}" stroke-width="2" opacity="0.7"/>
          <circle cx="12" cy="12" r="3" fill="${config.color}" opacity="0.9"/>
          <text x="12" y="14" text-anchor="middle" fill="${config.color}" font-size="8" opacity="${0.5 + Math.sin(pulsePhase * 2) * 0.3}">?</text>
        `;
        break;

      case 'spark':
        const sparkAngle = totalTime * 3;
        svgContent = `
          <circle cx="12" cy="12" r="${6 * pulse}" fill="${config.color}" opacity="0.6"/>
          ${[0, 1, 2, 3, 4, 5].map(i => {
            const a = sparkAngle + (i / 6) * Math.PI * 2;
            const r1 = 6, r2 = 10 * pulse;
            return `<line x1="${12 + Math.cos(a) * r1}" y1="${12 + Math.sin(a) * r1}"
                          x2="${12 + Math.cos(a) * r2}" y2="${12 + Math.sin(a) * r2}"
                          stroke="${config.color}" stroke-width="1.5" opacity="0.8"/>`;
          }).join('')}
        `;
        break;

      case 'tendril':
        const wave = Math.sin(totalTime * 4) * 3;
        svgContent = `
          <path d="M12,4 Q${14 + wave},8 12,12 Q${10 - wave},16 12,20"
                fill="none" stroke="${config.color}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <circle cx="12" cy="4" r="3" fill="${config.color}" opacity="0.9"/>
          <circle cx="12" cy="20" r="2" fill="${config.color}" opacity="0.6"/>
        `;
        break;

      case 'lantern':
        const flicker = 0.7 + Math.random() * 0.3;
        svgContent = `
          <rect x="9" y="10" width="6" height="10" rx="1" fill="none" stroke="${config.color}" stroke-width="1.5" opacity="0.6"/>
          <circle cx="12" cy="14" r="${4 * flicker}" fill="${config.color}" opacity="${0.5 * flicker}"/>
          <line x1="12" y1="10" x2="12" y2="6" stroke="${config.color}" stroke-width="1.5" opacity="0.6"/>
        `;
        break;

      case 'eye':
        const blink = Math.sin(totalTime * 0.5) > 0.95 ? 0.2 : 1;
        const pupilX = 12 + (mouseVel.x * 0.1);
        const pupilY = 12 + (mouseVel.y * 0.1);
        svgContent = `
          <ellipse cx="12" cy="12" rx="10" ry="${6 * blink}" fill="none" stroke="${config.color}" stroke-width="2" opacity="0.7"/>
          <circle cx="${Math.max(8, Math.min(16, pupilX))}" cy="${Math.max(10, Math.min(14, pupilY))}" r="3" fill="${config.color}" opacity="0.9"/>
        `;
        break;

      case 'spiral':
        const spiralAngle = totalTime * 2;
        let spiralPath = 'M12,12 ';
        for (let i = 0; i < 20; i++) {
          const a = spiralAngle + (i / 20) * Math.PI * 3;
          const r = (i / 20) * 8;
          spiralPath += `L${12 + Math.cos(a) * r},${12 + Math.sin(a) * r} `;
        }
        svgContent = `
          <path d="${spiralPath}" fill="none" stroke="${config.color}" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
        `;
        break;
    }

    // Update content group - find or create the content group
    let contentGroup = this._svg.querySelector('#cursor-content');
    if (!contentGroup) {
      contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      contentGroup.id = 'cursor-content';
      this._svg.appendChild(contentGroup);
    }
    contentGroup.innerHTML = svgContent;
  }

  onDispose(ctx) {
    if (this.cursorEl) {
      this.cursorEl.innerHTML = '';
    }
  }
}

export { CURSOR_CONFIGS };
