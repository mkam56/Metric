import * as THREE from 'three';

import { fragmentShader, vertexShader } from './shaders/pulsarDisk';

interface PulsarDiskUniforms {
  [key: string]: THREE.IUniform;
  uInnerRadius: { value: number };
  uOuterRadius: { value: number };
  uCoolColor: { value: THREE.Color };
  uHotColor: { value: THREE.Color };
  uIntensity: { value: number };
  uOpacity: { value: number };
  uTime: { value: number };
}

export class PulsarDiskMaterial extends THREE.ShaderMaterial {
  readonly diskUniforms: PulsarDiskUniforms;

  constructor(params: {
    innerRadius: number;
    outerRadius: number;
    coolColor: THREE.ColorRepresentation;
    hotColor: THREE.ColorRepresentation;
    intensity: number;
    opacity: number;
  }) {
    const uniforms: PulsarDiskUniforms = {
      uInnerRadius: { value: params.innerRadius },
      uOuterRadius: { value: params.outerRadius },
      uCoolColor: { value: new THREE.Color(params.coolColor) },
      uHotColor: { value: new THREE.Color(params.hotColor) },
      uIntensity: { value: params.intensity },
      uOpacity: { value: params.opacity },
      uTime: { value: 0 },
    };

    super({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      dithering: true,
      toneMapped: false,
    });

    this.diskUniforms = uniforms;
  }

  updateTime(t: number): void {
    this.diskUniforms.uTime.value = t;
  }
}
