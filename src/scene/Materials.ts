// Shared material cache — lets three.js batch draw calls.

import * as THREE from 'three';

export type MatName =
  | 'player'
  | 'trackA'
  | 'trackB'
  | 'rail'
  | 'barrier'
  | 'train'
  | 'ramp'
  | 'coin'
  | 'skybox'
  | 'mountain';

export class Materials {
  private cache = new Map<MatName, THREE.Material>();

  get(name: MatName): THREE.Material {
    let m = this.cache.get(name);
    if (m) return m;
    m = this.build(name);
    this.cache.set(name, m);
    return m;
  }

  private build(name: MatName): THREE.Material {
    switch (name) {
      case 'player':
        return new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.45,
          metalness: 0.1,
          emissive: 0x3b1d00,
          emissiveIntensity: 0.4
        });
      case 'trackA':
        return new THREE.MeshStandardMaterial({ color: 0x2a2a32, roughness: 0.9 });
      case 'trackB':
        return new THREE.MeshStandardMaterial({ color: 0x1f1f26, roughness: 0.9 });
      case 'rail':
        return new THREE.MeshStandardMaterial({ color: 0x6e7280, roughness: 0.3, metalness: 0.7 });
      case 'barrier':
        return new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.6 });
      case 'train':
        return new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });
      case 'ramp':
        return new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });
      case 'coin':
        return new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          roughness: 0.2,
          metalness: 0.8,
          emissive: 0x6b4500,
          emissiveIntensity: 0.6
        });
      case 'skybox':
        return new THREE.MeshBasicMaterial({ color: 0x0a0a0e, side: THREE.BackSide });
      case 'mountain':
        return new THREE.MeshStandardMaterial({ color: 0x312e44, roughness: 1.0 });
    }
  }

  dispose() {
    this.cache.forEach((m) => m.dispose());
    this.cache.clear();
  }
}
