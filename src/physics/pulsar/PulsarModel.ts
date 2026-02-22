export class PulsarModel {
  rotationPeriod: number;
  magneticFieldStrength: number;

  constructor(rotationPeriod: number, magneticFieldStrength: number) {
    this.rotationPeriod = rotationPeriod;
    this.magneticFieldStrength = magneticFieldStrength;
  }
}
