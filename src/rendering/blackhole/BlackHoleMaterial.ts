import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders/blackhole';

// All uniforms are updated externally by BlackHoleScene each frame.
export interface BlackHoleUniforms {
  [key: string]: THREE.IUniform;
  uCameraPos:   { value: THREE.Vector3 };
  uViewMatInv:  { value: THREE.Matrix4 };
  uProjMatInv:  { value: THREE.Matrix4 };
  uMass:        { value: number };
  uRs:          { value: number };
  uDiskInner:   { value: number };
  uDiskOuter:   { value: number };
  uDiskH0:      { value: number };
  uDiskFlare:   { value: number };
  uDiskOpacity: { value: number };
  uDiskVolSteps:{ value: number };
  uTempScale:   { value: number };
  uTime:        { value: number };
}

export class BlackHoleMaterial extends THREE.ShaderMaterial {
  // Typed reference to the inherited uniforms map.
  readonly bhUniforms: BlackHoleUniforms;

  constructor(params: {
    mass:       number;
    rs:         number;
    diskInner:  number;
    diskOuter:  number;
    diskH0:     number;
    diskFlare:  number;
    diskOpacity:number;
    diskVolSteps:number;
    tempScale:  number;
  }) {
    const uniforms: BlackHoleUniforms = {
      uCameraPos:  { value: new THREE.Vector3() },
      uViewMatInv: { value: new THREE.Matrix4() },
      uProjMatInv: { value: new THREE.Matrix4() },
      uMass:       { value: params.mass },
      uRs:         { value: params.rs },
      uDiskInner:  { value: params.diskInner },
      uDiskOuter:  { value: params.diskOuter },
      uDiskH0:     { value: params.diskH0 },
      uDiskFlare:  { value: params.diskFlare },
      uDiskOpacity:{ value: params.diskOpacity },
      uDiskVolSteps:{ value: params.diskVolSteps },
      uTempScale:  { value: params.tempScale },
      uTime:       { value: 0.0 },
    };
    super({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
      dithering: true,
    });
    this.bhUniforms = uniforms;
  }

  // Called each frame from BlackHoleScene.update()
  updateCamera(camera: THREE.Camera): void {
    this.bhUniforms.uCameraPos.value.copy(camera.position);
    this.bhUniforms.uViewMatInv.value.copy(camera.matrixWorld);
    this.bhUniforms.uProjMatInv.value.copy(
      (camera as THREE.PerspectiveCamera).projectionMatrixInverse
    );
  }

  updateTime(t: number): void {
    this.bhUniforms.uTime.value = t;
  }
}
