// No Three.js imports — pure math only.
// Normalized units by default: G = 1, c = 1.

export interface PulsarOptions {
  mass?: number;
  radius?: number;
  magneticAxisInclination?: number;
  momentOfInertiaFactor?: number;
}

export class PulsarModel {
  readonly mass: number;
  readonly radius: number;
  readonly rotationPeriod: number;
  readonly magneticFieldStrength: number;
  readonly magneticAxisInclination: number;
  readonly momentOfInertiaFactor: number;

  // Schwarzschild radius: r_s = 2M.
  readonly schwarzschildRadius: number;

  // Compactness: C = r_s / R = 2M / R.
  readonly compactness: number;

  // Angular velocity: Ω = 2π / P.
  readonly angularVelocity: number;

  // Light cylinder: r_lc = c / Ω, and c = 1 in normalized units.
  readonly lightCylinderRadius: number;

  // Rough neutron-star moment of inertia: I ~= k M R^2.
  readonly momentOfInertia: number;

  // Dipole magnetic moment magnitude: μ ~= B R^3 / 2.
  readonly magneticDipoleMoment: number;

  constructor(
    rotationPeriod: number,
    magneticFieldStrength: number,
    options: PulsarOptions = {}
  ) {
    this.rotationPeriod = Math.max(rotationPeriod, 1e-6);
    this.magneticFieldStrength = Math.max(magneticFieldStrength, 0);
    this.mass = options.mass ?? 0.2;
    this.radius = options.radius ?? 0.7;
    this.magneticAxisInclination = options.magneticAxisInclination ?? Math.PI / 6;
    this.momentOfInertiaFactor = options.momentOfInertiaFactor ?? 0.35;

    this.schwarzschildRadius = 2 * this.mass;
    this.compactness = this.schwarzschildRadius / this.radius;
    this.angularVelocity = (2 * Math.PI) / this.rotationPeriod;
    this.lightCylinderRadius = 1 / this.angularVelocity;
    this.momentOfInertia =
      this.momentOfInertiaFactor * this.mass * this.radius * this.radius;
    this.magneticDipoleMoment =
      0.5 * this.magneticFieldStrength * Math.pow(this.radius, 3);
  }

  // Surface gravity in relativistic units, approximated by GM/R^2.
  surfaceGravity(): number {
    return this.mass / (this.radius * this.radius);
  }

  // Proper-time / coordinate-time factor in Schwarzschild spacetime.
  timeDilationAtRadius(r: number): number {
    const safeR = Math.max(r, this.schwarzschildRadius * (1 + 1e-6));
    return Math.sqrt(Math.max(1 - this.schwarzschildRadius / safeR, 0));
  }

  // Observed/emitted frequency ratio for static emission at radius r.
  gravitationalRedshiftAtRadius(r: number): number {
    const dilation = this.timeDilationAtRadius(r);
    return dilation > 0 ? 1 / dilation : Number.POSITIVE_INFINITY;
  }

  // Surface gravitational redshift z = 1/sqrt(1-r_s/R) - 1.
  surfaceRedshift(): number {
    return this.gravitationalRedshiftAtRadius(this.radius) - 1;
  }

  // Corotation speed v = Ω r_perp, capped below c for numerical safety.
  corotationSpeed(r: number, polarAngle = Math.PI / 2): number {
    const cylindricalRadius = Math.max(r, 0) * Math.sin(polarAngle);
    return Math.min(this.angularVelocity * cylindricalRadius, 0.999999);
  }

  // Equatorial speed at the stellar surface.
  equatorialSurfaceSpeed(): number {
    return this.corotationSpeed(this.radius, Math.PI / 2);
  }

  // Lorentz gamma factor of corotating plasma.
  lorentzFactor(v: number): number {
    const beta = Math.min(Math.abs(v), 0.999999);
    return 1 / Math.sqrt(1 - beta * beta);
  }

  // Approximate opening angle of the last open dipole field line.
  // For small angles: sin^2(theta_pc) ~= R / r_lc.
  polarCapOpeningAngle(): number {
    const ratio = Math.min(Math.max(this.radius / this.lightCylinderRadius, 0), 1);
    return Math.asin(Math.sqrt(ratio));
  }

  // Polar-cap radius on the stellar surface.
  polarCapRadius(): number {
    return this.radius * Math.sin(this.polarCapOpeningAngle());
  }

  // Dipole magnetic field magnitude:
  // |B| = (μ / r^3) * sqrt(1 + 3 cos^2(theta))
  // where theta is the angle from the magnetic axis.
  dipoleFieldStrength(r: number, magneticColatitude: number): number {
    const safeR = Math.max(r, this.radius);
    const muOverR3 = this.magneticDipoleMoment / Math.pow(safeR, 3);
    const c = Math.cos(magneticColatitude);
    return muOverR3 * Math.sqrt(1 + 3 * c * c);
  }

  // Dipole field components (r, theta) in magnetic coordinates.
  dipoleFieldComponents(r: number, magneticColatitude: number): [number, number] {
    const safeR = Math.max(r, this.radius);
    const scale = this.magneticDipoleMoment / Math.pow(safeR, 3);
    const br = 2 * scale * Math.cos(magneticColatitude);
    const bTheta = scale * Math.sin(magneticColatitude);
    return [br, bTheta];
  }

  // Goldreich-Julian charge density:
  // rho_GJ ~= -(Omega * B_parallel) / (2 pi c), c = 1.
  goldreichJulianChargeDensity(r: number, magneticColatitude: number): number {
    const b = this.dipoleFieldStrength(r, magneticColatitude);
    return -(this.angularVelocity * b * Math.cos(magneticColatitude)) / (2 * Math.PI);
  }

  // Rotational kinetic energy: E_rot = 1/2 I Ω^2.
  rotationalEnergy(): number {
    return 0.5 * this.momentOfInertia * this.angularVelocity * this.angularVelocity;
  }

  // Vacuum dipole spin-down luminosity:
  // L ~= (2/3) μ^2 Ω^4 sin^2(alpha), c = 1.
  spinDownLuminosity(): number {
    const s = Math.sin(this.magneticAxisInclination);
    return (
      (2 / 3) *
      this.magneticDipoleMoment *
      this.magneticDipoleMoment *
      Math.pow(this.angularVelocity, 4) *
      s *
      s
    );
  }

  // Derived period derivative from E_dot = I Ω Ω_dot = -L.
  periodDerivative(): number {
    const luminosity = this.spinDownLuminosity();
    return (
      luminosity *
      Math.pow(this.rotationPeriod, 3) /
      (4 * Math.PI * Math.PI * this.momentOfInertia)
    );
  }

  // Characteristic pulsar age: tau_c = P / (2 P_dot).
  characteristicAge(): number {
    const pDot = this.periodDerivative();
    return pDot > 0 ? this.rotationPeriod / (2 * pDot) : Number.POSITIVE_INFINITY;
  }

  // Magnetic field-line tangent angle relative to the radial direction:
  // tan(psi) = B_theta / B_r.
  fieldLinePitchAngle(r: number, magneticColatitude: number): number {
    const [br, bTheta] = this.dipoleFieldComponents(r, magneticColatitude);
    return Math.atan2(Math.abs(bTheta), Math.abs(br));
  }
}
