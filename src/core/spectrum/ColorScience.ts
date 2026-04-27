const PLANCK_H = 6.62607015e-34;
const LIGHT_C = 2.99792458e8;
const BOLTZMANN_K = 1.380649e-23;

export interface SpectralSample {
  wavelengthNm: number;
  value: number;
}

export function blackbodyRadianceWavelength(wavelengthNm: number, temperatureK: number): number {
  const lambda = wavelengthNm * 1e-9;
  const t = Math.max(temperatureK, 1);
  const c1 = 2 * PLANCK_H * LIGHT_C * LIGHT_C;
  const c2 = (PLANCK_H * LIGHT_C) / (BOLTZMANN_K * t * lambda);
  const expTerm = Math.exp(Math.min(700, c2));
  const denom = Math.max(expTerm - 1, 1e-20);
  return c1 / (Math.pow(lambda, 5) * denom);
}

function cieX(lambdaNm: number): number {
  const l = lambdaNm;
  const t1 = 1.056 * Math.exp(-0.5 * Math.pow((l - 599.8) / 37.9, 2));
  const t2 = 0.362 * Math.exp(-0.5 * Math.pow((l - 442.0) / 16.0, 2));
  const t3 = -0.065 * Math.exp(-0.5 * Math.pow((l - 501.1) / 20.4, 2));
  return Math.max(0, t1 + t2 + t3);
}

function cieY(lambdaNm: number): number {
  const l = lambdaNm;
  return (
    0.821 * Math.exp(-0.5 * Math.pow((l - 568.8) / 46.9, 2)) +
    0.286 * Math.exp(-0.5 * Math.pow((l - 530.9) / 16.3, 2))
  );
}

function cieZ(lambdaNm: number): number {
  const l = lambdaNm;
  return (
    1.217 * Math.exp(-0.5 * Math.pow((l - 437.0) / 11.8, 2)) +
    0.681 * Math.exp(-0.5 * Math.pow((l - 459.0) / 26.0, 2))
  );
}

export function xyzToLinearSrgb(x: number, y: number, z: number): [number, number, number] {
  const r = 3.2406 * x - 1.5372 * y - 0.4986 * z;
  const g = -0.9689 * x + 1.8758 * y + 0.0415 * z;
  const b = 0.0557 * x - 0.204 * y + 1.057 * z;
  return [r, g, b];
}

export function integrateSpectrumToXYZ(samples: SpectralSample[]): [number, number, number] {
  if (samples.length === 0) return [0, 0, 0];

  let x = 0;
  let y = 0;
  let z = 0;

  for (let i = 0; i < samples.length; i++) {
    const lambda = samples[i].wavelengthNm;
    const value = samples[i].value;
    const dl = i === 0
      ? (samples.length > 1 ? samples[1].wavelengthNm - samples[0].wavelengthNm : 1)
      : samples[i].wavelengthNm - samples[i - 1].wavelengthNm;

    x += value * cieX(lambda) * dl;
    y += value * cieY(lambda) * dl;
    z += value * cieZ(lambda) * dl;
  }

  return [x, y, z];
}

export function acesToneMap(v: number): number {
  const a = 2.51;
  const b = 0.03;
  const c = 2.43;
  const d = 0.59;
  const e = 0.14;
  return Math.min(1, Math.max(0, (v * (a * v + b)) / (v * (c * v + d) + e)));
}

export function reinhardToneMap(v: number): number {
  return v / (1 + v);
}
