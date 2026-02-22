// No Three.js imports — pure math only.
// AccretionDiskModel is now a data-provider: it computes scalar parameters
// consumed by the ray-march shader as uniforms.
import { BlackHoleModel } from '../blackhole/BlackHoleModel';

export class AccretionDiskModel {
  readonly innerRadius: number;
  readonly outerRadius: number;

  // Temperature normalization constant passed to the shader as uTempScale.
  // Equals the value of T_raw at its analytical peak r_peak = r_isco * 49/36.
  readonly tempScale: number;

  constructor(innerRadius: number, outerRadius: number, blackHole: BlackHoleModel) {
    // Clamp inner edge to ISCO — no stable circular orbits below it.
    this.innerRadius = Math.max(innerRadius, blackHole.iscoRadius);
    this.outerRadius = outerRadius;

    // Analytical peak of T(r) = r^{-3/4}*(1-sqrt(r_in/r))^{1/4}
    // dT/dr = 0 at r_peak = r_in * 49/36
    const rPeak = this.innerRadius * (49 / 36);
    this.tempScale = this._tempRaw(rPeak);
  }

  // Unnormalized Novikov-Thorne temperature profile.
  private _tempRaw(r: number): number {
    const t = 1 - Math.sqrt(this.innerRadius / r);
    if (t <= 0) return 0;
    return Math.pow(r, -0.75) * Math.pow(t, 0.25);
  }
}
