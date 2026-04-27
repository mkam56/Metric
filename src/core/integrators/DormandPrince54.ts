export interface ODESystem {
  eval(lambda: number, state: Float64Array, out: Float64Array): void;
}

export interface AdaptiveStepResult {
  accepted: boolean;
  usedStep: number;
  suggestedStep: number;
}

export class DormandPrince54 {
  private readonly dim: number;
  private readonly k1: Float64Array;
  private readonly k2: Float64Array;
  private readonly k3: Float64Array;
  private readonly k4: Float64Array;
  private readonly k5: Float64Array;
  private readonly k6: Float64Array;
  private readonly k7: Float64Array;
  private readonly tmp: Float64Array;
  private readonly y5: Float64Array;
  private readonly y4: Float64Array;

  constructor(dimension: number) {
    this.dim = dimension;
    this.k1 = new Float64Array(dimension);
    this.k2 = new Float64Array(dimension);
    this.k3 = new Float64Array(dimension);
    this.k4 = new Float64Array(dimension);
    this.k5 = new Float64Array(dimension);
    this.k6 = new Float64Array(dimension);
    this.k7 = new Float64Array(dimension);
    this.tmp = new Float64Array(dimension);
    this.y5 = new Float64Array(dimension);
    this.y4 = new Float64Array(dimension);
  }

  step(
    system: ODESystem,
    lambda: number,
    state: Float64Array,
    h: number,
    absTol: number,
    relTol: number,
    output: Float64Array
  ): AdaptiveStepResult {
    const n = this.dim;

    system.eval(lambda, state, this.k1);

    for (let i = 0; i < n; i++) {
      this.tmp[i] = state[i] + h * (1 / 5) * this.k1[i];
    }
    system.eval(lambda + h * (1 / 5), this.tmp, this.k2);

    for (let i = 0; i < n; i++) {
      this.tmp[i] = state[i] + h * ((3 / 40) * this.k1[i] + (9 / 40) * this.k2[i]);
    }
    system.eval(lambda + h * (3 / 10), this.tmp, this.k3);

    for (let i = 0; i < n; i++) {
      this.tmp[i] = state[i] + h * ((44 / 45) * this.k1[i] + (-56 / 15) * this.k2[i] + (32 / 9) * this.k3[i]);
    }
    system.eval(lambda + h * (4 / 5), this.tmp, this.k4);

    for (let i = 0; i < n; i++) {
      this.tmp[i] = state[i] + h * ((19372 / 6561) * this.k1[i] + (-25360 / 2187) * this.k2[i] + (64448 / 6561) * this.k3[i] + (-212 / 729) * this.k4[i]);
    }
    system.eval(lambda + h * (8 / 9), this.tmp, this.k5);

    for (let i = 0; i < n; i++) {
      this.tmp[i] = state[i] + h * ((9017 / 3168) * this.k1[i] + (-355 / 33) * this.k2[i] + (46732 / 5247) * this.k3[i] + (49 / 176) * this.k4[i] + (-5103 / 18656) * this.k5[i]);
    }
    system.eval(lambda + h, this.tmp, this.k6);

    for (let i = 0; i < n; i++) {
      this.tmp[i] = state[i] + h * ((35 / 384) * this.k1[i] + (500 / 1113) * this.k3[i] + (125 / 192) * this.k4[i] + (-2187 / 6784) * this.k5[i] + (11 / 84) * this.k6[i]);
    }
    system.eval(lambda + h, this.tmp, this.k7);

    for (let i = 0; i < n; i++) {
      this.y5[i] = state[i] + h * ((35 / 384) * this.k1[i] + (500 / 1113) * this.k3[i] + (125 / 192) * this.k4[i] + (-2187 / 6784) * this.k5[i] + (11 / 84) * this.k6[i]);
      this.y4[i] = state[i] + h * ((5179 / 57600) * this.k1[i] + (7571 / 16695) * this.k3[i] + (393 / 640) * this.k4[i] + (-92097 / 339200) * this.k5[i] + (187 / 2100) * this.k6[i] + (1 / 40) * this.k7[i]);
    }

    let errNorm = 0;
    for (let i = 0; i < n; i++) {
      const scale = absTol + relTol * Math.max(Math.abs(state[i]), Math.abs(this.y5[i]));
      const e = (this.y5[i] - this.y4[i]) / Math.max(scale, 1e-20);
      errNorm += e * e;
    }
    errNorm = Math.sqrt(errNorm / n);

    const safety = 0.9;
    const exponent = 1 / 5;
    const minScale = 0.2;
    const maxScale = 5.0;

    if (errNorm <= 1) {
      output.set(this.y5);
      const scale = errNorm === 0 ? maxScale : Math.min(maxScale, Math.max(minScale, safety * Math.pow(errNorm, -exponent)));
      return {
        accepted: true,
        usedStep: h,
        suggestedStep: h * scale,
      };
    }

    const scale = Math.min(1.0, Math.max(minScale, safety * Math.pow(Math.max(errNorm, 1e-12), -exponent)));
    return {
      accepted: false,
      usedStep: h,
      suggestedStep: h * scale,
    };
  }
}
