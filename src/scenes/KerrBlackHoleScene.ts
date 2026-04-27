import * as THREE from 'three';

import { BaseScene } from './BaseScene';
import { Renderer } from '../rendering/Renderer';
import { KerrBlackHoleModel } from '../physics/blackhole/KerrBlackHoleModel';
import { KerrBlackHoleMaterial } from '../rendering/kerr/KerrBlackHoleMaterial';

export class KerrBlackHoleScene extends BaseScene {
    private blackHole: KerrBlackHoleModel;
    private material: KerrBlackHoleMaterial | null = null;
    private quad: THREE.Mesh | null = null;
    private _camera: THREE.Camera | null = null;
    private _elapsed = 0;

    constructor() {
        super();
        this.blackHole = new KerrBlackHoleModel(1.9, 0.95);
    }

    linkCamera(camera: THREE.Camera): void {
        this._camera = camera;
    }

    init(renderer: Renderer): void {
        this.material = new KerrBlackHoleMaterial({
            mass: this.blackHole.mass,
            spin: this.blackHole.spin,
            isco: this.blackHole.iscoRadius,
            rs: this.blackHole.eventHorizon,
            diskInner: this.blackHole.iscoRadius * 1.01,
            diskOuter: this.blackHole.iscoRadius * 4.9,
            diskH0: 0.050,
            diskFlare: 0.14,
            diskOpacity: 0.72,
            diskVolSteps: 14.0,
            tempScale: 0.62,
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
        this.material.updatePhysics(
            this.blackHole.spin,
            this.blackHole.iscoRadius,
            this.blackHole.eventHorizon
        );
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