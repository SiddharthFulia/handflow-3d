// Single big sphere with vertex-painted gradient — no 6-image cubemap.

import * as THREE from 'three';
import { Materials } from './Materials';

export class Skybox {
  readonly group: THREE.Group;
  private sphere: THREE.Mesh;
  private mountains: THREE.Mesh;

  constructor(materials: Materials) {
    this.group = new THREE.Group();

    const skyGeom = new THREE.SphereGeometry(400, 32, 16);
    const colors: number[] = [];
    const positions = skyGeom.attributes.position;
    const top = new THREE.Color(0x141425);
    const bot = new THREE.Color(0x2a1530);
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const t = THREE.MathUtils.clamp((y + 300) / 600, 0, 1);
      const c = top.clone().lerp(bot, 1 - t);
      colors.push(c.r, c.g, c.b);
    }
    skyGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
    this.sphere = new THREE.Mesh(skyGeom, skyMat);
    this.group.add(this.sphere);

    const peakGeom = new THREE.ConeGeometry(8, 14, 5);
    const peakMat = materials.get('mountain');
    this.mountains = new THREE.InstancedMesh(peakGeom, peakMat, 40);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const r = 150 + Math.random() * 30;
      dummy.position.set(Math.cos(angle) * r, Math.random() * 2 - 4, Math.sin(angle) * r);
      dummy.scale.set(
        0.8 + Math.random() * 1.2,
        0.7 + Math.random() * 1.6,
        0.8 + Math.random() * 1.2
      );
      dummy.updateMatrix();
      (this.mountains as THREE.InstancedMesh).setMatrixAt(i, dummy.matrix);
    }
    (this.mountains as THREE.InstancedMesh).instanceMatrix.needsUpdate = true;
    this.group.add(this.mountains);
  }

  dispose() {
    this.sphere.geometry.dispose();
    (this.sphere.material as THREE.Material).dispose();
    this.mountains.geometry.dispose();
  }
}
