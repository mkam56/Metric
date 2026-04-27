import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { Renderer } from '../rendering/Renderer';
import { NeutronStarModel } from '../physics/neutron-star/NeutronStarModel';
import {
  createNeutronStarObjects,
  type NeutronStarObjects,
} from '../rendering/neutron-star/NeutronStarMaterial';

export class NeutronStarScene extends BaseScene {
  private model = new NeutronStarModel();
  private objects: NeutronStarObjects | null = null;
  private camera: THREE.Camera | null = null;

  linkCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  init(renderer: Renderer): void {
    this.objects = createNeutronStarObjects(this.model);

    renderer.addObject(this.objects.star);
    renderer.addObject(this.objects.glowShell);
    renderer.addObject(this.objects.innerGlowShell);
    renderer.addObject(this.objects.stars);
    renderer.addObject(this.objects.ambientLight);
    renderer.addObject(this.objects.pointLight);

    renderer.scene.fog = new THREE.FogExp2(0x000000, 0.0018);

    if (this.camera) {
      renderer.initPostProcessing(this.camera);
    }
  }

  update(deltaTime: number): void {
    if (!this.objects) return;

    const t = performance.now();

    const {
      star,
      glowShell,
      innerGlowShell,
      northSpot,
      southSpot,
      magnetosphere,
      stars,
      pointLight,
    } = this.objects;

    star.rotation.y += deltaTime * this.model.rotationSpeed * 0.18;

    const pulse = this.model.glowIntensity + Math.sin(t * 0.0035) * 0.20;
    const starScale = 1.0 + Math.sin(t * 0.004) * 0.006;

    star.scale.set(starScale, starScale, starScale);

    const starMaterial = star.material as THREE.MeshStandardMaterial;
    starMaterial.emissiveIntensity = pulse * 1.4;

    glowShell.position.copy(star.position);
    glowShell.rotation.y += deltaTime * 0.18;
    glowShell.scale.set(
      1.16 + Math.sin(t * 0.0018) * 0.01,
      1.16 + Math.cos(t * 0.0016) * 0.01,
      1.16
    );
    (glowShell.material as THREE.MeshBasicMaterial).opacity = 0.07;

    innerGlowShell.position.copy(star.position);
    innerGlowShell.rotation.y += deltaTime * 0.28;
    innerGlowShell.scale.set(
      1.08 + Math.sin(t * 0.0025) * 0.015,
      1.08 + Math.cos(t * 0.0022) * 0.015,
      1.08
    );
    (innerGlowShell.material as THREE.MeshBasicMaterial).opacity =
      0.08 + (pulse / 10.0) * 0.08;

    pointLight.intensity = pulse * 5.5;

    const spotScale = 1.0 + Math.sin(t * 0.008) * 0.05;

    (northSpot.material as THREE.MeshBasicMaterial).opacity =
      0.68 + (Math.sin(t * 0.007) + 1.0) * 0.12;
    northSpot.scale.setScalar(spotScale);

    (southSpot.material as THREE.MeshBasicMaterial).opacity =
      0.52 + (Math.sin(t * 0.007 + 0.9) + 1.0) * 0.09;
    southSpot.scale.setScalar(spotScale * 0.92);

    magnetosphere.rotation.y += deltaTime * 0.18;
    magnetosphere.rotation.x = 0.2;
    magnetosphere.position.x = Math.sin(t * 0.00035) * 0.08;
    magnetosphere.position.z = Math.cos(t * 0.00035) * 0.08;

    const magnetosphereMaterial = magnetosphere.material as THREE.ShaderMaterial;
    magnetosphereMaterial.uniforms.uTime.value = t * 0.001;

    stars.rotation.y += deltaTime * 0.008;
  }

  dispose(renderer: Renderer): void {
    if (!this.objects) return;

    const rootObjects: THREE.Object3D[] = [
      this.objects.star,
      this.objects.glowShell,
      this.objects.innerGlowShell,
      this.objects.stars,
      this.objects.pointLight,
      this.objects.ambientLight,
    ];

    rootObjects.forEach((obj) => renderer.removeObject(obj));

    const disposeObject = (obj: THREE.Object3D) => {
      const maybeMesh = obj as THREE.Mesh & {
        geometry?: THREE.BufferGeometry;
        material?: THREE.Material | THREE.Material[];
      };

      if (maybeMesh.geometry) {
        maybeMesh.geometry.dispose();
      }

      if (Array.isArray(maybeMesh.material)) {
        maybeMesh.material.forEach((m) => m.dispose());
      } else if (maybeMesh.material) {
        maybeMesh.material.dispose();
      }
    };

    disposeObject(this.objects.star);
    disposeObject(this.objects.glowShell);
    disposeObject(this.objects.innerGlowShell);
    disposeObject(this.objects.northSpot);
    disposeObject(this.objects.southSpot);
    disposeObject(this.objects.magnetosphere);
    disposeObject(this.objects.stars);

    renderer.scene.fog = null;
    this.objects = null;
  }
}