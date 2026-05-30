// Object-pooled spawner: pool is allocated once, no `new` inside update().

import * as THREE from 'three';
import { LANE_X, TILE_LENGTH } from './Tracks';
import { Materials } from './Materials';
import { CollisionGrid, LaneIndex } from '../game/CollisionGrid';

export type ObstacleKind = 'barrier' | 'train' | 'ramp';

interface PooledObstacle {
  id: number;
  mesh: THREE.Mesh;
  kind: ObstacleKind;
  lane: LaneIndex;
  zStart: number;
  zEnd: number;
  active: boolean;
}

const POOL_SIZE = 60;

export class Obstacles {
  readonly group: THREE.Group;
  private pool: PooledObstacle[] = [];
  private grid: CollisionGrid;
  private nextId = 1;
  private nextSpawnZ = -60;

  constructor(materials: Materials, grid: CollisionGrid) {
    this.group = new THREE.Group();
    this.grid = grid;

    const barrierGeom = new THREE.BoxGeometry(2.0, 1.0, 0.6);
    const trainGeom = new THREE.BoxGeometry(2.0, 1.8, TILE_LENGTH * 0.8);
    const rampGeom = new THREE.BoxGeometry(2.0, 0.6, 3.2);

    for (let i = 0; i < POOL_SIZE; i++) {
      // round-robin kinds so every type starts with inventory
      const kind: ObstacleKind = (['barrier', 'train', 'ramp'] as ObstacleKind[])[i % 3];
      const geom = kind === 'barrier' ? barrierGeom : kind === 'train' ? trainGeom : rampGeom;
      const mat = materials.get(kind);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.visible = false;
      mesh.userData.id = -1;
      this.group.add(mesh);
      this.pool.push({ id: -1, mesh, kind, lane: 1, zStart: 0, zEnd: 0, active: false });
    }
  }

  advance(delta: number, cameraZ: number) {
    for (const o of this.pool) {
      if (!o.active) continue;
      o.mesh.position.z += delta;
      o.zStart += delta;
      o.zEnd += delta;
      if (o.zStart > cameraZ + 6) {
        this.recycle(o);
      }
    }
    this.nextSpawnZ += delta;
  }

  /** Spawn at most one obstacle ahead of the player this slot. */
  trySpawn(args: {
    rng: () => number;
    obstacleDensity: number;
    rampChance: number;
    spawnFrontZ: number;
    minGap: number;
  }): PooledObstacle | null {
    if (this.nextSpawnZ > args.spawnFrontZ + args.minGap) return null;

    // density is per 100 units → convert to per-slot probability
    const chancePerSlot = (args.obstacleDensity * args.minGap) / 100;
    if (args.rng() > Math.min(chancePerSlot, 0.95)) {
      this.nextSpawnZ -= args.minGap;
      return null;
    }

    const free = this.pool.find((p) => !p.active);
    if (!free) return null;

    const lane: LaneIndex = (Math.floor(args.rng() * 3) as LaneIndex);
    const kind: ObstacleKind = args.rng() < args.rampChance ? 'ramp' : args.rng() < 0.4 ? 'train' : 'barrier';
    const id = this.nextId++;
    const z = this.nextSpawnZ;
    let length = 0.6;
    let height = 0.5;
    if (kind === 'train') length = TILE_LENGTH * 0.8;
    if (kind === 'ramp') { length = 3.2; height = 0.3; }
    if (kind === 'barrier') { length = 0.6; height = 0.5; }

    const targetGeom =
      kind === 'barrier' ? new THREE.BoxGeometry(2.0, 1.0, 0.6) :
      kind === 'train' ? new THREE.BoxGeometry(2.0, 1.8, TILE_LENGTH * 0.8) :
      new THREE.BoxGeometry(2.0, 0.6, 3.2);
    // only reassign on actual kind change — keeps allocation count low
    if (free.kind !== kind) {
      free.mesh.geometry.dispose();
      free.mesh.geometry = targetGeom;
      free.kind = kind;
    } else {
      targetGeom.dispose();
    }

    free.id = id;
    free.lane = lane;
    free.zStart = z - length / 2;
    free.zEnd = z + length / 2;
    free.active = true;
    free.mesh.visible = true;
    free.mesh.position.set(LANE_X[lane], height, z);
    free.mesh.userData.id = id;

    this.grid.insert({ id, lane, zStart: free.zStart, zEnd: free.zEnd, type: kind });

    this.nextSpawnZ = z - args.minGap;
    return free;
  }

  recycle(o: PooledObstacle) {
    if (!o.active) return;
    this.grid.remove(o.id);
    o.active = false;
    o.mesh.visible = false;
    o.id = -1;
  }

  clearWindow(zStart: number, zEnd: number) {
    for (const o of this.pool) {
      if (o.active && o.zStart >= zStart && o.zEnd <= zEnd) {
        this.recycle(o);
      }
    }
  }

  reset() {
    for (const o of this.pool) this.recycle(o);
    this.nextSpawnZ = -60;
  }

  dispose() {
    this.pool.forEach((o) => o.mesh.geometry.dispose());
  }
}
