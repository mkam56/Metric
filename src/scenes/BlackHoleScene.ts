import * as THREE from 'three';

import { BaseScene }          from './BaseScene';
import { Renderer }           from '../rendering/Renderer';
import { BlackHoleModel }     from '../physics/blackhole/BlackHoleModel';
import { AccretionDiskModel } from '../physics/disk/AccretionDiskModel';
import { BlackHoleMaterial }  from '../rendering/blackhole/BlackHoleMaterial';

export class BlackHoleScene extends BaseScene {
  private blackHole: BlackHoleModel;
  private disk:      AccretionDiskModel;
  private material:  BlackHoleMaterial | null = null;
  private quad:      THREE.Mesh | null = null;
  private _camera:   THREE.Camera | null = null;
  private _elapsed:  number = 0;

  constructor() {
    super();
    // Normalized units: G=1, c=1. mass=1 → r_s=2, r_isco=6
    this.blackHole = new BlackHoleModel(1);
    this.disk      = new AccretionDiskModel(
      this.blackHole.iscoRadius,
      this.blackHole.iscoRadius * 5,  // outer edge = 30M
      this.blackHole
    );
  }

  // Wire the actual Three.js camera so uniforms stay in sync
  linkCamera(camera: THREE.Camera): void {
    this._camera = camera;
  }

  init(renderer: Renderer): void {
    this.material = new BlackHoleMaterial({
      mass:      this.blackHole.mass,
      rs:        this.blackHole.schwarzschildRadius,
      diskInner: this.disk.innerRadius,
      diskOuter: this.disk.outerRadius,
      diskH0:    0.72,
      diskFlare: 0.10,
      diskOpacity: 0.9,
      diskVolSteps: 18.0,
      tempScale: this.disk.tempScale,
    });

    // Full-screen quad: PlaneGeometry(2,2) positions span NDC [-1,+1]
    // frustumCulled=false ensures it's never clipped by the camera
    const geo  = new THREE.PlaneGeometry(2, 2);
    this.quad  = new THREE.Mesh(geo, this.material);
    this.quad.frustumCulled = false;
    renderer.addObject(this.quad);

    // Init post-processing after scene objects are set up
    if (this._camera) {
      renderer.initPostProcessing(this._camera);
    }
  }

  update(_deltaTime: number): void {
    if (!this.material || !this._camera) return;
    this._elapsed += _deltaTime;
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
