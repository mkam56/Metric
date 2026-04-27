import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';

const AnamorphicFlareMaterial = {
  uniforms: {
    tDiffuse:   { value: null as THREE.Texture | null },
    uStrength:  { value: 0.18 },
    uInvResolution: { value: new THREE.Vector2(1 / window.innerWidth, 1 / window.innerHeight) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float     uStrength;
    uniform vec2      uInvResolution;
    varying vec2      vUv;

    void main() {
      vec4  base  = texture2D(tDiffuse, vUv);
      float luma  = dot(base.rgb, vec3(0.2126, 0.7152, 0.0722));

      // Only the brightest fragments feed the streak.
      float bright = max(0.0, luma - 0.75);

      vec3  streak     = vec3(0.0);
      float totalWeight = 0.0;

      // 64-sample horizontal blur with exponential falloff.
      const int SAMPLES = 64;
      for (int i = -SAMPLES; i <= SAMPLES; i++) {
        float offset = float(i) * 3.5 * uInvResolution.x; // stretch factor
        vec2  uv2    = clamp(vUv + vec2(offset, 0.0), 0.0, 1.0);
        float w      = exp(-abs(float(i)) * 0.09);
        streak      += texture2D(tDiffuse, uv2).rgb * w;
        totalWeight += w;
      }
      streak /= totalWeight;

      // Classic anamorphic tint: cold blue streak
      vec3 flare = streak * vec3(0.35, 0.60, 1.0) * bright * uStrength;
      gl_FragColor = vec4(base.rgb + flare, base.a);
    }
  `,
};

export class PostProcessingManager {
  private composer:    EffectComposer;
  private bloomPass:   UnrealBloomPass;
  private flarePass:   ShaderPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene:    THREE.Scene,
    camera:   THREE.Camera
  ) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const rt = new THREE.WebGLRenderTarget(w, h, {
      type:   THREE.HalfFloatType,
      format: THREE.RGBAFormat,
    });

    this.composer = new EffectComposer(renderer, rt);
    this.composer.addPass(new RenderPass(scene, camera));

     // NORMALIZED: reduced strength (1.0 instead of 1.4) to match softer Doppler in shader
     this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.12, 0.82, 0.22);
    this.composer.addPass(this.bloomPass);

    this.flarePass = new ShaderPass(AnamorphicFlareMaterial);
    const mat = this.flarePass.material as THREE.ShaderMaterial;
    (mat.uniforms.uInvResolution.value as THREE.Vector2).set(1 / w, 1 / h);
    this.composer.addPass(this.flarePass);
  }

  setSize(w: number, h: number): void {
    this.composer.setSize(w, h);
    this.bloomPass.resolution.set(w, h);
    const mat = this.flarePass.material as THREE.ShaderMaterial;
    (mat.uniforms.uInvResolution.value as THREE.Vector2).set(1 / w, 1 / h);
  }

  render(): void {
    this.composer.render();
  }
}
