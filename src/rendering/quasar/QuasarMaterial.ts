import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders/quasar';

export interface QuasarUniforms {
  [key: string]: THREE.IUniform;
  uCameraPos:    { value: THREE.Vector3 };
  uViewMatInv:   { value: THREE.Matrix4 };
  uProjMatInv:   { value: THREE.Matrix4 };

  uMass:         { value: number };
  uRs:           { value: number };

  uDiskInner:    { value: number };
  uDiskOuter:    { value: number };
  uDiskH0:       { value: number };
  uDiskFlare:    { value: number };
  uDiskOpacity:  { value: number };
  uDiskVolSteps: { value: number };
  uTempScale:    { value: number };

  uJetPower:     { value: number };
  uCoreStrength: { value: number };
  uDustStrength: { value: number };
  uTime:         { value: number };
}

export class QuasarMaterial extends THREE.ShaderMaterial {
  readonly quasarUniforms: QuasarUniforms;

  constructor(params: {
    mass: number;
    rs: number;

    diskInner: number;
    diskOuter: number;
    diskH0: number;
    diskFlare: number;
    diskOpacity: number;
    diskVolSteps: number;
    tempScale: number;

    jetPower: number;
    coreStrength: number;
    dustStrength: number;
  }) {
    const uniforms: QuasarUniforms = {
      uCameraPos:    { value: new THREE.Vector3() },
      uViewMatInv:   { value: new THREE.Matrix4() },
      uProjMatInv:   { value: new THREE.Matrix4() },

      uMass:         { value: params.mass },
      uRs:           { value: params.rs },

      uDiskInner:    { value: params.diskInner },
      uDiskOuter:    { value: params.diskOuter },
      uDiskH0:       { value: params.diskH0 },
      uDiskFlare:    { value: params.diskFlare },
      uDiskOpacity:  { value: params.diskOpacity },
      uDiskVolSteps: { value: params.diskVolSteps },
      uTempScale:    { value: params.tempScale },

      uJetPower:     { value: params.jetPower },
      uCoreStrength: { value: params.coreStrength },
      uDustStrength: { value: params.dustStrength },
      uTime:         { value: 0.0 },
    };

    super({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
      dithering: true,
    });

    this.quasarUniforms = uniforms;
  }

  updateCamera(camera: THREE.Camera): void {
    this.quasarUniforms.uCameraPos.value.copy(camera.position);
    this.quasarUniforms.uViewMatInv.value.copy(camera.matrixWorld);
    this.quasarUniforms.uProjMatInv.value.copy(
      (camera as THREE.PerspectiveCamera).projectionMatrixInverse
    );
  }

  updateTime(t: number): void {
    this.quasarUniforms.uTime.value = t;
  }
}