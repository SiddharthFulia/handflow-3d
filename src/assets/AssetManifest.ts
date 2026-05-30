// Every asset has a procedural fallback so the game runs without binary assets.
// TODO: load real GLB / textures when supplied via `url`.

import * as THREE from 'three';

export type FallbackBuilder = () => THREE.BufferGeometry;

export interface AssetEntry {
  key: string;
  /** Optional URL; if omitted, `fallback` is used. */
  url?: string;
  type: 'model' | 'texture';
  fallback?: FallbackBuilder;
}

export const ASSETS: AssetEntry[] = [
  {
    key: 'player.body',
    type: 'model',
    fallback: () => new THREE.CapsuleGeometry(0.4, 0.9, 4, 12)
  },
  {
    key: 'obstacle.barrier',
    type: 'model',
    fallback: () => new THREE.BoxGeometry(2.0, 1.0, 0.6)
  },
  {
    key: 'obstacle.train',
    type: 'model',
    fallback: () => new THREE.BoxGeometry(2.0, 1.8, 12)
  },
  {
    key: 'obstacle.ramp',
    type: 'model',
    fallback: () => new THREE.BoxGeometry(2.0, 0.6, 3.2)
  },
  {
    key: 'coin.pickup',
    type: 'model',
    fallback: () => new THREE.TorusGeometry(0.32, 0.1, 8, 16)
  },
  {
    key: 'mountain.peak',
    type: 'model',
    fallback: () => new THREE.ConeGeometry(8, 14, 5)
  }
];

export function resolveGeometry(key: string): THREE.BufferGeometry | null {
  const entry = ASSETS.find((a) => a.key === key);
  if (!entry?.fallback) return null;
  return entry.fallback();
}
