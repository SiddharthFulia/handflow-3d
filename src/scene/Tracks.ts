// Fixed pool of tile meshes recycled by sliding back-most to front — no
// per-frame allocations.

import * as THREE from 'three';
import { Materials } from './Materials';

export const LANE_WIDTH = 2.4;
export const LANE_X: ReadonlyArray<number> = [-LANE_WIDTH, 0, LANE_WIDTH];
export const TRACK_WIDTH = LANE_WIDTH * 3 + 0.8;
export const TILE_LENGTH = 16;

export class Tracks {
  readonly group: THREE.Group;
  private tiles: THREE.Mesh[] = [];
  private rails: THREE.Mesh[] = [];
  private materials: Materials;
  private tileCount: number;

  constructor(materials: Materials, tileCount = 18) {
    this.materials = materials;
    this.tileCount = tileCount;
    this.group = new THREE.Group();

    const tileGeom = new THREE.BoxGeometry(TRACK_WIDTH, 0.2, TILE_LENGTH);
    const railGeom = new THREE.BoxGeometry(0.1, 0.1, TILE_LENGTH);

    for (let i = 0; i < tileCount; i++) {
      const mat = this.materials.get(i % 2 === 0 ? 'trackA' : 'trackB');
      const tile = new THREE.Mesh(tileGeom, mat);
      tile.position.set(0, 0, -i * TILE_LENGTH);
      tile.receiveShadow = false;
      this.tiles.push(tile);
      this.group.add(tile);

      const railMat = this.materials.get('rail');
      const r1 = new THREE.Mesh(railGeom, railMat);
      const r2 = new THREE.Mesh(railGeom, railMat);
      r1.position.set(-TRACK_WIDTH / 2 + 0.1, 0.15, -i * TILE_LENGTH);
      r2.position.set(TRACK_WIDTH / 2 - 0.1, 0.15, -i * TILE_LENGTH);
      this.rails.push(r1, r2);
      this.group.add(r1, r2);
    }
  }

  /** Slide all tiles forward by `delta` world units; recycle behind-camera ones. */
  advance(delta: number, cameraZ: number) {
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      tile.position.z += delta;
      if (tile.position.z - TILE_LENGTH / 2 > cameraZ + 4) {
        const minZ = this.minTileZ();
        tile.position.z = minZ - TILE_LENGTH;
      }
    }
    for (let i = 0; i < this.rails.length; i++) {
      const rail = this.rails[i];
      rail.position.z += delta;
      if (rail.position.z - TILE_LENGTH / 2 > cameraZ + 4) {
        const minZ = this.minRailZ();
        rail.position.z = minZ - TILE_LENGTH;
      }
    }
  }

  private minTileZ(): number {
    let m = Infinity;
    for (const t of this.tiles) if (t.position.z < m) m = t.position.z;
    return m;
  }
  private minRailZ(): number {
    let m = Infinity;
    for (const r of this.rails) if (r.position.z < m) m = r.position.z;
    return m;
  }

  reset() {
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i].position.z = -i * TILE_LENGTH;
    }
    for (let i = 0; i < this.tileCount; i++) {
      this.rails[i * 2].position.z = -i * TILE_LENGTH;
      this.rails[i * 2 + 1].position.z = -i * TILE_LENGTH;
    }
  }

  dispose() {
    this.tiles.forEach((t) => t.geometry.dispose());
    this.rails.forEach((r) => r.geometry.dispose());
  }
}
