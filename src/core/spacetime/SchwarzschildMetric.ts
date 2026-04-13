export interface SchwarzschildContravariantMetric {
  gtt: number;
  grr: number;
  gthth: number;
  gphph: number;
}

export interface SchwarzschildInverseDerivatives {
  dr_gtt: number;
  dr_grr: number;
  dr_gthth: number;
  dr_gphph: number;
  dth_gphph: number;
}

export class SchwarzschildMetric {
  readonly mass: number;

  constructor(mass: number) {
    this.mass = mass;
  }

  horizonRadius(): number {
    return 2 * this.mass;
  }

  lapse(r: number): number {
    return 1 - (2 * this.mass) / r;
  }

  inverseMetric(r: number, theta: number): SchwarzschildContravariantMetric {
    const sinTheta = Math.max(1e-8, Math.sin(theta));
    const sin2 = sinTheta * sinTheta;
    const f = Math.max(1e-10, this.lapse(r));

    return {
      gtt: -1 / f,
      grr: f,
      gthth: 1 / (r * r),
      gphph: 1 / (r * r * sin2),
    };
  }

  inverseDerivatives(r: number, theta: number): SchwarzschildInverseDerivatives {
    const sinTheta = Math.max(1e-8, Math.sin(theta));
    const cosTheta = Math.cos(theta);
    const sin2 = sinTheta * sinTheta;
    const sin3 = sin2 * sinTheta;
    const f = Math.max(1e-10, this.lapse(r));
    const twoMOverR2 = (2 * this.mass) / (r * r);

    return {
      dr_gtt: twoMOverR2 / (f * f),
      dr_grr: twoMOverR2,
      dr_gthth: -2 / (r * r * r),
      dr_gphph: -2 / (r * r * r * sin2),
      dth_gphph: (-2 * cosTheta) / (r * r * sin3),
    };
  }
}
