// No Three.js imports — pure math only.

export class ObserverModel {
  x: number;
  y: number;
  z: number;

  // Camera forward direction (unit vector). Used for future view-angle effects.
  fx: number;
  fy: number;
  fz: number;

  constructor(x: number, y: number, z: number, fx = 0, fy = 0, fz = -1) {
    this.x = x; this.y = y; this.z = z;
    const len = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
    this.fx = fx / len; this.fy = fy / len; this.fz = fz / len;
  }

  // Update position and forward direction to match camera each frame.
  setFromCamera(x: number, y: number, z: number, fx: number, fy: number, fz: number): void {
    this.x = x; this.y = y; this.z = z;
    const len = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
    this.fx = fx / len; this.fy = fy / len; this.fz = fz / len;
  }

  // Normalized line-of-sight vector: particle → observer.
  lineOfSightUnit(px: number, py: number, pz: number): [number, number, number] {
    const lx = this.x - px;
    const ly = this.y - py;
    const lz = this.z - pz;
    const len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    return [lx / len, ly / len, lz / len];
  }

  // cos α = dot(v̂, l̂)
  // (vx,vy,vz) — particle velocity vector (need not be normalized)
  cosAlpha(px: number, py: number, pz: number, vx: number, vy: number, vz: number): number {
    const [lx, ly, lz] = this.lineOfSightUnit(px, py, pz);
    const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (vLen === 0) return 0;
    return (vx * lx + vy * ly + vz * lz) / vLen;
  }
}
