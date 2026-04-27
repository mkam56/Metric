import { ODESystem } from '../integrators/DormandPrince54';
import { SchwarzschildMetric } from '../spacetime/SchwarzschildMetric';

export interface GeodesicState {
  t: number;
  r: number;
  theta: number;
  phi: number;
  pt: number;
  pr: number;
  ptheta: number;
  pphi: number;
}

export class SchwarzschildHamiltonianSystem implements ODESystem {
  private readonly metric: SchwarzschildMetric;

  constructor(metric: SchwarzschildMetric) {
    this.metric = metric;
  }

  eval(_lambda: number, state: Float64Array, out: Float64Array): void {
    const r = Math.max(1e-8, state[1]);
    const theta = Math.min(Math.PI - 1e-7, Math.max(1e-7, state[2]));

    const gInv = this.metric.inverseMetric(r, theta);
    const dInv = this.metric.inverseDerivatives(r, theta);

    const pt = state[4];
    const pr = state[5];
    const ptheta = state[6];
    const pphi = state[7];

    out[0] = gInv.gtt * pt;
    out[1] = gInv.grr * pr;
    out[2] = gInv.gthth * ptheta;
    out[3] = gInv.gphph * pphi;

    out[4] = 0;

    out[5] = -0.5 * (dInv.dr_gtt * pt * pt + dInv.dr_grr * pr * pr + dInv.dr_gthth * ptheta * ptheta + dInv.dr_gphph * pphi * pphi);

    out[6] = -0.5 * dInv.dth_gphph * pphi * pphi;

    out[7] = 0;
  }

  hamiltonianConstraint(state: Float64Array): number {
    const r = Math.max(1e-8, state[1]);
    const theta = Math.min(Math.PI - 1e-7, Math.max(1e-7, state[2]));
    const gInv = this.metric.inverseMetric(r, theta);

    const pt = state[4];
    const pr = state[5];
    const ptheta = state[6];
    const pphi = state[7];

    return 0.5 * (gInv.gtt * pt * pt + gInv.grr * pr * pr + gInv.gthth * ptheta * ptheta + gInv.gphph * pphi * pphi);
  }
}
