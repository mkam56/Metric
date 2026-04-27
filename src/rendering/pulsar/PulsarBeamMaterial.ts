import * as THREE from 'three';

import { fragmentShader, vertexShader } from './shaders/pulsarBeam';

interface PulsarBeamUniforms {
  [key: string]: THREE.IUniform;
  uPrimaryColor: { value: THREE.Color };
  uSecondaryColor: { value: THREE.Color };
  uHalfHeight: { value: number };
  uBaseRadius: { value: number };
  uTipRadius: { value: number };
  uIntensity: { value: number };
  uOpacity: { value: number };
  uTime: { value: number };
}

export class PulsarBeamMaterial extends THREE.ShaderMaterial {
  readonly beamUniforms: PulsarBeamUniforms;

  constructor(params: {
    height: number;
    baseRadius: number;
    tipRadius: number;
    primaryColor: THREE.ColorRepresentation;
    secondaryColor: THREE.ColorRepresentation;
    intensity: number;
    opacity: number;
  }) {
    const uniforms: PulsarBeamUniforms = {
      uPrimaryColor: { value: new THREE.Color(params.primaryColor) },
      uSecondaryColor: { value: new THREE.Color(params.secondaryColor) },
      uHalfHeight: { value: params.height * 0.5 },
      uBaseRadius: { value: params.baseRadius },
      uTipRadius: { value: params.tipRadius },
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

    this.beamUniforms = uniforms;
  }

  updateTime(t: number): void {
    this.beamUniforms.uTime.value = t;
  }
}
