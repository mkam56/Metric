import { blackbodyRadianceWavelength } from '../spectrum/ColorScience';

export function applyRadiativeTransferStep(
  intensity: Float64Array,
  wavelengthsNm: Float64Array,
  dsProper: number,
  gFactor: number,
  temperatureK: number,
  emissivityScale: number,
  absorption: number
): void {
  const g = Math.max(1e-6, gFactor);
  const g5 = g * g * g * g * g;

  for (let i = 0; i < intensity.length; i++) {
    const lambdaObs = wavelengthsNm[i];
    const lambdaEm = lambdaObs * g;
    const source = emissivityScale * blackbodyRadianceWavelength(lambdaEm, temperatureK);

    const dI = (g5 * source - absorption * intensity[i]) * dsProper;
    intensity[i] = Math.max(0, intensity[i] + dI);
  }
}
