export class QuasarModel {
    readonly coreRadius: number;
    readonly diskInner: number;
    readonly diskOuter: number;
    readonly diskThickness: number;
    readonly jetPower: number;
    readonly glowStrength: number;
    readonly rotationSpeed: number;
  
    constructor() {
      this.coreRadius = 0.18;
      this.diskInner = 0.18;
      this.diskOuter = 1.45;
      this.diskThickness = 0.16;
      this.jetPower = 0.9;
      this.glowStrength = 1.15;
      this.rotationSpeed = 0.18;
    }
  }