// ═══════════════════════════════════════════════════════════════════════════
// APP - Main application entry point
// Orchestrates all subsystems using the new architecture
// ═══════════════════════════════════════════════════════════════════════════

import p5 from 'p5';
import { Context } from './core/Context.js';
import { COLORS, hexToRgb } from './config/colors.js';
// Note: Particle/behaviors imports kept for potential future use but demo particles disabled
import { Particle, ParticleEmitter } from './entities/Particle.js';
import {
  NoiseDriftBehavior,
  CenterPullBehavior,
  MouseRepelBehavior,
  GatherOnStillMouseBehavior,
  WrapBoundsBehavior,
  PulseBehavior,
  GlowBehavior
} from './behaviors/index.js';
import { RenderPipeline, VignetteEffect, BloomEffect } from './render/index.js';
import { Timeline, Choreography } from './timeline/index.js';
import { AudioEngine, AudioReactor, DroneGenerator, ChimeGenerator } from './audio/index.js';
import {
  voidSegment,
  ignitionSegment,
  polvoSegment,
  gnomesSegment,
  titanSegment,
  endingSegment,
  defaultSequence
} from './segments/index.js';
import { ProgressBar, EpisodeTitle, NarrativeText, Cursor } from './entities/ui/index.js';

class App {
  constructor() {
    this.ctx = null;
    this.p5Instance = null;
    this.audioInitialized = false;
    this.experienceStarted = false;
  }

  start() {
    const app = this;

    const sketch = (p) => {
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.colorMode(p.RGB, 255, 255, 255, 255);
        p.noiseSeed(42);

        // Initialize context
        app.ctx = new Context(p);
        app.ctx.init(p);

        // Initialize render pipeline with effects
        app.ctx.render = new RenderPipeline(p);
        // NOTE: BloomEffect disabled - loadPixels/updatePixels + 3 blur passes murders FPS
        // app.ctx.render.addEffect(new BloomEffect({ threshold: 0.8, intensity: 0.2, radius: 4 }));
        app.ctx.render.addEffect(new VignetteEffect({ intensity: 0.5, size: 0.7 }));

        // Initialize timeline
        app.ctx.timeline = new Timeline();

        // Initialize audio engine
        app.ctx.audio = new AudioEngine({ masterVolume: 0.5 });
        app.ctx.audioReactor = new AudioReactor(app.ctx.audio);

        // Initialize choreography with segments
        app.ctx.choreography = new Choreography(app.ctx, {
          onSegmentStart: (segment, ctx) => {
            console.log(`Segment started: ${segment.name}`);
          },
          onComplete: () => {
            console.log('Experience complete');
          }
        });

        // Register all segments
        app.ctx.choreography.addSegment(voidSegment);
        app.ctx.choreography.addSegment(ignitionSegment);
        app.ctx.choreography.addSegment(polvoSegment);
        app.ctx.choreography.addSegment(gnomesSegment);
        app.ctx.choreography.addSegment(titanSegment);
        app.ctx.choreography.addSegment(endingSegment);
        app.ctx.choreography.setSequence(defaultSequence);

        // Initialize cursor
        app.initCursor();

        // Spawn UI entities
        app.spawnUIEntities();

        // NOTE: Demo particles removed - void segment handles particle spawning
        // app.spawnDemoParticles();

        console.log('EP1 Architecture initialized');
      };

      p.draw = () => {
        const dt = p.deltaTime / 1000;

        // Update context (timing, input)
        app.ctx.update(dt);

        // Update entities
        app.ctx.entities.update(app.ctx, dt);

        // Update timeline and choreography
        app.ctx.timeline?.update(dt, app.ctx);
        app.ctx.choreography?.update(app.ctx, dt);

        // Update UI with choreography progress
        app.updateUI();

        // Update audio
        app.ctx.audio?.update(app.ctx, dt);
        app.ctx.audioReactor?.update(app.ctx, dt);

        // Render
        app.render(p);

        // Note: Cursor entity updates itself through the entity system
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        app.ctx.width = p.width;
        app.ctx.height = p.height;
        app.ctx.render?.resize(p.width, p.height);
        app.ctx.emit('resize', { width: p.width, height: p.height });
      };

      p.mousePressed = () => {
        // Initialize audio on first interaction
        app.initAudioOnInteraction();
        app.ctx.emit('mousePressed', { x: p.mouseX, y: p.mouseY });
      };

      p.touchStarted = () => {
        app.initAudioOnInteraction();
        app.ctx.emit('touchStarted', { x: p.mouseX, y: p.mouseY });
        return false;
      };
    };

    this.p5Instance = new p5(sketch);
  }

  render(p) {
    // Render via pipeline if available
    if (this.ctx.render) {
      // Draw background to background layer
      const bgLayer = this.ctx.render.beginLayer('background');
      this.drawBackgroundTo(bgLayer);
      this.ctx.render.endLayer('background');

      // Render entities to their layers
      this.ctx.render.renderEntities(this.ctx);

      // Render segment-specific visuals
      this.ctx.choreography?.render(this.ctx);

      // Composite and apply effects
      this.ctx.render.render(this.ctx);
    } else {
      // Direct rendering fallback
      this.drawBackground(p);
      this.renderEntities(p);

      // Render segment-specific visuals and transitions
      this.ctx.choreography?.render(this.ctx);

      this.drawVignette(p);
    }

    // Draw debug info (on top, not affected by effects)
    this.drawDebug(p);
  }

  renderEntities(p) {
    // Group entities by layer
    const layers = new Map();

    for (const entity of this.ctx.entities.getActive()) {
      const layer = entity.layer || 'world';
      if (!layers.has(layer)) {
        layers.set(layer, []);
      }
      layers.get(layer).push(entity);
    }

    // Define layer order
    const layerOrder = ['background', 'world', 'particles', 'characters', 'effects', 'ui'];

    // Render each layer
    for (const layerName of layerOrder) {
      const entities = layers.get(layerName) || [];

      // Some layers use additive blending
      if (layerName === 'particles' || layerName === 'effects') {
        p.push();
        p.blendMode(p.ADD);
        for (const entity of entities) {
          entity._render(this.ctx);
        }
        p.pop();
      } else {
        for (const entity of entities) {
          entity._render(this.ctx);
        }
      }
    }
  }

  drawBackground(p) {
    this.drawBackgroundTo(p);
  }

  drawBackgroundTo(g) {
    // Gradient background using canvas gradient (much faster than line-by-line)
    const gradient = g.drawingContext.createLinearGradient(0, 0, 0, this.ctx.height);
    gradient.addColorStop(0, 'rgb(5, 3, 8)');
    gradient.addColorStop(1, 'rgb(11, 7, 20)'); // Interpolated at 0.3 blend

    g.drawingContext.fillStyle = gradient;
    g.drawingContext.fillRect(0, 0, this.ctx.width, this.ctx.height);
  }

  drawVignette(p) {
    p.push();
    p.noStroke();

    const gradient = p.drawingContext.createRadialGradient(
      this.ctx.width / 2, this.ctx.height / 2, 0,
      this.ctx.width / 2, this.ctx.height / 2, Math.max(this.ctx.width, this.ctx.height) * 0.7
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0.15)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');

    p.drawingContext.fillStyle = gradient;
    p.rect(0, 0, this.ctx.width, this.ctx.height);
    p.pop();
  }

  drawDebug(p) {
    if (this.ctx.time.frame % 60 !== 0) return; // Only every second

    p.push();
    p.fill(255, 100);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);

    const fps = Math.round(p.frameRate());
    const entityCount = this.ctx.entities.count();
    const time = this.ctx.time.total.toFixed(1);

    p.text(`FPS: ${fps} | Entities: ${entityCount} | Time: ${time}s`, 10, 10);
    p.pop();
  }

  initCursor() {
    // Hide default browser cursor - the Cursor entity handles custom cursor rendering
    document.body.style.cursor = 'none';
  }

  spawnUIEntities() {
    // Spawn progress bar
    this.progressBar = this.ctx.entities.spawn(ProgressBar, {
      tags: ['ui-progress'],
      segmentNames: defaultSequence
    });

    // Spawn episode title (shows at start)
    this.episodeTitle = this.ctx.entities.spawn(EpisodeTitle, {
      tags: ['ui-title'],
      mainTitle: 'The Thirteenth Turning',
      subtitle: 'episode one'
    });

    // Spawn narrative text system
    this.narrativeText = this.ctx.entities.spawn(NarrativeText, {
      tags: ['ui-narrative'],
      onHonk: () => this.ctx.audio?.playHonk()
    });

    // Spawn custom cursor
    this.cursor = this.ctx.entities.spawn(Cursor, {
      tags: ['ui-cursor']
    });

    // Connect narrative to choreography progress
    this.ctx.choreography.onSegmentStart = (segment, ctx) => {
      console.log(`Segment started: ${segment.name}`);
      // Update narrative scene index
      const sceneIndex = defaultSequence.indexOf(segment.name);
      if (sceneIndex >= 0 && this.narrativeText) {
        this.narrativeText.currentScene = sceneIndex;
      }
    };

    console.log('UI entities spawned');
  }

  async initAudioOnInteraction() {
    if (this.audioInitialized) return;

    // Initialize audio engine
    const success = await this.ctx.audio?.init();
    if (success) {
      this.audioInitialized = true;

      // Add audio generators
      this.ctx.audio.addGenerator('drone', new DroneGenerator({
        baseFrequency: 55,
        volume: 0.08
      }));
      this.ctx.audio.addGenerator('chime', new ChimeGenerator({
        volume: 0.04
      }));

      // Setup audio reactive mappings
      this.ctx.audioReactor.mapMouseToFilter();
      this.ctx.audioReactor.mapParticleSpawn();

      // Start the choreography on first interaction
      if (!this.experienceStarted) {
        this.experienceStarted = true;
        this.ctx.choreography.start();
        console.log('Experience started');
      }
    }
  }

  updateUI() {
    const choreo = this.ctx.choreography;
    if (!choreo || !choreo.currentSegment) return;

    // Get current scene index and progress
    const sceneIndex = choreo.currentIndex;
    const sceneProgress = choreo.currentSegment.getProgress?.() || 0;
    const totalProgress = choreo.progress;

    // Update progress bar
    if (this.progressBar) {
      this.progressBar.setProgress(totalProgress, sceneIndex);
    }

    // Update narrative text with scene progress
    if (this.narrativeText) {
      this.narrativeText.setSceneProgress(sceneIndex, sceneProgress);
    }

    // Update cursor scene and transition state
    if (this.cursor) {
      this.cursor.setScene(sceneIndex, choreo.transitioning, choreo.transitionProgress);
    }

    // Episode title manages itself via elapsed time - no manual update needed
  }

  spawnDemoParticles() {
    const p = this.ctx.p5;

    // Spawn a particle emitter at center with composed behaviors
    this.ctx.entities.spawn(ParticleEmitter, {
      x: this.ctx.width / 2,
      y: this.ctx.height / 2,
      spawnArea: { width: this.ctx.width * 0.8, height: this.ctx.height * 0.8 },
      burstCount: 500,
      continuous: false,
      particleConfig: {
        color: () => {
          // Random color from palette
          const colors = [COLORS.violet, COLORS.honk, COLORS.magenta, COLORS.blush];
          return colors[Math.floor(Math.random() * colors.length)];
        },
        size: () => 2 + Math.random() * 4,
        velocity: () => ({
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2
        })
      },
      behaviors: [
        NoiseDriftBehavior,
        CenterPullBehavior,
        MouseRepelBehavior,
        GatherOnStillMouseBehavior,
        WrapBoundsBehavior,
        PulseBehavior,
        GlowBehavior
      ]
    });

    console.log('Demo particles spawned:', this.ctx.entities.count());
  }
}

// ─── BOOTSTRAP ──────────────────────────────────────────────────────────────

const app = new App();
app.start();

export { app };
