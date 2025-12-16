// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS - @chaingang/core
// ═══════════════════════════════════════════════════════════════════════════

import type p5 from 'p5';

// ─── BASIC TYPES ─────────────────────────────────────────────────────────────

export type P5Instance = p5;
export type P5Graphics = p5.Graphics;

export interface Vector2 {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// ─── INPUT STATE ─────────────────────────────────────────────────────────────

export interface InputState {
  mouseX: number;
  mouseY: number;
  prevMouseX: number;
  prevMouseY: number;
  mouseVel: Vector2;
  mouseSpeed: number;
  mouseStillTime: number;
  mousePressed: boolean;
  keys: Set<string>;
}

// ─── TIME STATE ──────────────────────────────────────────────────────────────

export interface TimeState {
  total: number;
  delta: number;
  frame: number;
}

// ─── EVENT SYSTEM ────────────────────────────────────────────────────────────

export type EventCallback = (data?: unknown) => void;

// ─── ENTITY STATE ────────────────────────────────────────────────────────────

export const EntityState = {
  SPAWNING: 'spawning',
  ACTIVE: 'active',
  DORMANT: 'dormant',
  DISPOSING: 'disposing',
  DISPOSED: 'disposed'
} as const;

export type EntityStateType = typeof EntityState[keyof typeof EntityState];

// ─── ENTITY CONFIG ───────────────────────────────────────────────────────────

export interface EntityConfig {
  id?: string;
  tags?: string[];
  layer?: string;
  transform?: Partial<TransformConfig>;
  userData?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TransformConfig {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
}

// ─── COMPONENT INTERFACES ────────────────────────────────────────────────────

export interface IComponent {
  entity: IEntity | null;
  enabled: boolean;
  onAttach(entity: IEntity): void;
  onDetach(): void;
  update(ctx: IContext, dt: number): void;
  render?(ctx: IContext): void;
}

export interface ITransformComponent extends IComponent, TransformConfig {
  scale: number;
  apply(p5: P5Instance): void;
}

export interface PhysicsConfig {
  velocity?: Vector2;
  acceleration?: Vector2;
  friction?: number;
  mass?: number;
  maxSpeed?: number;
}

export interface IPhysicsComponent extends IComponent {
  velocity: Vector2;
  acceleration: Vector2;
  friction: number;
  mass: number;
  maxSpeed: number;
  applyForce(fx: number, fy: number): void;
  setVelocity(vx: number, vy: number): void;
}

export interface VisualConfig {
  shape?: 'ellipse' | 'rect' | 'triangle' | 'custom';
  color?: string;
  size?: number;
  sizeY?: number | null;
  strokeColor?: string | null;
  strokeWeight?: number;
  customRender?: ((p5: P5Instance, visual: IVisualComponent, entity: IEntity) => void) | null;
}

export interface IVisualComponent extends IComponent {
  shape: string;
  color: string;
  size: number;
  sizeY: number | null;
  strokeColor: string | null;
  strokeWeight: number;
}

export interface LifespanConfig {
  maxLife?: number;
  lifespan?: number;
  fadeIn?: number;
  fadeOut?: number;
  autoDispose?: boolean;
}

export interface ILifespanComponent extends IComponent {
  maxLife: number;
  life: number;
  fadeIn: number;
  fadeOut: number;
  autoDispose: boolean;
  progress: number;
  normalized: number;
  isDead(): boolean;
  reset(): void;
}

// ─── BEHAVIOR INTERFACES ─────────────────────────────────────────────────────

export type BehaviorCondition = (entity: IEntity, ctx: IContext) => boolean;

export interface BehaviorConfig {
  id?: string;
  priority?: number;
  enabled?: boolean;
  conditions?: BehaviorCondition[];
}

export interface IBehavior {
  id: string;
  priority: number;
  enabled: boolean;
  conditions: BehaviorCondition[];
  shouldApply(entity: IEntity, ctx: IContext): boolean;
  onAttach(entity: IEntity): void;
  onUpdate(entity: IEntity, ctx: IContext, dt: number): void;
  onRender(entity: IEntity, ctx: IContext): void;
  onDetach(entity: IEntity): void;
  when(condition: BehaviorCondition): this;
  whenMouseNear(radius: number): this;
  whenHasTag(tag: string): this;
  whenAfter(time: number): this;
  whenMouseStill(duration?: number): this;
  whenMouseFast(threshold?: number): this;
}

// ─── ENTITY INTERFACE ────────────────────────────────────────────────────────

export interface IEntity {
  id: string;
  tags: Set<string>;
  layer: string;
  state: EntityStateType;
  transform: ITransformComponent;
  parent: IEntity | null;
  children: IEntity[];
  userData: Record<string, unknown>;

  // Component management
  addComponent(name: string, component: IComponent): this;
  removeComponent(name: string): this;
  getComponent<T extends IComponent>(name: string): T | undefined;
  hasComponent(name: string): boolean;

  // Behavior management
  addBehavior(behavior: IBehavior): this;
  removeBehavior(behaviorOrId: IBehavior | string): this;
  getBehavior(id: string): IBehavior | undefined;
  hasBehavior(idOrClass: string | (new (...args: unknown[]) => IBehavior)): boolean;

  // Tag management
  addTag(tag: string): this;
  removeTag(tag: string): this;
  hasTag(tag: string): boolean;

  // Parent/child relationships
  setParent(parent: IEntity | null): this;
  addChild(child: IEntity): this;
  removeChild(child: IEntity): this;

  // Lifecycle hooks
  onSpawn(ctx: IContext): void;
  onUpdate(ctx: IContext, dt: number): void;
  onRender(ctx: IContext): void;
  onDormant(ctx: IContext): void;
  onWake(ctx: IContext): void;
  onDispose(ctx: IContext): void;

  // State transitions
  activate(): void;
  sleep(): void;
  wake(): void;
  dispose(): void;

  // Utility
  getWorldPosition(): Vector2;
  distanceTo(target: IEntity | number, y?: number): number;
}

// ─── ENTITY MANAGER INTERFACE ────────────────────────────────────────────────

export interface IEntityManager {
  spawn<T extends IEntity>(
    EntityClass: new (config?: EntityConfig) => T,
    config?: EntityConfig
  ): T;
  get(id: string): IEntity | undefined;
  getAll(): IEntity[];
  getActive(): IEntity[];
  getByTag(tag: string): IEntity[];
  getByTags(...tags: string[]): IEntity[];
  getByLayer(layer: string): IEntity[];
  getInRadius(x: number, y: number, radius: number, tag?: string | null): IEntity[];
  getNearest(x: number, y: number, tag?: string | null): IEntity | null;
  count(tag?: string | null): number;

  markDormant(tagOrIds: string | string[]): void;
  wake(tagOrIds: string | string[]): void;
  disposeByTag(tag: string): void;
  dispose(entity: IEntity): void;
  disposeAll(): void;

  update(ctx: IContext, dt: number): void;

  on(event: string, callback: EventCallback): () => void;
  off(event: string, callback: EventCallback): void;
}

// ─── CONTEXT INTERFACE ───────────────────────────────────────────────────────

export interface IContext {
  p5: P5Instance;
  width: number;
  height: number;
  input: InputState;
  time: TimeState;
  entities: IEntityManager;
  timeline: ITimeline | null;
  choreography: IChoreography | null;
  audio: IAudioEngine | null;
  audioReactor: IAudioReactor | null;
  render: IRenderPipeline | null;
  center: Vector2;

  // Event bus
  on(event: string, callback: EventCallback): () => void;
  off(event: string, callback: EventCallback): void;
  emit(event: string, data?: unknown): void;

  // Utility methods
  isInBounds(x: number, y: number, margin?: number): boolean;
  randomPoint(margin?: number): Vector2;
  mouseDistanceFrom(x: number, y: number): number;
  angleToMouse(x: number, y: number): number;

  // Lifecycle
  update(dt: number): void;
  init(p5: P5Instance): void;
}

// ─── TIMELINE INTERFACES ─────────────────────────────────────────────────────

export type EasingFunction = (t: number) => number;
export type CueCallback = (ctx: IContext | null, timeline: ITimeline) => void;

export interface CueConfig {
  name?: string;
  once?: boolean;
}

export interface ICue {
  time: number;
  callback: CueCallback;
  name: string;
  once: boolean;
  fired: boolean;
  enabled: boolean;
  reset(): void;
}

export interface TrackConfig {
  name?: string;
  target?: object | null;
  property?: string | null;
  loop?: boolean;
  pingPong?: boolean;
}

export interface IKeyframe {
  time: number;
  value: unknown;
  easing: EasingFunction;
}

export interface ITrack {
  name: string;
  target: object | null;
  property: string | null;
  keyframes: IKeyframe[];
  enabled: boolean;
  loop: boolean;
  pingPong: boolean;
  duration: number;

  addKeyframe(time: number, value: unknown, easing?: string | EasingFunction): this;
  at(time: number, value: unknown, easing?: string | EasingFunction): this;
  removeKeyframe(time: number): this;
  clear(): this;
  getValue(time: number): unknown;
  update(time: number): void;
  setTarget(target: object, property: string): this;
}

export interface ITimeline {
  time: number;
  duration: number;
  playbackRate: number;
  playing: boolean;
  loop: boolean;
  progress: number;
  isComplete: boolean;

  addTrack(name: string, trackOrConfig: ITrack | TrackConfig): ITrack;
  getTrack(name: string): ITrack | undefined;
  removeTrack(name: string): void;
  animate(target: object, property: string): ITrack;

  addCue(time: number, callback: CueCallback, config?: CueConfig): ICue;
  at(time: number, callback: CueCallback, config?: CueConfig): ICue;
  removeCue(cue: ICue): void;
  getCue(name: string): ICue | undefined;

  play(): this;
  pause(): this;
  stop(): this;
  toggle(): this;
  seek(time: number): this;
  setPlaybackRate(rate: number): this;
  reset(): this;

  update(dt: number, ctx?: IContext | null): void;
}

// ─── CHOREOGRAPHY INTERFACES ─────────────────────────────────────────────────

export interface SegmentConfig<TState = Record<string, unknown>> {
  name: string;
  duration?: number;
  flexible?: boolean;
  minDuration?: number;
  maxDuration?: number;
  setup?: (ctx: IContext, segment: ISegment<TState>) => void;
  update?: (ctx: IContext, segment: ISegment<TState>, dt: number) => void;
  render?: ((ctx: IContext, segment: ISegment<TState>) => void) | null;
  teardown?: (ctx: IContext, segment: ISegment<TState>) => void;
  canExit?: (ctx: IContext) => boolean;
}

export interface ISegment<TState = Record<string, unknown>> {
  name: string;
  duration: number;
  flexible: boolean;
  minDuration: number;
  maxDuration: number;
  active: boolean;
  elapsed: number;
  extendedTime: number;
  state: TState;
  timeline: ITimeline;
  progress: number;
  isComplete: boolean;

  setup(ctx: IContext): void;
  update(ctx: IContext, dt: number): void;
  render(ctx: IContext): void;
  teardown(ctx: IContext): void;
  getProgress(): number;
  extend(time: number): void;
}

export interface IChoreography {
  segments: Map<string, ISegment>;
  sequence: string[];
  currentIndex: number;
  currentSegment: ISegment | null;
  currentName: string | null;
  playing: boolean;
  autoAdvance: boolean;
  transitioning: boolean;
  transitionProgress: number;
  progress: number;
  isComplete: boolean;

  addSegment(config: SegmentConfig | ISegment): ISegment;
  getSegment(name: string): ISegment | undefined;
  setSequence(names: string[]): this;

  start(): this;
  stop(): this;
  pause(): this;
  resume(): this;
  goTo(indexOrName: number | string): this;
  next(): this;
  previous(): this;

  update(ctx: IContext, dt: number): void;
  render(ctx: IContext): void;
}

// ─── RENDER PIPELINE INTERFACES ──────────────────────────────────────────────

export interface LayerConfig {
  name?: string;
  order?: number;
  blendMode?: string;
  opacity?: number;
  visible?: boolean;
}

export interface ILayer {
  name: string;
  order: number;
  blendMode: string;
  opacity: number;
  visible: boolean;
  graphics: P5Graphics;

  begin(): P5Graphics;
  end(): void;
  clear(): void;
  render(target: P5Graphics): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

export interface ILayerManager {
  create(name: string, config?: LayerConfig): ILayer;
  get(name: string): ILayer | undefined;
  has(name: string): boolean;
  remove(name: string): void;
  setOrder(name: string, order: number): void;
  setBlendMode(name: string, blendMode: string): void;
  setOpacity(name: string, opacity: number): void;
  setVisible(name: string, visible: boolean): void;
  getSorted(): ILayer[];
  resize(width: number, height: number): void;
  clearAll(): void;
  renderAll(target: P5Graphics): void;
  dispose(): void;
  createStandardLayers(): void;
}

export interface EffectConfig {
  name?: string;
  enabled?: boolean;
}

export interface IEffect {
  name: string;
  enabled: boolean;
  p5: P5Instance | null;
  composer: IEffectComposer | null;
  render(source: P5Graphics, target: P5Graphics): void;
}

export interface IEffectComposer {
  effects: IEffect[];
  enabled: boolean;

  addEffect(effect: IEffect): this;
  removeEffect(effect: IEffect): this;
  getEffect(name: string): IEffect | undefined;
  resize(width: number, height: number): void;
  render(source: P5Graphics, target: P5Instance | P5Graphics): void;
  dispose(): void;
}

export interface IRenderPipeline {
  layers: ILayerManager;
  effects: IEffectComposer;
  enabled: boolean;

  getLayer(name: string): ILayer | undefined;
  createLayer(name: string, config?: LayerConfig): ILayer;

  addEffect(effect: IEffect): this;
  getEffect(name: string): IEffect | undefined;

  beginLayer(name: string): P5Graphics | P5Instance;
  endLayer(name: string): void;
  render(ctx: IContext): void;
  renderEntities(ctx: IContext): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

// ─── AUDIO INTERFACES ────────────────────────────────────────────────────────

export interface ToneConfig {
  type?: OscillatorType;
  volume?: number;
  attack?: number;
  release?: number;
}

export interface NoiseConfig {
  volume?: number;
  frequency?: number;
  Q?: number;
}

export interface IAudioGenerator {
  audioEngine: IAudioEngine | null;
  init(audioEngine: IAudioEngine): void;
  update(ctx: IContext, dt: number): void;
  dispose(): void;
}

export interface IAudioEngine {
  audioContext: AudioContext | null;
  masterGain: GainNode | null;
  initialized: boolean;
  masterVolume: number;
  muted: boolean;
  currentTime: number;

  init(): Promise<boolean>;
  setMasterVolume(volume: number): void;
  mute(): void;
  unmute(): void;
  toggleMute(): void;
  setFilterFrequency(frequency: number): void;

  addGenerator(name: string, generator: IAudioGenerator): IAudioGenerator;
  getGenerator(name: string): IAudioGenerator | undefined;
  removeGenerator(name: string): void;

  createOscillator(type?: OscillatorType, frequency?: number): OscillatorNode | null;
  createGain(value?: number): GainNode | null;
  createFilter(type?: BiquadFilterType, frequency?: number, Q?: number): BiquadFilterNode | null;
  connectToMaster(node: AudioNode): void;

  playTone(frequency: number, duration?: number, config?: ToneConfig): void;
  playNoise(duration?: number, config?: NoiseConfig): void;

  update(ctx: IContext, dt: number): void;
  dispose(): void;
}

export type AudioEventCallback = (data: Record<string, unknown>, audio: IAudioEngine) => void;

export interface ContinuousMappingConfig {
  source: (ctx: IContext) => number;
  target: (value: number, audio: IAudioEngine, ctx: IContext) => void;
  min?: number;
  max?: number;
  smoothing?: number;
}

export interface IAudioReactor {
  audioEngine: IAudioEngine;
  enabled: boolean;

  map(eventName: string, callback: AudioEventCallback): this;
  mapContinuous(config: ContinuousMappingConfig): this;
  trigger(eventName: string, data?: Record<string, unknown>): void;
  update(ctx: IContext, dt: number): void;

  mapParticleSpawn(): this;
  mapMouseToFilter(): this;
  mapStillnessToVolume(): this;

  clear(): void;
}

// ─── COLOR UTILITIES ─────────────────────────────────────────────────────────

export interface ColorPalette {
  [key: string]: string;
}

export interface ColorUtils {
  hexToRgb(hex: string): RGB;
  lerpColor(hex1: string, hex2: string, t: number): string;
  colorWithAlpha(p5: P5Instance, hex: string, alpha: number): p5.Color;
  getRgb(hex: string): RGB;
}
