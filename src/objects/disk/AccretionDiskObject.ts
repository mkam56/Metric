import { BlackHoleObject } from '../blackhole/BlackHoleObject';

export type DiskMode = 'thin' | 'thick';

export interface DiskConfig {
  mode: DiskMode;
  outerRadius: number;
  thicknessAtInner: number;
  flarePower: number;
  temperaturePeakK: number;
  absorptionScale: number;
  densityScale: number;
}

export class AccretionDiskObject {
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly mode: DiskMode;
  readonly thicknessAtInner: number;
  readonly flarePower: number;
  readonly temperaturePeakK: number;
  readonly absorptionScale: number;
  readonly densityScale: number;

  constructor(blackHole: BlackHoleObject, config: DiskConfig) {
    this.innerRadius = blackHole.iscoRadiusSchwarzschild();
    this.outerRadius = Math.max(config.outerRadius, this.innerRadius + 1);
    this.mode = config.mode;
    this.thicknessAtInner = Math.max(1e-4, config.thicknessAtInner);
    this.flarePower = Math.max(0, config.flarePower);
    this.temperaturePeakK = Math.max(100, config.temperaturePeakK);
    this.absorptionScale = Math.max(0, config.absorptionScale);
    this.densityScale = Math.max(0, config.densityScale);
  }

  diskHalfHeight(r: number): number {
    const rn = Math.max(r, this.innerRadius) / this.innerRadius;
    return this.thicknessAtInner * Math.pow(rn, this.flarePower);
  }

  novikovThorneShape(r: number): number {
    if (r <= this.innerRadius) return 0;
    const term = 1 - Math.sqrt(this.innerRadius / r);
    if (term <= 0) return 0;
    return Math.pow(r, -0.75) * Math.pow(term, 0.25);
  }

  peakShape(): number {
    const rPeak = this.innerRadius * (49 / 36);
    return this.novikovThorneShape(rPeak);
  }

  temperatureAt(r: number): number {
    const shape = this.novikovThorneShape(r);
    const peak = Math.max(1e-12, this.peakShape());
    return this.temperaturePeakK * (shape / peak);
  }

  densityAt(r: number, z: number): number {
    if (r < this.innerRadius || r > this.outerRadius) return 0;
    const h = Math.max(1e-4, this.diskHalfHeight(r));
    const radial = Math.pow(r / this.innerRadius, -1.5);
    const vertical = Math.exp(-0.5 * (z * z) / (h * h));
    return this.densityScale * radial * vertical;
  }

  absorptionAt(r: number, z: number): number {
    return this.absorptionScale * this.densityAt(r, z);
  }

  emissivityAt(r: number, z: number): number {
    return this.densityAt(r, z) * this.novikovThorneShape(r);
  }
}
