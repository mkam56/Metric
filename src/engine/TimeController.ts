export class TimeController {
  private lastTime: number = performance.now();
  timeScale: number = 1;
  paused: boolean = false;
  stepOnce: boolean = false;

  tick(): number {
    const now = performance.now();
    const frameDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (this.paused) {
      if (this.stepOnce) {
        this.stepOnce = false;
        return (1 / 60) * this.timeScale;
      }
      return 0;
    }

    return frameDelta * this.timeScale;
  }

  togglePause(): void {
    this.paused = !this.paused;
  }

  requestStep(): void {
    this.stepOnce = true;
  }
}
