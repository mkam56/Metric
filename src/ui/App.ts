import { Engine } from '../engine/Engine';
import { UIManager } from './UIManager';
import { WelcomeScreen } from './screens/WelcomScreen';
import { FreeModeScreen } from './screens/FreeModeScreen';
import { TourScreen, TOUR_STOPS } from './screens/TourScreen';

export class App {
  private canvas: HTMLCanvasElement;
  private engine: Engine | null = null;
  private uiManager: UIManager;
  private isTransitioning: boolean = false;
  private currentTourIndex: number = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.uiManager = new UIManager();
  }

  mount(): void {
    this.setupCanvas();
    this.uiManager.mount();

    this.startEngineIfNeeded();
    this.showWelcomeScreen();
  }

  private setupCanvas(): void {
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.zIndex = '0';

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    document.body.appendChild(this.canvas);
  }

  private startEngineIfNeeded(): void {
    if (this.engine) {
      return;
    }

    this.engine = new Engine(this.canvas);
    this.engine.start();
  }

  private showWelcomeScreen(): void {
    const welcomeScreen = new WelcomeScreen({
      onFreeMode: () => this.startFreeMode(),
      onTourMode: () => this.startTourMode(),
      onCredits: () => this.showCredits(),
    });

    this.uiManager.show(welcomeScreen.render());
    
  }

  private returnToWelcome(): void {
  this.uiManager.setFadeOverlay(0.22, 300);

  setTimeout(() => {
    this.showWelcomeScreen();
    this.uiManager.setFadeOverlay(0, 500);
  }, 220);
}

  private startFreeMode(): void {

  if (!this.engine || this.isTransitioning) {
    return;
  }

  this.isTransitioning = true;

  this.uiManager.fadeOutCurrent(700);
  this.uiManager.setFadeOverlay(0.32, 700);

  this.engine.playFreeModeIntro(() => {
    const freeModeScreen = new FreeModeScreen({
      onBack: () => this.returnToWelcome(),
    });

    this.uiManager.show(freeModeScreen.render());
    this.uiManager.setFadeOverlay(0, 900);
    this.isTransitioning = false;
  });

  
}

 

  private showCredits(): void {
    alert('Credits пока заглушка');
    this.showWelcomeScreen();
  }

 private startTourMode(): void {

  if (!this.engine || this.isTransitioning) {
    return;
  }

  this.engine.lockCameraControls();
  this.currentTourIndex = 0;
  this.goToTourStep(this.currentTourIndex);
}

private goToTourStep(index: number): void {
  if (!this.engine || this.isTransitioning) {
    return;
  }

  const stop = TOUR_STOPS[index];
  if (!stop) {
    this.showWelcomeScreen();
    return;
  }

  this.isTransitioning = true;
  this.uiManager.setFadeOverlay(0.2, 250);

  this.engine.playTourStop(stop.cameraPosition, stop.target, () => {
  if (stop.orbit?.enabled) {
    this.engine?.startTourOrbit(stop.orbit, stop.target);
  }

  const tourScreen = new TourScreen({
    stop,
    index,
    total: TOUR_STOPS.length,
    callbacks: {
      onNext: () => this.goNextTourStep(),
      onPrev: () => this.goPrevTourStep(),
      onSkip: () => this.finishTour(),
      onBack: () => this.finishTour(),
    },
  });

  this.uiManager.show(tourScreen.render());
  this.uiManager.setFadeOverlay(0, 500);
  this.isTransitioning = false;
});
}

private goNextTourStep(): void {
  if (this.isTransitioning) {
    return;
  }

  const nextIndex = this.currentTourIndex + 1;

  if (nextIndex >= TOUR_STOPS.length) {
    this.finishTour();
    return;
  }

  this.currentTourIndex = nextIndex;
  this.goToTourStep(this.currentTourIndex);
}

private goPrevTourStep(): void {
  if (this.isTransitioning) {
    return;
  }

  const prevIndex = this.currentTourIndex - 1;

  if (prevIndex < 0) {
    return;
  }

  this.currentTourIndex = prevIndex;
  this.goToTourStep(this.currentTourIndex);
}

private finishTour(): void {
  this.engine?.unlockCameraControls();

  this.uiManager.setFadeOverlay(0.2, 250);

  setTimeout(() => {
    this.showWelcomeScreen();
    this.uiManager.setFadeOverlay(0, 500);
  }, 250);
}
}

