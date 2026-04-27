import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export interface GravitationalLensingOptions {
  target: THREE.Vector3;
  worldRadius: number;
  effectWorldRadius?: number;
  screenRadius?: number;
  compactness?: number;
  strength?: number;
  ringStrength?: number;
}

export interface PostProcessingOptions {
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  flareStrength?: number;
  lensing?: GravitationalLensingOptions;
}

const AnamorphicFlareMaterial = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uStrength: { value: 0.14 },
    uInvResolution: { value: new THREE.Vector2(1 / window.innerWidth, 1 / window.innerHeight) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform vec2 uInvResolution;
    varying vec2 vUv;

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      float luma = dot(base.rgb, vec3(0.2126, 0.7152, 0.0722));
      float bright = max(0.0, luma - 0.75);

      vec3 streak = vec3(0.0);
      float totalWeight = 0.0;

      const int SAMPLES = 24;
      for (int i = -SAMPLES; i <= SAMPLES; i++) {
        float offset = float(i) * 3.0 * uInvResolution.x;
        vec2 uv2 = clamp(vUv + vec2(offset, 0.0), 0.0, 1.0);
        float weight = exp(-abs(float(i)) * 0.09);
        streak += texture2D(tDiffuse, uv2).rgb * weight;
        totalWeight += weight;
      }

      streak /= totalWeight;

      vec3 flare = streak * vec3(0.35, 0.60, 1.0) * bright * uStrength;
      gl_FragColor = vec4(base.rgb + flare, base.a);
    }
  `,
};

const GravitationalLensingMaterial = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uLensCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uAspect: { value: window.innerWidth / window.innerHeight },
    uStarRadius: { value: 0.07 },
    uEffectRadius: { value: 0.24 },
    uCompactness: { value: 0.45 },
    uStrength: { value: 0.5 },
    uRingStrength: { value: 0.14 },
    uVisibility: { value: 0.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform vec2 uLensCenter;
    uniform float uAspect;
    uniform float uStarRadius;
    uniform float uEffectRadius;
    uniform float uCompactness;
    uniform float uStrength;
    uniform float uRingStrength;
    uniform float uVisibility;
    varying vec2 vUv;

    vec2 toLensSpace(vec2 uv) {
      return vec2(uv.x * uAspect, uv.y);
    }

    vec2 fromLensSpace(vec2 uv) {
      return vec2(uv.x / uAspect, uv.y);
    }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      if (uVisibility < 0.001) {
        gl_FragColor = base;
        return;
      }

      vec2 centered = vUv - uLensCenter;
      vec2 lensVec = toLensSpace(centered);
      float dist = length(lensVec);
      float starRadius = max(uStarRadius, 1e-4);
      float effectRadius = max(uEffectRadius, starRadius * 1.25);

      if (dist > effectRadius * 1.12) {
        gl_FragColor = base;
        return;
      }

      vec2 dir = dist > 1e-5 ? lensVec / dist : vec2(0.0);
      float impact = max(dist / starRadius, 1.02);
      float extent = clamp(dist / effectRadius, 0.0, 1.0);
      float envelope = pow(1.0 - smoothstep(0.0, 1.0, extent), 1.25);

      // Weak-field GR: alpha ~= 2 r_s / b = 2 C / (b / R).
      float alpha = (2.0 * uCompactness) / impact;
      float bend = min(alpha * starRadius * uStrength, effectRadius * 0.34) * envelope;
      vec2 sampleUv = clamp(vUv + fromLensSpace(dir * bend), 0.0, 1.0);

      vec3 color = texture2D(tDiffuse, sampleUv).rgb;

      float magnification = 1.0 + alpha * 0.22 * envelope;
      color *= magnification;

      float photonSphereRadius = clamp(1.5 * uCompactness, 1.08, 2.0) * starRadius;
      float ringWidth = max(starRadius * 0.11, 0.0028);
      float photonRing = exp(-pow((dist - photonSphereRadius) / ringWidth, 2.0));
      float innerGlow = exp(-pow(dist / (starRadius * 2.6), 2.0));

      color += vec3(0.86, 0.90, 1.0) * photonRing * uRingStrength;
      color += vec3(0.02, 0.04, 0.11) * innerGlow * uRingStrength * 0.35 * envelope;

      gl_FragColor = vec4(mix(base.rgb, color, uVisibility), base.a);
    }
  `,
};

export class PostProcessingManager {
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private flarePass: ShaderPass;
  private lensingPass: ShaderPass | null = null;
  private readonly camera: THREE.Camera;
  private readonly lensingTarget = new THREE.Vector3();
  private readonly projectedCenter = new THREE.Vector3();
  private readonly projectedStarEdge = new THREE.Vector3();
  private readonly projectedEffectEdge = new THREE.Vector3();
  private readonly cameraRight = new THREE.Vector3();
  private readonly centerUv = new THREE.Vector2();
  private readonly starEdgeUv = new THREE.Vector2();
  private readonly effectEdgeUv = new THREE.Vector2();
  private lensingWorldRadius = 0;
  private lensingEffectWorldRadius = 0;
  private lensingScreenRadius = 0.24;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    options: PostProcessingOptions = {}
  ) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const bloomStrength = options.bloomStrength ?? 1.4;
    const bloomRadius = options.bloomRadius ?? 0.9;
    const bloomThreshold = options.bloomThreshold ?? 0.18;
    const flareStrength = options.flareStrength ?? 0.14;

    this.camera = camera;

    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
    });

    this.composer = new EffectComposer(renderer, renderTarget);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloomStrength,
      bloomRadius,
      bloomThreshold
    );
    this.composer.addPass(this.bloomPass);

    if (options.lensing) {
      const lensing = options.lensing;

      this.lensingTarget.copy(lensing.target);
      this.lensingWorldRadius = lensing.worldRadius;
      this.lensingEffectWorldRadius = lensing.effectWorldRadius ?? lensing.worldRadius * 4.8;
      this.lensingScreenRadius = lensing.screenRadius ?? 0.24;

      this.lensingPass = new ShaderPass(GravitationalLensingMaterial);
      const lensingMaterial = this.lensingPass.material as THREE.ShaderMaterial;
      lensingMaterial.uniforms.uAspect.value = width / height;
      lensingMaterial.uniforms.uEffectRadius.value = this.lensingScreenRadius;
      lensingMaterial.uniforms.uCompactness.value = lensing.compactness ?? 0.45;
      lensingMaterial.uniforms.uStrength.value = lensing.strength ?? 0.52;
      lensingMaterial.uniforms.uRingStrength.value = lensing.ringStrength ?? 0.18;
      this.composer.addPass(this.lensingPass);
    }

    this.flarePass = new ShaderPass(AnamorphicFlareMaterial);
    const flareMaterial = this.flarePass.material as THREE.ShaderMaterial;
    (flareMaterial.uniforms.uInvResolution.value as THREE.Vector2).set(1 / width, 1 / height);
    flareMaterial.uniforms.uStrength.value = flareStrength;
    this.composer.addPass(this.flarePass);
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);

    if (this.lensingPass) {
      const lensingMaterial = this.lensingPass.material as THREE.ShaderMaterial;
      lensingMaterial.uniforms.uAspect.value = width / height;
    }

    const flareMaterial = this.flarePass.material as THREE.ShaderMaterial;
    (flareMaterial.uniforms.uInvResolution.value as THREE.Vector2).set(1 / width, 1 / height);
  }

  render(): void {
    this.updateLensingUniforms();
    this.composer.render();
  }

  private updateLensingUniforms(): void {
    if (!this.lensingPass) {
      return;
    }

    this.camera.updateMatrixWorld();

    const lensingMaterial = this.lensingPass.material as THREE.ShaderMaterial;
    const uniforms = lensingMaterial.uniforms;

    this.projectedCenter.copy(this.lensingTarget).project(this.camera);
    const visible =
      this.projectedCenter.z > -1 &&
      this.projectedCenter.z < 1 &&
      Math.abs(this.projectedCenter.x) < 1.4 &&
      Math.abs(this.projectedCenter.y) < 1.4;

    if (!visible) {
      uniforms.uVisibility.value = 0.0;
      return;
    }

    this.centerUv.set(
      this.projectedCenter.x * 0.5 + 0.5,
      this.projectedCenter.y * 0.5 + 0.5
    );
    uniforms.uLensCenter.value.copy(this.centerUv);
    uniforms.uVisibility.value = 1.0;

    this.cameraRight.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize();

    this.projectedStarEdge
      .copy(this.lensingTarget)
      .addScaledVector(this.cameraRight, this.lensingWorldRadius)
      .project(this.camera);

    this.starEdgeUv.set(
      this.projectedStarEdge.x * 0.5 + 0.5,
      this.projectedStarEdge.y * 0.5 + 0.5
    );

    const aspect = uniforms.uAspect.value as number;
    const starRadius = THREE.MathUtils.clamp(
      Math.hypot(
        (this.starEdgeUv.x - this.centerUv.x) * aspect,
        this.starEdgeUv.y - this.centerUv.y
      ),
      0.012,
      0.2
    );
    uniforms.uStarRadius.value = starRadius;

    if (this.lensingEffectWorldRadius > 0) {
      this.projectedEffectEdge
        .copy(this.lensingTarget)
        .addScaledVector(this.cameraRight, this.lensingEffectWorldRadius)
        .project(this.camera);

      this.effectEdgeUv.set(
        this.projectedEffectEdge.x * 0.5 + 0.5,
        this.projectedEffectEdge.y * 0.5 + 0.5
      );

      uniforms.uEffectRadius.value = THREE.MathUtils.clamp(
        Math.hypot(
          (this.effectEdgeUv.x - this.centerUv.x) * aspect,
          this.effectEdgeUv.y - this.centerUv.y
        ),
        starRadius * 1.3,
        0.5
      );
      return;
    }

    uniforms.uEffectRadius.value = this.lensingScreenRadius;
  }
}
