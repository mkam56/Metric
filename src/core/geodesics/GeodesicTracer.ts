import { DormandPrince54 } from '../integrators/DormandPrince54';
import { SchwarzschildMetric } from '../spacetime/SchwarzschildMetric';
import { SchwarzschildHamiltonianSystem } from './SchwarzschildHamiltonianSystem';
import { ObserverFrame, rayDirectionFromPixel } from '../../objects/observer/Observer';

export interface GeodesicSample {
  r: number;
  theta: number;
  phi: number;
  pr: number;
  ptheta: number;
  pphi: number;
  pt: number;
  dlambda: number;
}

export interface GeodesicTraceResult {
  escaped: boolean;
  crossedHorizon: boolean;
  samples: GeodesicSample[];
}

export interface GeodesicTraceConfig {
  rEscape: number;
  maxSteps: number;
  absTol: number;
  relTol: number;
  initialStep: number;
  minStep: number;
  maxStep: number;
}

function cartesianToSpherical(x: number, y: number, z: number): [number, number, number] {
  const r = Math.max(1e-9, Math.hypot(x, y, z));
  const theta = Math.acos(Math.min(1, Math.max(-1, y / r)));
  const phi = Math.atan2(z, x);
  return [r, theta, phi];
}

function sphericalBasis(theta: number, phi: number): {
  er: [number, number, number];
  etheta: [number, number, number];
  ephi: [number, number, number];
} {
  const st = Math.sin(theta);
  const ct = Math.cos(theta);
  const sp = Math.sin(phi);
  const cp = Math.cos(phi);

  const er: [number, number, number] = [st * cp, ct, st * sp];
  const etheta: [number, number, number] = [ct * cp, -st, ct * sp];
  const ephi: [number, number, number] = [-sp, 0, cp];

  return { er, etheta, ephi };
}

function dot3(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export class GeodesicTracer {
  private readonly metric: SchwarzschildMetric;
  private readonly system: SchwarzschildHamiltonianSystem;
  private readonly integrator: DormandPrince54;

  constructor(metric: SchwarzschildMetric) {
    this.metric = metric;
    this.system = new SchwarzschildHamiltonianSystem(metric);
    this.integrator = new DormandPrince54(8);
  }

  tracePixel(
    observer: ObserverFrame,
    px: number,
    py: number,
    width: number,
    height: number,
    config: GeodesicTraceConfig,
    sampleOffsetX: number = 0.5,
    sampleOffsetY: number = 0.5
  ): GeodesicTraceResult {
    const [x0, y0, z0] = observer.position;
    const [r0, theta0, phi0] = cartesianToSpherical(x0, y0, z0);
    const rayDir = rayDirectionFromPixel(observer, px, py, width, height, sampleOffsetX, sampleOffsetY);

    const basis = sphericalBasis(theta0, phi0);
    const nR = dot3(rayDir, basis.er);
    const nTheta = dot3(rayDir, basis.etheta);
    const nPhi = dot3(rayDir, basis.ephi);

    const f = Math.max(1e-10, this.metric.lapse(r0));

    const pCov = new Float64Array(8);
    pCov[0] = 0;
    pCov[1] = r0;
    pCov[2] = theta0;
    pCov[3] = phi0;

    const pt = -1;
    const pr = nR / f;
    const ptheta = r0 * nTheta;
    const pphi = r0 * Math.sin(theta0) * nPhi;

    pCov[4] = pt;
    pCov[5] = pr;
    pCov[6] = ptheta;
    pCov[7] = pphi;

    const horizon = this.metric.horizonRadius();
    const out = new Float64Array(8);
    const samples: GeodesicSample[] = [];

    let lambda = 0;
    let h = config.initialStep;

    for (let i = 0; i < config.maxSteps; i++) {
      const r = pCov[1];
      if (r <= horizon * 1.0005) {
        return { escaped: false, crossedHorizon: true, samples };
      }
      if (r >= config.rEscape) {
        return { escaped: true, crossedHorizon: false, samples };
      }

      const result = this.integrator.step(
        this.system,
        lambda,
        pCov,
        h,
        config.absTol,
        config.relTol,
        out
      );

      h = Math.max(config.minStep, Math.min(config.maxStep, result.suggestedStep));
      if (!result.accepted) continue;

      const used = result.usedStep;
      lambda += used;
      pCov.set(out);

      samples.push({
        r: pCov[1],
        theta: pCov[2],
        phi: pCov[3],
        pr: pCov[5],
        ptheta: pCov[6],
        pphi: pCov[7],
        pt: pCov[4],
        dlambda: used,
      });
    }

    return {
      escaped: pCov[1] >= config.rEscape,
      crossedHorizon: pCov[1] <= horizon * 1.0005,
      samples,
    };
  }

  constraintValue(state: Float64Array): number {
    return this.system.hamiltonianConstraint(state);
  }
}
