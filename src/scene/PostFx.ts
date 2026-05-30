// Bloom gated behind ?fx=hi so low-end machines stay smooth.
// TODO: ship a real bloom pass; this is a tone-mapping placeholder.

import * as THREE from 'three';

export class PostFx {
  private renderer: THREE.WebGLRenderer;
  readonly enabled: boolean;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    const params = new URLSearchParams(globalThis.location?.search ?? '');
    this.enabled = params.get('fx') === 'hi';
    if (this.enabled) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
    } else {
      renderer.toneMapping = THREE.LinearToneMapping;
      renderer.toneMappingExposure = 1.0;
    }
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera);
  }

  resize(_w: number, _h: number) {
    void _w;
    void _h;
  }

  dispose() {}
}
