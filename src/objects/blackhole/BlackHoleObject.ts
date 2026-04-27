export class BlackHoleObject {
  readonly mass: number;
  readonly spin: number;

  constructor(mass: number, spin: number = 0) {
    this.mass = mass;
    this.spin = spin;
  }

  horizonRadiusSchwarzschild(): number {
    return 2 * this.mass;
  }

  iscoRadiusSchwarzschild(): number {
    return 6 * this.mass;
  }

  photonSphereRadiusSchwarzschild(): number {
    return 3 * this.mass;
  }
}
