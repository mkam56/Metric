import * as THREE from 'three';

import { BaseScene } from './BaseScene';
import { Renderer } from '../rendering/Renderer';
import { QuasarMaterial } from '../rendering/quasar/QuasarMaterial';

export class QuasarScene extends BaseScene {
  private material: QuasarMaterial | null = null;
  private quad: THREE.Mesh | null = null;
  private _camera: THREE.Camera | null = null;
  private _elapsed = 0;

  linkCamera(camera: THREE.Camera): void {
    this._camera = camera;
  }

  init(renderer: Renderer): void {
    this.material = new QuasarMaterial({
      mass: 1.0,
      rs: 2.0,

      // Под ту же стартовую камеру, что у black hole
      diskInner: 6.0,
      diskOuter: 28.0,
      diskH0: 0.90,
      diskFlare: 0.18,
      diskOpacity: 0.95,
      diskVolSteps: 10.0,
      tempScale: 0.55,

      jetPower: 0.95,
      coreStrength: 1.25,
      dustStrength: 0.95,
    });

    const geo = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geo, this.material);
    this.quad.frustumCulled = false;
    renderer.addObject(this.quad);

    if (this._camera) {
      renderer.initPostProcessing(this._camera);
    }
  }

  update(deltaTime: number): void {
    if (!this.material || !this._camera) return;
    this._elapsed += deltaTime;
    this.material.updateCamera(this._camera);
    this.material.updateTime(this._elapsed);
  }

  dispose(renderer: Renderer): void {
    if (this.quad) {
      this.quad.geometry.dispose();
      (this.quad.material as THREE.Material).dispose();
      renderer.removeObject(this.quad);
      this.quad = null;
    }
    this.material = null;
  }
}