import {
  SpectralSample,
  integrateSpectrumToXYZ,
  xyzToLinearSrgb,
  acesToneMap,
} from '../../core/spectrum/ColorScience';

export function buildWavelengthGrid(lambdaMinNm: number, lambdaMaxNm: number, n: number): Float64Array {
  const count = Math.max(2, n);
  const grid = new Float64Array(count);
  const dl = (lambdaMaxNm - lambdaMinNm) / (count - 1);
  for (let i = 0; i < count; i++) {
    grid[i] = lambdaMinNm + i * dl;
  }
  return grid;
}

export function spectrumToTonemappedSrgb(intensity: Float64Array, wavelengthsNm: Float64Array, exposure: number): [number, number, number] {
  const samples: SpectralSample[] = [];
  for (let i = 0; i < intensity.length; i++) {
    samples.push({ wavelengthNm: wavelengthsNm[i], value: intensity[i] * exposure });
  }

  const [x, y, z] = integrateSpectrumToXYZ(samples);
  let [r, g, b] = xyzToLinearSrgb(x, y, z);

  r = acesToneMap(Math.max(0, r));
  g = acesToneMap(Math.max(0, g));
  b = acesToneMap(Math.max(0, b));

  return [r, g, b];
}
