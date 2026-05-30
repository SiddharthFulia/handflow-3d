import * as THREE from 'three';

export interface ChaseCameraOptions {
  offset: THREE.Vector3;
  lookahead: number;
  /** 0..1, higher = snappier on lane swaps */
  xDamping: number;
  yDamping: number;
}

export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera;
  private opts: ChaseCameraOptions;
  private scratchTarget = new THREE.Vector3();
  private scratchDesired = new THREE.Vector3();

  constructor(aspect: number, opts: Partial<ChaseCameraOptions> = {}) {
    this.opts = {
      offset: opts.offset ?? new THREE.Vector3(0, 5.2, 9),
      lookahead: opts.lookahead ?? 10,
      xDamping: opts.xDamping ?? 0.18,
      yDamping: opts.yDamping ?? 0.12
    };
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);
    this.camera.position.set(0, this.opts.offset.y, this.opts.offset.z);
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  follow(playerPos: THREE.Vector3) {
    this.scratchDesired.copy(playerPos).add(this.opts.offset);
    // snap Z so the runner can't outpace the camera; lerp X/Y for smoothness
    this.camera.position.x += (this.scratchDesired.x - this.camera.position.x) * this.opts.xDamping;
    this.camera.position.y += (this.scratchDesired.y - this.camera.position.y) * this.opts.yDamping;
    this.camera.position.z = this.scratchDesired.z;

    this.scratchTarget.copy(playerPos);
    this.scratchTarget.z -= this.opts.lookahead;
    this.scratchTarget.y += 1.0;
    this.camera.lookAt(this.scratchTarget);
  }
}
