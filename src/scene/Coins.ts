import * as THREE from 'three';
import { LANE_X } from './Tracks';
import { Materials } from './Materials';
import { CollisionGrid, LaneIndex } from '../game/CollisionGrid';

const COIN_POOL_SIZE = 80;
const MAGNET_RADIUS = 1.4;

interface PooledCoin {
  id: number;
  mesh: THREE.Mesh;
  lane: LaneIndex;
  z: number;
  active: boolean;
}

export class Coins {
  readonly group: THREE.Group;
  private pool: PooledCoin[] = [];
  private grid: CollisionGrid;
  private nextId = 100000; // separate id space from obstacles
  private nextSpawnZ = -40;

  private spinPhase = 0;

  constructor(materials: Materials, grid: CollisionGrid) {
    this.group = new THREE.Group();
    this.grid = grid;
    const geom = new THREE.TorusGeometry(0.32, 0.1, 8, 16);
    geom.rotateX(Math.PI / 2);
    const mat = materials.get('coin');
    for (let i = 0; i < COIN_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({ id: -1, mesh, lane: 1, z: 0, active: false });
    }
  }

  advance(delta: number, cameraZ: number, dt: number, playerLane: 0 | 1 | 2, playerZ: number) {
    this.spinPhase += dt * 6;
    for (const c of this.pool) {
      if (!c.active) continue;
      c.mesh.position.z += delta;
      c.z += delta;
      c.mesh.rotation.y = this.spinPhase + c.id * 0.7;
      if (c.z > cameraZ + 4) this.recycle(c);
    }
    this.nextSpawnZ += delta;
    void playerLane;
    void playerZ;
  }

  /** Pick up coins overlapping the player; returns count picked. */
  collectAround(playerLane: 0 | 1 | 2, playerZ: number): number {
    let picked = 0;
    for (const c of this.pool) {
      if (!c.active) continue;
      const dz = c.z - playerZ;
      if (Math.abs(dz) < MAGNET_RADIUS && c.lane === playerLane) {
        picked += 1;
        this.recycle(c);
      } else if (Math.abs(dz) < 0.5 && c.lane === playerLane) {
        picked += 1;
        this.recycle(c);
      }
    }
    return picked;
  }

  trySpawnChain(args: { rng: () => number; coinDensity: number; spawnFrontZ: number; minGap: number }) {
    if (this.nextSpawnZ > args.spawnFrontZ + args.minGap) return;
    const chancePerSlot = (args.coinDensity * args.minGap) / 100;
    if (args.rng() > Math.min(chancePerSlot, 0.95)) {
      this.nextSpawnZ -= args.minGap;
      return;
    }
    const chainLen = 3 + Math.floor(args.rng() * 5);
    const lane = Math.floor(args.rng() * 3) as LaneIndex;
    let z = this.nextSpawnZ;
    for (let i = 0; i < chainLen; i++) {
      const free = this.pool.find((p) => !p.active);
      if (!free) return;
      const id = this.nextId++;
      free.id = id;
      free.lane = lane;
      free.z = z;
      free.active = true;
      free.mesh.visible = true;
      free.mesh.position.set(LANE_X[lane], 1.0, z);
      this.grid.insert({ id, lane, zStart: z - 0.3, zEnd: z + 0.3, type: 'coin' });
      z -= 1.2;
    }
    this.nextSpawnZ = z - args.minGap;
  }

  recycle(c: PooledCoin) {
    if (!c.active) return;
    this.grid.remove(c.id);
    c.active = false;
    c.mesh.visible = false;
    c.id = -1;
  }

  reset() {
    for (const c of this.pool) this.recycle(c);
    this.nextSpawnZ = -40;
  }

  dispose() {
    const seen = new Set<THREE.BufferGeometry>();
    this.pool.forEach((c) => {
      if (!seen.has(c.mesh.geometry)) {
        c.mesh.geometry.dispose();
        seen.add(c.mesh.geometry);
      }
    });
  }
}
