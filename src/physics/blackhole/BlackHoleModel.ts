// Normalized units: G = 1, c = 1. All radii in simulation length units.

export class BlackHoleModel {
  readonly mass: number;

  // Schwarzschild radius: r_s = 2M  (event horizon)
  readonly schwarzschildRadius: number;

  // Photon sphere: r_ph = 3M  (unstable circular photon orbit)
  readonly photonSphereRadius: number;

  // ISCO (Innermost Stable Circular Orbit): r_isco = 6M
  readonly iscoRadius: number;

  constructor(mass: number) {
    this.mass = mass;
    this.schwarzschildRadius = 2 * mass;
    this.photonSphereRadius  = 3 * mass;
    this.iscoRadius          = 6 * mass;
  }

  // Keplerian angular velocity from Schwarzschild geodesics (timelike circular orbit):
  // Ω = sqrt(M / r³)  — identical in form to Newtonian but exact for Schwarzschild.
  angularVelocity(r: number): number {
    return Math.sqrt(this.mass / (r * r * r));
  }

  // Locally-measured orbital speed (ZAMO frame):
  // v_local = sqrt(M / (r - 2M))
  // Diverges at r_s; only valid for r > r_isco in stable orbits.
  localOrbitalVelocity(r: number): number {
    return Math.sqrt(this.mass / (r - this.schwarzschildRadius));
  }

  // Specific orbital energy (conserved, per unit rest mass) for circular geodesic:
  // E = (1 - 2M/r) / sqrt(1 - 3M/r)
  // From Schwarzschild effective potential; minimum at r_isco.
  orbitalEnergy(r: number): number {
    return (1 - this.schwarzschildRadius / r) / Math.sqrt(1 - 3 * this.mass / r);
  }

  // Gravitational time dilation factor (proper time / coordinate time):
  // τ/t = sqrt(1 - 2M/r)  — approaches 0 at the horizon.
  timeDilation(r: number): number {
    return Math.sqrt(1 - this.schwarzschildRadius / r);
  }

  // Gravitational redshift factor (observed frequency ratio, emitter at r to observer at ∞):
  // z_factor = 1 / sqrt(1 - 2M/r)  — inverse of time dilation.
  gravitationalRedshift(r: number): number {
    return 1 / this.timeDilation(r);
  }

  // Combined relativistic Doppler + gravitational blueshift/redshift factor:
  // g = sqrt(1 - 2M/r) / (1 - v_local · cos α)
  // cosAlpha: cosine of angle between velocity vector and line-of-sight (observer direction).
  dopplerFactor(r: number, cosAlpha: number): number {
    return this.timeDilation(r) / (1 - this.localOrbitalVelocity(r) * cosAlpha);
  }
}
