import * as THREE from 'three';
import { LANE_X } from './Tracks';
import { Materials } from './Materials';

const JUMP_HEIGHT = 2.6;
const JUMP_DURATION = 0.55;
const ROLL_DURATION = 0.45;
const LANE_SNAP_LERP = 0.22;

export type PlayerState = 'run' | 'jump' | 'roll';

export class Player {
  readonly mesh: THREE.Group;
  readonly bodyMesh: THREE.Mesh;
  private targetLane: 0 | 1 | 2 = 1;
  private currentLaneX: number = LANE_X[1];
  private state: PlayerState = 'run';
  private stateTimer = 0;
  private baseY = 0.8;
  // pre-allocated to avoid per-frame GC
  readonly box = new THREE.Box3();
  private boxMin = new THREE.Vector3();
  private boxMax = new THREE.Vector3();

  constructor(materials: Materials) {
    this.mesh = new THREE.Group();
    const geom = new THREE.CapsuleGeometry(0.4, 0.9, 4, 12);
    this.bodyMesh = new THREE.Mesh(geom, materials.get('player'));
    this.bodyMesh.position.y = this.baseY;
    this.mesh.add(this.bodyMesh);
    const glowGeom = new THREE.CircleGeometry(0.7, 24);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.18 });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.02;
    this.mesh.add(glow);
  }

  setLane(lane: 0 | 1 | 2) {
    this.targetLane = lane;
  }

  jump() {
    if (this.state === 'jump') return;
    this.state = 'jump';
    this.stateTimer = 0;
  }

  roll() {
    if (this.state === 'roll' || this.state === 'jump') return;
    this.state = 'roll';
    this.stateTimer = 0;
  }

  getState(): PlayerState {
    return this.state;
  }

  getLane(): 0 | 1 | 2 {
    return this.targetLane;
  }

  /** Step local-frame motion forward by `dt` seconds. */
  update(dt: number) {
    const targetX = LANE_X[this.targetLane];
    this.currentLaneX += (targetX - this.currentLaneX) * LANE_SNAP_LERP;
    this.mesh.position.x = this.currentLaneX;

    if (this.state === 'jump') {
      this.stateTimer += dt;
      const t = this.stateTimer / JUMP_DURATION;
      if (t >= 1) {
        this.state = 'run';
        this.bodyMesh.position.y = this.baseY;
      } else {
        // 4t(1-t) peaks at 1 at t=0.5
        const arc = 4 * t * (1 - t);
        this.bodyMesh.position.y = this.baseY + arc * JUMP_HEIGHT;
        this.bodyMesh.scale.set(1, 1, 1);
      }
    } else if (this.state === 'roll') {
      this.stateTimer += dt;
      const t = this.stateTimer / ROLL_DURATION;
      if (t >= 1) {
        this.state = 'run';
        this.bodyMesh.scale.set(1, 1, 1);
        this.bodyMesh.position.y = this.baseY;
      } else {
        this.bodyMesh.scale.set(1.15, 0.45, 1.15);
        this.bodyMesh.position.y = this.baseY - 0.25;
      }
    } else {
      this.bodyMesh.scale.set(1, 1, 1);
      this.bodyMesh.position.y = this.baseY;
    }

    this.boxMin.set(this.mesh.position.x - 0.5, this.bodyMesh.position.y - 0.6, -0.5);
    this.boxMax.set(this.mesh.position.x + 0.5, this.bodyMesh.position.y + 0.6, 0.5);
    this.box.min.copy(this.boxMin);
    this.box.max.copy(this.boxMax);
  }

  altitude(): number {
    return this.bodyMesh.position.y - this.baseY;
  }

  isLow(): boolean {
    return this.state === 'roll';
  }

  isHigh(): boolean {
    return this.state === 'jump' && this.altitude() > 0.8;
  }

  reset() {
    this.targetLane = 1;
    this.currentLaneX = LANE_X[1];
    this.state = 'run';
    this.stateTimer = 0;
    this.bodyMesh.position.y = this.baseY;
    this.bodyMesh.scale.set(1, 1, 1);
    this.mesh.position.set(LANE_X[1], 0, 0);
  }
}
