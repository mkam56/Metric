import * as THREE from 'three';

import { fragmentShader, vertexShader } from './shaders/pulsar';

export interface PulsarUniforms {
  [key: string]: THREE.IUniform;
  uSurfaceRedshift: { value: number };
  uTime: { value: number };
}

export class PulsarMaterial extends THREE.ShaderMaterial {
  readonly pulsarUniforms: PulsarUniforms;

  constructor(params: { surfaceRedshift: number }) {
    const uniforms: PulsarUniforms = {
      uSurfaceRedshift: { value: params.surfaceRedshift },
      uTime: { value: 0.0 },
    };

    super({
      vertexShader,
      fragmentShader,
      uniforms,
      dithering: true,
      toneMapped: false,
    });

    this.pulsarUniforms = uniforms;
  }

  updateTime(t: number): void {
    this.pulsarUniforms.uTime.value = t;
  }
}
