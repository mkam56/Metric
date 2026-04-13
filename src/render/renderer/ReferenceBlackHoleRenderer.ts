import * as THREE from 'three';

import { SchwarzschildMetric } from '../../core/spacetime/SchwarzschildMetric';
import { GeodesicTracer, GeodesicTraceConfig } from '../../core/geodesics/GeodesicTracer';
import { applyRadiativeTransferStep } from '../../core/radiative_transfer/RadiativeTransfer';
import { buildWavelengthGrid, spectrumToTonemappedSrgb } from '../spectral_pipeline/SpectralPipeline';
import { BlackHoleObject } from '../../objects/blackhole/BlackHoleObject';
import { AccretionDiskObject } from '../../objects/disk/AccretionDiskObject';
import { ObserverFrame } from '../../objects/observer/Observer';

function sphericalToCartesian(r: number, theta: number, phi: number): [number, number, number] {
  const st = Math.sin(theta);
  const ct = Math.cos(theta);
  return [r * st * Math.cos(phi), r * ct, r * st * Math.sin(phi)];
}

function dot3(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function norm3(v: [number, number, number]): number {
  return Math.hypot(v[0], v[1], v[2]);
}

function normalize3(v: [number, number, number]): [number, number, number] {
  const n = Math.max(1e-12, norm3(v));
  return [v[0] / n, v[1] / n, v[2] / n];
}

function frac(v: number): number {
  return v - Math.floor(v);
}

function hash2(x: number, y: number): number {
  return frac(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

function halton(index: number, base: number): number {
  let f = 1;
  let r = 0;
  let i = Math.max(1, index);
  while (i > 0) {
    f /= base;
    r += f * (i % base);
    i = Math.floor(i / base);
  }
  return r;
}

function directionFromSpherical(theta: number, phi: number): [number, number, number] {
  const st = Math.sin(theta);
  const ct = Math.cos(theta);
  return [st * Math.cos(phi), ct, st * Math.sin(phi)];
}

export interface ReferenceRenderConfig {
  width: number;
  height: number;
  wavelengths: number;
  samplesPerPixel: number;
  lambdaMinNm: number;
  lambdaMaxNm: number;
  geodesic: GeodesicTraceConfig;
  rEscape: number;
  exposure: number;
  backgroundIntensity: number;
}

export class ReferenceBlackHoleRenderer {
  private readonly metric: SchwarzschildMetric;
  private readonly tracer: GeodesicTracer;
  private readonly blackHole: BlackHoleObject;
  private readonly disk: AccretionDiskObject;

  constructor(blackHole: BlackHoleObject, disk: AccretionDiskObject) {
    this.blackHole = blackHole;
    this.disk = disk;
    this.metric = new SchwarzschildMetric(blackHole.mass);
    this.tracer = new GeodesicTracer(this.metric);
  }

  render(camera: THREE.PerspectiveCamera, config: ReferenceRenderConfig): THREE.DataTexture {
    const observer = this.buildObserver(camera, config.width / config.height);
    const wavelengths = buildWavelengthGrid(config.lambdaMinNm, config.lambdaMaxNm, config.wavelengths);

    const pixels = new Uint8Array(config.width * config.height * 4);

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const spectrum = new Float64Array(wavelengths.length);
        const spp = Math.max(1, config.samplesPerPixel);

        for (let s = 0; s < spp; s++) {
          const jx = halton(s + 1, 2);
          const jy = halton(s + 1, 3);
          const sample = this.traceSpectrum(
            observer,
            x,
            y,
            config.width,
            config.height,
            wavelengths,
            config,
            jx,
            jy
          );
          for (let k = 0; k < spectrum.length; k++) {
            spectrum[k] += sample[k];
          }
        }

        for (let k = 0; k < spectrum.length; k++) {
          spectrum[k] /= spp;
        }

        const [r, g, b] = spectrumToTonemappedSrgb(spectrum, wavelengths, config.exposure);

        const idx = (y * config.width + x) * 4;
        pixels[idx] = Math.min(255, Math.round(r * 255));
        pixels[idx + 1] = Math.min(255, Math.round(g * 255));
        pixels[idx + 2] = Math.min(255, Math.round(b * 255));
        pixels[idx + 3] = 255;
      }
    }

    const tex = new THREE.DataTexture(pixels, config.width, config.height, THREE.RGBAFormat);
    tex.needsUpdate = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.flipY = true;
    return tex;
  }

  private traceSpectrum(
    observer: ObserverFrame,
    px: number,
    py: number,
    width: number,
    height: number,
    wavelengths: Float64Array,
    config: ReferenceRenderConfig,
    sampleOffsetX: number,
    sampleOffsetY: number
  ): Float64Array {
    const intensity = new Float64Array(wavelengths.length);

    const trace = this.tracer.tracePixel(
      observer,
      px,
      py,
      width,
      height,
      config.geodesic,
      sampleOffsetX,
      sampleOffsetY
    );
    if (trace.crossedHorizon || trace.samples.length === 0) {
      return intensity;
    }

    const horizon = this.blackHole.horizonRadiusSchwarzschild();

    for (let i = 0; i < trace.samples.length; i++) {
      const s = trace.samples[i];
      const pos = sphericalToCartesian(s.r, s.theta, s.phi);
      const rCyl = Math.hypot(pos[0], pos[2]);
      const z = pos[1];

      if (rCyl < this.disk.innerRadius || rCyl > this.disk.outerRadius) continue;

      const h = this.disk.mode === 'thin' ? 0.02 * this.blackHole.mass : this.disk.diskHalfHeight(rCyl);
      if (Math.abs(z) > h) continue;

      const density = this.disk.densityAt(rCyl, z);
      if (density <= 0) continue;

      const temp = this.disk.temperatureAt(rCyl);
      const emissivity = this.disk.emissivityAt(rCyl, z);
      const absorption = this.disk.absorptionAt(rCyl, z);

      const tangent: [number, number, number] = normalize3([-pos[2], 0, pos[0]]);
      const photonSpatial: [number, number, number] = normalize3([s.pr, s.ptheta / Math.max(s.r, 1e-8), s.pphi / Math.max(s.r * Math.sin(Math.max(1e-6, s.theta)), 1e-8)]);

      const v = Math.sqrt(this.blackHole.mass / Math.max(1e-8, rCyl - horizon));
      const vClamped = Math.min(0.999, Math.max(0, v));
      const gamma = 1 / Math.sqrt(1 - vClamped * vClamped);
      const grav = Math.sqrt(Math.max(1e-10, 1 - horizon / s.r));

      const mu = dot3(tangent, photonSpatial);
      const doppler = 1 / (gamma * Math.max(1e-6, 1 - vClamped * mu));
      const gFactor = grav * doppler;

      const ds = s.dlambda;
      applyRadiativeTransferStep(
        intensity,
        wavelengths,
        ds,
        gFactor,
        temp,
        emissivity,
        absorption
      );

      const totalI = intensity.reduce((acc, value) => acc + value, 0);
      if (totalI < 1e-24 && i > 20) {
        break;
      }
    }

    if (trace.escaped && trace.samples.length > 0) {
      const sLast = trace.samples[trace.samples.length - 1];
      const dir = directionFromSpherical(sLast.theta, sLast.phi);
      const star = this.backgroundStarfield(dir, px, py);
      for (let i = 0; i < wavelengths.length; i++) {
        intensity[i] += star * config.backgroundIntensity;
      }
    }

    return intensity;
  }

  private backgroundStarfield(dir: [number, number, number], px: number, py: number): number {
    const u = 0.5 + Math.atan2(dir[2], dir[0]) / (2 * Math.PI);
    const v = Math.acos(Math.min(1, Math.max(-1, dir[1]))) / Math.PI;
    const scale = 720;
    const gx = Math.floor(u * scale);
    const gy = Math.floor(v * scale);

    const seed = hash2(gx, gy);
    if (seed < 0.9965) {
      return 2e-3;
    }

    const sparkle = 0.7 + 0.3 * hash2(px + gx * 0.1, py + gy * 0.1);
    return sparkle * (0.3 + 3.0 * Math.pow((seed - 0.9965) / (1 - 0.9965), 2));
  }

  private buildObserver(camera: THREE.PerspectiveCamera, aspect: number): ObserverFrame {
    const forwardV = new THREE.Vector3();
    camera.getWorldDirection(forwardV);
    const rightV = new THREE.Vector3().crossVectors(forwardV, camera.up).normalize();
    const upV = new THREE.Vector3().crossVectors(rightV, forwardV).normalize();

    return {
      position: [camera.position.x, camera.position.y, camera.position.z],
      forward: normalize3([forwardV.x, forwardV.y, forwardV.z]),
      right: normalize3([rightV.x, rightV.y, rightV.z]),
      up: normalize3([upV.x, upV.y, upV.z]),
      verticalFovRad: THREE.MathUtils.degToRad(camera.fov),
      aspect,
    };
  }
}
