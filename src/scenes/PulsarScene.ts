import * as THREE from 'three';

import { PulsarModel } from '../physics/pulsar/PulsarModel';
import { Renderer } from '../rendering/Renderer';
import { PulsarMaterial } from '../rendering/pulsar/PulsarMaterial';
import { BaseScene } from './BaseScene';

export class PulsarScene extends BaseScene {
  private readonly pulsar: PulsarModel;
  private readonly spinRate: number;
  private readonly visualStarRadius = 3.05;
  private readonly beamLength = 188;
  private readonly haloScale = 34;
  private readonly coreScale = 10.2;
  private readonly ringScale = 33.5;
  private readonly beamAxis = new THREE.Vector3(0, 1, 0);
  private readonly beamMatrix = new THREE.Matrix4();
  private readonly beamX = new THREE.Vector3();
  private readonly beamZ = new THREE.Vector3();

  private root: THREE.Group | null = null;
  private spinGroup: THREE.Group | null = null;
  private magneticGroup: THREE.Group | null = null;
  private camera: THREE.Camera | null = null;
  private starMaterial: PulsarMaterial | null = null;
  private beamPlanes: THREE.Mesh[] = [];
  private haloMaterial: THREE.SpriteMaterial | null = null;
  private midHaloMaterial: THREE.SpriteMaterial | null = null;
  private outerHaloMaterial: THREE.SpriteMaterial | null = null;
  private ringMaterial: THREE.SpriteMaterial | null = null;
  private ringGlowMaterial: THREE.SpriteMaterial | null = null;
  private coreMaterial: THREE.SpriteMaterial | null = null;
  private glowTexture: THREE.CanvasTexture | null = null;
  private ringTexture: THREE.CanvasTexture | null = null;
  private beamTexture: THREE.CanvasTexture | null = null;
  private elapsed = 0;
  private previousBackground: THREE.Scene['background'] = null;

  constructor() {
    super();

    this.pulsar = new PulsarModel(0.18, 8.0, {
      mass: 0.2,
      radius: 0.7,
      magneticAxisInclination: Math.PI / 5.6,
    });
    this.spinRate = 0.62;
  }

  linkCamera(camera: THREE.Camera): void {
    this.camera = camera;
    this.camera.position.set(0, 0, 24);
    this.camera.lookAt(0, 0, 0);
  }

  init(renderer: Renderer): void {
    this.previousBackground = renderer.scene.background;
    renderer.scene.background = new THREE.Color(0x0a1020);

    this.glowTexture = this.createGlowTexture();
    this.ringTexture = this.createRingTexture();
    this.beamTexture = this.createBeamTexture();

    this.root = new THREE.Group();
    this.root.rotation.x = 0;

    this.spinGroup = new THREE.Group();
    this.root.add(this.spinGroup);

    this.magneticGroup = new THREE.Group();
    this.magneticGroup.rotation.z = this.pulsar.magneticAxisInclination;
    this.spinGroup.add(this.magneticGroup);

    this.root.add(this.createStarfield(this.glowTexture));
    this.spinGroup.add(this.createDiffuseHalo(this.glowTexture));
    this.spinGroup.add(this.createOuterRing(this.ringTexture));
    this.spinGroup.add(this.createPulsarBody(this.glowTexture));
    this.magneticGroup.add(this.createBeamLines(this.beamTexture));

    renderer.addObject(this.root);

    if (this.camera) {
      renderer.initPostProcessing(this.camera, {
        bloomStrength: 1.08,
        bloomRadius: 0.7,
        bloomThreshold: 0.14,
        flareStrength: 0.0,
        lensing: {
          target: new THREE.Vector3(0, 0, 0),
          worldRadius: this.visualStarRadius,
          effectWorldRadius: this.ringScale * 0.56,
          compactness: this.pulsar.compactness,
          strength: 0.58,
          ringStrength: 0.22,
        },
      });
    }
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;

    if (this.spinGroup) {
      this.spinGroup.rotation.y = this.elapsed * this.spinRate;
    }

    this.starMaterial?.updateTime(this.elapsed);
    this.updateBeamFacing();

    if (this.haloMaterial) {
      this.haloMaterial.opacity = 0.22 + 0.004 * Math.sin(this.elapsed * 0.35);
    }

    if (this.midHaloMaterial) {
      this.midHaloMaterial.opacity = 0.16 + 0.003 * Math.sin(this.elapsed * 0.28);
    }

    if (this.outerHaloMaterial) {
      this.outerHaloMaterial.opacity = 0.08 + 0.003 * Math.sin(this.elapsed * 0.22);
    }
  }

  dispose(renderer: Renderer): void {
    if (this.root) {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();

      this.root.traverse((child) => {
        const renderable = child as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };

        if (renderable.geometry) {
          geometries.add(renderable.geometry);
        }

        if (renderable.material) {
          if (Array.isArray(renderable.material)) {
            for (const material of renderable.material) {
              materials.add(material);
            }
          } else {
            materials.add(renderable.material);
          }
        }
      });

      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());

      renderer.removeObject(this.root);
      this.root = null;
    }

    this.glowTexture?.dispose();
    this.ringTexture?.dispose();
    this.beamTexture?.dispose();
    this.glowTexture = null;
    this.ringTexture = null;
    this.beamTexture = null;
    renderer.scene.background = this.previousBackground;

    this.spinGroup = null;
    this.magneticGroup = null;
    this.starMaterial = null;
    this.beamPlanes = [];
    this.haloMaterial = null;
    this.midHaloMaterial = null;
    this.outerHaloMaterial = null;
    this.ringMaterial = null;
    this.ringGlowMaterial = null;
    this.coreMaterial = null;
  }

  private createPulsarBody(texture: THREE.Texture): THREE.Group {
    const group = new THREE.Group();

    this.starMaterial = new PulsarMaterial({
      surfaceRedshift: this.pulsar.surfaceRedshift(),
    });

    const star = new THREE.Mesh(
      new THREE.IcosahedronGeometry(this.visualStarRadius, 5),
      this.starMaterial
    );
    group.add(star);

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(this.visualStarRadius * 1.08, 3),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x7aa6ff),
        transparent: true,
        opacity: 0.05,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );
    group.add(shell);

    this.coreMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

    const core = new THREE.Sprite(this.coreMaterial);
    core.scale.set(this.coreScale, this.coreScale, 1);
    core.renderOrder = 5;
    group.add(core);

    return group;
  }

  private createDiffuseHalo(texture: THREE.Texture): THREE.Group {
    const group = new THREE.Group();

    this.outerHaloMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color(0xa5b6ff),
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const outer = new THREE.Sprite(this.outerHaloMaterial);
    outer.scale.set(this.haloScale * 1.72, this.haloScale * 1.72, 1);
    group.add(outer);

    this.midHaloMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color(0x7f96ff),
      transparent: true,
      opacity: 0.19,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const mid = new THREE.Sprite(this.midHaloMaterial);
    mid.scale.set(this.haloScale * 1.18, this.haloScale * 1.18, 1);
    group.add(mid);

    this.haloMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color(0x4f68ff),
      transparent: true,
      opacity: 0.27,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const halo = new THREE.Sprite(this.haloMaterial);
    halo.scale.set(this.haloScale * 0.78, this.haloScale * 0.78, 1);
    group.add(halo);

    return group;
  }

  private createOuterRing(texture: THREE.Texture): THREE.Group {
    const group = new THREE.Group();

    this.ringGlowMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color(0x5d6ce0),
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const ringGlow = new THREE.Sprite(this.ringGlowMaterial);
    ringGlow.scale.set(this.ringScale * 1.08, this.ringScale * 1.08, 1);
    group.add(ringGlow);

    this.ringMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color(0xe7ebf9),
      transparent: true,
      opacity: 0.24,
      blending: THREE.NormalBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const ring = new THREE.Sprite(this.ringMaterial);
    ring.scale.set(this.ringScale, this.ringScale, 1);
    group.add(ring);

    return group;
  }

  private createBeamLines(texture: THREE.Texture): THREE.Group {
    const group = new THREE.Group();

    const makeMaterial = (
      color: THREE.ColorRepresentation,
      opacity: number
    ): THREE.MeshBasicMaterial =>
      new THREE.MeshBasicMaterial({
        map: texture,
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        alphaTest: 0.01,
        toneMapped: false,
      });

    const outerMaterial = makeMaterial(0x8392ff, 0.7);
    const midMaterial = makeMaterial(0xbfc8ff, 0.9);
    const innerMaterial = makeMaterial(0xffffff, 1.0);

    const outerBeam = new THREE.Mesh(new THREE.PlaneGeometry(1.8, this.beamLength), outerMaterial);
    outerBeam.renderOrder = 4;

    const midBeam = new THREE.Mesh(new THREE.PlaneGeometry(0.92, this.beamLength * 0.98), midMaterial);
    midBeam.renderOrder = 5;

    const innerBeam = new THREE.Mesh(new THREE.PlaneGeometry(0.26, this.beamLength * 0.95), innerMaterial);
    innerBeam.renderOrder = 6;

    // A second crossed glow plane keeps the beam readable from more angles.
    const crossedGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, this.beamLength * 0.96), outerMaterial.clone());
    crossedGlow.userData.roll = Math.PI * 0.5;
    crossedGlow.renderOrder = 3;

    this.beamPlanes.push(crossedGlow, outerBeam, midBeam, innerBeam);
    group.add(crossedGlow, outerBeam, midBeam, innerBeam);

    return group;
  }

  private createStarfield(texture: THREE.Texture): THREE.Group {
    const group = new THREE.Group();
    group.add(this.createStarLayer(texture, 52000, 280, 1280, 0.72, 0.9, 0.54));
    group.add(this.createStarLayer(texture, 18000, 210, 1040, 1.38, 0.84, 0.7));
    group.add(this.createStarLayer(texture, 9000, 160, 860, 1.9, 0.9, 0.78));
    return group;
  }

  private createStarLayer(
    texture: THREE.Texture,
    count: number,
    minRadius: number,
    maxRadius: number,
    size: number,
    opacity: number,
    colorMix: number
  ): THREE.Points {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const warm = new THREE.Color(0xfff6e0);
    const cool = new THREE.Color(0xd7e5ff);
    const tint = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const radius = THREE.MathUtils.lerp(minRadius, maxRadius, Math.pow(Math.random(), 0.54));
      const z = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const radial = Math.sqrt(1 - z * z);

      positions[i * 3] = Math.cos(phi) * radial * radius;
      positions[i * 3 + 1] = z * radius;
      positions[i * 3 + 2] = Math.sin(phi) * radial * radius;

      tint.lerpColors(warm, cool, Math.random() * colorMix);
      const intensity = THREE.MathUtils.lerp(0.68, 1.02, Math.pow(Math.random(), 0.24));
      colors[i * 3] = tint.r * intensity;
      colors[i * 3 + 1] = tint.g * intensity;
      colors[i * 3 + 2] = tint.b * intensity;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size,
      map: texture,
      transparent: true,
      opacity,
      vertexColors: true,
      depthWrite: false,
      alphaTest: 0.02,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped: false,
    });

    return new THREE.Points(geometry, material);
  }

  private createGlowTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create glow texture.');
    }

    const center = size * 0.5;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.12, 'rgba(255,255,255,0.98)');
    gradient.addColorStop(0.26, 'rgba(206,223,255,0.86)');
    gradient.addColorStop(0.52, 'rgba(90,128,255,0.34)');
    gradient.addColorStop(1.0, 'rgba(0,0,0,0.0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createRingTexture(): THREE.CanvasTexture {
    const size = 768;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create ring texture.');
    }

    context.clearRect(0, 0, size, size);

    const center = size * 0.5;
    const gradient = context.createRadialGradient(center, center, size * 0.27, center, center, size * 0.5);
    gradient.addColorStop(0.0, 'rgba(255,255,255,0.0)');
    gradient.addColorStop(0.54, 'rgba(255,255,255,0.0)');
    gradient.addColorStop(0.72, 'rgba(255,255,255,0.06)');
    gradient.addColorStop(0.79, 'rgba(255,255,255,0.22)');
    gradient.addColorStop(0.86, 'rgba(255,255,255,0.09)');
    gradient.addColorStop(1.0, 'rgba(255,255,255,0.0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    for (let i = 0; i < 2600; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = size * THREE.MathUtils.lerp(0.37, 0.43, Math.random());
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      const alpha = THREE.MathUtils.lerp(0.03, 0.12, Math.random());
      const dotSize = THREE.MathUtils.lerp(0.4, 1.8, Math.random());

      context.fillStyle = `rgba(255,255,255,${alpha})`;
      context.beginPath();
      context.arc(x, y, dotSize, 0, Math.PI * 2);
      context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createBeamTexture(): THREE.CanvasTexture {
    const width = 128;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create beam texture.');
    }

    const image = context.createImageData(width, height);

    for (let y = 0; y < height; y += 1) {
      const v = y / (height - 1);
      const centerDist = Math.abs(v - 0.5) / 0.5;
      const axial = 1 - THREE.MathUtils.smoothstep(centerDist, 0.82, 1.0);

      for (let x = 0; x < width; x += 1) {
        const u = x / (width - 1);
        const dx = (u - 0.5) / 0.5;
        const core = Math.exp(-dx * dx * 28.0);
        const sheath = Math.exp(-dx * dx * 6.5);
        const alpha = axial * (core * 0.72 + sheath * 0.28);

        const offset = (y * width + x) * 4;
        image.data[offset] = 255;
        image.data[offset + 1] = 255;
        image.data[offset + 2] = 255;
        image.data[offset + 3] = Math.round(alpha * 255);
      }
    }

    context.putImageData(image, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private updateBeamFacing(): void {
    if (!this.camera || !this.magneticGroup || this.beamPlanes.length === 0) {
      return;
    }

    const localCamera = this.magneticGroup.worldToLocal(this.camera.position.clone());
    const toCamera = localCamera.normalize();

    // Tangent lies inside the beam plane, normal makes the plane face the camera.
    this.beamZ.copy(toCamera).addScaledVector(this.beamAxis, -toCamera.dot(this.beamAxis));
    if (this.beamZ.lengthSq() < 1e-6) {
      this.beamZ.set(1, 0, 0);
    } else {
      this.beamZ.normalize();
    }

    this.beamX.crossVectors(this.beamZ, this.beamAxis).normalize();
    this.beamMatrix.makeBasis(this.beamZ, this.beamAxis, this.beamX);

    for (const beam of this.beamPlanes) {
      beam.quaternion.setFromRotationMatrix(this.beamMatrix);
      const roll = beam.userData.roll as number | undefined;
      if (roll) {
        beam.rotateY(roll);
      }
    }
  }
}
