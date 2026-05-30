import * as THREE from 'three';
import { Materials } from './Materials';
import { Lighting } from './Lighting';
import { Skybox } from './Skybox';
import { ChaseCamera } from './Camera';
import { Tracks } from './Tracks';
import { Player } from './Player';
import { Obstacles } from './Obstacles';
import { Coins } from './Coins';
import { PostFx } from './PostFx';
import { Store } from '../game/State';
import { InputMux } from '../input/InputMux';
import { CURVES, speedAt, DifficultyCurve } from '../game/Difficulty';
import { Score } from '../game/Score';
import { Revive } from '../game/Revive';
import { CollisionGrid } from '../game/CollisionGrid';

const FIXED_DT = 1 / 60;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class GameScene {
  readonly store: Store;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private materials = new Materials();
  private lighting: Lighting;
  private skybox: Skybox;
  private chase: ChaseCamera;
  private tracks: Tracks;
  private player: Player;
  private grid: CollisionGrid;
  private obstacles: Obstacles;
  private coins: Coins;
  private postFx: PostFx;
  private mux: InputMux;
  private rng = mulberry32(0xc0ffee);
  private accumulator = 0;
  private lastFrameMs = 0;
  private rafHandle = 0;
  private running = false;
  private elapsed = 0;
  private worldDistance = 0;
  private currentSpeed = 0;
  private score = new Score();
  private revive = new Revive();
  private resizeObserver?: ResizeObserver;
  // exposed to e2e via window.__handflow_fps
  private frameCount = 0;
  private fpsTimer = 0;

  constructor(canvas: HTMLCanvasElement, store: Store, mux: InputMux) {
    this.canvas = canvas;
    this.store = store;
    this.mux = mux;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x0a0a0e, 1);

    this.lighting = new Lighting(this.scene);
    this.skybox = new Skybox(this.materials);
    this.scene.add(this.skybox.group);

    this.tracks = new Tracks(this.materials);
    this.scene.add(this.tracks.group);

    this.grid = new CollisionGrid();
    this.obstacles = new Obstacles(this.materials, this.grid);
    this.scene.add(this.obstacles.group);
    this.coins = new Coins(this.materials, this.grid);
    this.scene.add(this.coins.group);

    this.player = new Player(this.materials);
    this.scene.add(this.player.mesh);

    this.chase = new ChaseCamera(canvas.clientWidth / canvas.clientHeight);
    this.postFx = new PostFx(this.renderer);

    this.handleResize();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', this.handleResize);
    }

    this.mux.onIntent((intent) => {
      switch (intent.kind) {
        case 'lane':
          this.player.setLane(intent.lane);
          this.store.set('laneIndex', intent.lane);
          break;
        case 'jump':
          this.player.jump();
          break;
        case 'roll':
          this.player.roll();
          break;
        case 'pause':
          this.store.setPhase(this.store.get('phase') === 'playing' ? 'paused' : 'playing');
          break;
      }
    });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrameMs = performance.now();
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  beginRun() {
    this.player.reset();
    this.tracks.reset();
    this.obstacles.reset();
    this.coins.reset();
    this.grid.clear();
    this.score.reset();
    this.revive.reset();
    this.store.resetRun();
    this.worldDistance = 0;
    this.elapsed = 0;
    this.currentSpeed = this.currentCurve().startSpeed;
    this.score.setGrace(this.currentCurve().comboGraceMs);
    this.store.setPhase('playing');
  }

  private currentCurve(): DifficultyCurve {
    return CURVES[this.store.get('difficulty')];
  }

  private tick = () => {
    if (!this.running) return;
    const now = performance.now();
    let frameDt = (now - this.lastFrameMs) / 1000;
    this.lastFrameMs = now;
    if (frameDt > 0.1) frameDt = 0.1; // clamp huge gaps (tab inactive)

    this.frameCount++;
    this.fpsTimer += frameDt;
    if (this.fpsTimer >= 1) {
      (window as unknown as { __handflow_fps?: number }).__handflow_fps = this.frameCount / this.fpsTimer;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (this.store.get('phase') === 'playing') {
      this.accumulator += frameDt;
      while (this.accumulator >= FIXED_DT) {
        this.updateFixed(FIXED_DT);
        this.accumulator -= FIXED_DT;
      }
    }

    this.chase.follow(this.player.mesh.position);
    // skybox rides the camera so it never parallaxes
    this.skybox.group.position.copy(this.chase.camera.position);
    this.postFx.render(this.scene, this.chase.camera);

    this.rafHandle = requestAnimationFrame(this.tick);
  };

  private updateFixed(dt: number) {
    this.elapsed += dt;
    const curve = this.currentCurve();
    this.currentSpeed = speedAt(curve, this.elapsed);
    const delta = this.currentSpeed * dt;
    this.worldDistance += delta;
    this.store.set('speed', this.currentSpeed);

    this.tracks.advance(delta, this.chase.camera.position.z);
    this.obstacles.advance(delta, this.chase.camera.position.z);
    this.coins.advance(delta, this.chase.camera.position.z, dt, this.player.getLane(), 0);

    const minGap = 6;
    this.obstacles.trySpawn({
      rng: this.rng,
      obstacleDensity: curve.obstacleDensity,
      rampChance: curve.rampChance,
      spawnFrontZ: -50,
      minGap
    });
    this.coins.trySpawnChain({
      rng: this.rng,
      coinDensity: curve.coinDensity,
      spawnFrontZ: -50,
      minGap
    });

    this.player.update(dt);
    const lane = this.player.getLane();
    const coinsPicked = this.coins.collectAround(lane, 0);
    const nowMs = this.elapsed * 1000;
    for (let i = 0; i < coinsPicked; i++) {
      this.score.pickupCoin(nowMs);
    }
    this.score.tick(nowMs);
    this.score.awardDistance(dt, this.currentSpeed * 0.1);

    const hits = this.grid.query(lane, -1.2, 1.2);
    for (const h of hits) {
      if (h.type === 'coin') continue;
      if (h.type === 'ramp' && this.player.altitude() < 0.05) {
        // landing on a ramp gives a free jump
        this.player.jump();
        continue;
      }
      if (h.type === 'barrier' && this.player.isHigh()) continue;
      if (h.type === 'train' && this.player.isLow()) continue;
      this.onHit();
      break;
    }

    const snap = this.score.snapshot();
    this.store.set('score', snap.score);
    this.store.set('combo', snap.combo);
    this.store.set('coins', snap.coins);
    this.store.set('reviveAvailable', this.revive.available());
  }

  private onHit() {
    if (this.revive.available()) {
      const r = this.revive.consume();
      this.score.breakCombo();
      this.obstacles.clearWindow(-r.clearedAheadUnits, 4);
      return;
    }
    this.store.setPhase('gameover');
  }

  private handleResize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.chase.resize(w, h);
    this.postFx.resize(w, h);
  };

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.rafHandle);
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.handleResize);
    this.tracks.dispose();
    this.obstacles.dispose();
    this.coins.dispose();
    this.skybox.dispose();
    this.lighting.dispose();
    this.materials.dispose();
    this.postFx.dispose();
    this.renderer.dispose();
  }
}
