// Hemi + spot light. Fog hides far-spawn pop into the skybox.

import * as THREE from 'three';

export class Lighting {
  readonly hemi: THREE.HemisphereLight;
  readonly spot: THREE.SpotLight;
  readonly fog: THREE.Fog;

  constructor(scene: THREE.Scene) {
    this.hemi = new THREE.HemisphereLight(0xffe9c4, 0x1a1a26, 0.55);
    this.spot = new THREE.SpotLight(0xffd28a, 1.2, 80, Math.PI / 5, 0.4, 1.5);
    this.spot.position.set(8, 14, -6);
    this.spot.target.position.set(0, 0, -8);

    this.fog = new THREE.Fog(0x0a0a0e, 30, 120);
    scene.fog = this.fog;

    scene.add(this.hemi);
    scene.add(this.spot);
    scene.add(this.spot.target);
  }

  dispose() {
    this.hemi.dispose();
    this.spot.dispose();
  }
}
