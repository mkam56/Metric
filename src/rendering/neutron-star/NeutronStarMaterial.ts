import * as THREE from 'three';
import { NeutronStarModel } from '../../physics/neutron-star/NeutronStarModel';

import {
  magnetosphereVertex,
  magnetosphereFragment,
} from './shaders/neutron-star';

export interface NeutronStarObjects {
  star: THREE.Mesh;
  glowShell: THREE.Mesh;
  innerGlowShell: THREE.Mesh;
  northSpot: THREE.Mesh;
  southSpot: THREE.Mesh;
  magnetosphere: THREE.Points;
  stars: THREE.Points;
  pointLight: THREE.PointLight;
  ambientLight: THREE.AmbientLight;
}

export function createNeutronStarObjects(model: NeutronStarModel): NeutronStarObjects {
  const starGeometry = new THREE.SphereGeometry(model.radius, 64, 64);
  const starMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfe2ff,
    emissive: 0x5aaaff,
    emissiveIntensity: model.glowIntensity * 1.2,
    roughness: 0.75,
    metalness: 0.0,
  });

  const star = new THREE.Mesh(starGeometry, starMaterial);
  star.rotation.z = 0.18;

  const glowGeometry = new THREE.SphereGeometry(
    model.radius * model.outerGlowScale,
    64,
    64
  );
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x5ea8ff,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glowShell = new THREE.Mesh(glowGeometry, glowMaterial);

  const innerGlowGeometry = new THREE.SphereGeometry(
    model.radius * model.innerGlowScale,
    64,
    64
  );
  const innerGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xaee6ff,
    transparent: true,
    opacity: 0.10,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const innerGlowShell = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);

  const spotGeometry = new THREE.CircleGeometry(model.hotSpotSize * model.radius, 32);
  const spotMaterial = new THREE.MeshBasicMaterial({
    color: 0xeaffff,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const northSpot = new THREE.Mesh(spotGeometry, spotMaterial.clone());
  const southSpot = new THREE.Mesh(spotGeometry, spotMaterial.clone());

  const spotOffset = model.radius * model.hotSpotOffset;
  northSpot.position.set(0, spotOffset, 0);
  southSpot.position.set(0, -spotOffset, 0);

  northSpot.rotation.x = -Math.PI / 2;
  southSpot.rotation.x = Math.PI / 2;

  star.add(northSpot);
  star.add(southSpot);

  // Magnetosphere
  const count = 2000;
  const magnetospherePositions = new Float32Array(count * 3);
  const magnetosphereSizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = model.radius * (1.8 + Math.random() * 2.2);
    const theta = Math.acos((Math.random() - 0.5) * 1.2);
    const phi = Math.random() * Math.PI * 2;

    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.cos(theta) * 0.6;
    const z = r * Math.sin(theta) * Math.sin(phi);

    magnetospherePositions[i * 3] = x;
    magnetospherePositions[i * 3 + 1] = y;
    magnetospherePositions[i * 3 + 2] = z;

    magnetosphereSizes[i] = 0.5 + Math.random();
  }

  const magnetosphereGeometry = new THREE.BufferGeometry();
  magnetosphereGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(magnetospherePositions, 3)
  );
  magnetosphereGeometry.setAttribute(
    'aSize',
    new THREE.BufferAttribute(magnetosphereSizes, 1)
  );

  const magnetosphereMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: magnetosphereVertex,
    fragmentShader: magnetosphereFragment,
  });

  const magnetosphere = new THREE.Points(
    magnetosphereGeometry,
    magnetosphereMaterial
  );

  star.add(magnetosphere);

  const positions = new Float32Array(model.backgroundStarCount * 3);
  const colors = new Float32Array(model.backgroundStarCount * 3);

  for (let i = 0; i < model.backgroundStarCount; i++) {
    const r = 320;

    positions[i * 3] = (Math.random() - 0.5) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * r;
    positions[i * 3 + 2] = (Math.random() - 0.5) * r;

    const intensity = 0.35 + Math.random() * 0.65;
    const tint = Math.random();

    let rCol = intensity;
    let gCol = intensity;
    let bCol = intensity;

    if (tint < 0.22) {
      rCol *= 0.78;
      gCol *= 0.88;
      bCol *= 1.15;
    } else if (tint > 0.82) {
      rCol *= 1.12;
      gCol *= 0.94;
      bCol *= 0.76;
    }

    colors[i * 3] = Math.min(rCol, 1.0);
    colors[i * 3 + 1] = Math.min(gCol, 1.0);
    colors[i * 3 + 2] = Math.min(bCol, 1.0);
  }

  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const starsMaterial = new THREE.PointsMaterial({
    size: 0.45,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    vertexColors: true,
    depthWrite: false,
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);

  const pointLight = new THREE.PointLight(0xaad4ff, 16, 240);
  pointLight.position.set(0, 0, 0);

  return {
    star,
    glowShell,
    innerGlowShell,
    northSpot,
    southSpot,
    magnetosphere,
    stars,
    pointLight,
    ambientLight,
  };
}