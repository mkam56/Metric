import {
  getSphereById,
  type SphereId,
  type TourStop,
} from '../content/spheres';
import { Engine } from '../engine/Engine';
import { UIManager } from './UIManager';
import { FreeModeScreen } from './screens/FreeModeScreen';
import { TourScreen } from './screens/TourScreen';
import { WelcomeScreen } from './screens/WelcomScreen';
import { UI_THEME } from './theme';

export class App {
  private canvas: HTMLCanvasElement;
  private engine: Engine | null = null;
  private uiManager: UIManager;
  private isTransitioning = false;
  private activeSphereId: SphereId = 'black-hole';
  private currentTourIndex = 0;
  private currentTourStops: TourStop[] = [];

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
    document.body.style.fontFamily = UI_THEME.fonts.ui;
    document.body.style.color = UI_THEME.colors.textPrimary;

    document.body.appendChild(this.canvas);
  }

  private startEngineIfNeeded(): void {
    if (this.engine) {
      return;
    }

    this.engine = new Engine(this.canvas);
    this.activeSphereId = this.engine.getCurrentSphereId();
    this.engine.start();
  }

  private showWelcomeScreen(): void {
    const welcomeScreen = new WelcomeScreen({
      activeSphereId: this.activeSphereId,
      onFreeMode: (sphereId) => this.startFreeMode(sphereId),
      onTourMode: (sphereId) => this.startTourMode(sphereId),
    });

    this.uiManager.show(welcomeScreen.render());
  }

  private returnToWelcome(): void {
    this.engine?.stopTourOrbit();
    this.engine?.unlockCameraControls();
    this.currentTourStops = [];
    this.currentTourIndex = 0;

    this.uiManager.setFadeOverlay(0.2, 260);

    window.setTimeout(() => {
      this.showWelcomeScreen();
      this.uiManager.setFadeOverlay(0, 420);
    }, 220);
  }

  private startFreeMode(sphereId: SphereId): void {
    if (!this.engine || this.isTransitioning) {
      return;
    }

    const sphere = getSphereById(sphereId);
    this.activeSphereId = sphereId;
    this.syncSceneQuery(sphereId);
    this.isTransitioning = true;

    this.uiManager.fadeOutCurrent(520);
    this.uiManager.setFadeOverlay(0.3, 620);
    this.engine.setSphere(sphereId);
    this.engine.playFreeModeIntro(sphere.freeModeIntro, () => {
      const freeModeScreen = new FreeModeScreen({
        sphereTitle: sphere.title,
        callbacks: {
          onBack: () => this.returnToWelcome(),
        },
      });

      this.uiManager.show(freeModeScreen.render());
      this.uiManager.setFadeOverlay(0, 860);
      this.isTransitioning = false;
    });
  }

  private startTourMode(sphereId: SphereId): void {
    if (!this.engine || this.isTransitioning) {
      return;
    }

    const sphere = getSphereById(sphereId);
    this.activeSphereId = sphereId;
    this.currentTourStops = sphere.tourStops;
    this.currentTourIndex = 0;
    this.syncSceneQuery(sphereId);
    this.isTransitioning = true;

    this.uiManager.fadeOutCurrent(520);
    this.uiManager.setFadeOverlay(0.3, 620);
    this.engine.setSphere(sphereId);
    this.engine.lockCameraControls();

    window.setTimeout(() => {
      this.isTransitioning = false;
      this.goToTourStep(this.currentTourIndex);
    }, 120);
  }

  private goToTourStep(index: number): void {
    if (!this.engine || this.isTransitioning) {
      return;
    }

    const stop = this.currentTourStops[index];
    if (!stop) {
      this.returnToWelcome();
      return;
    }

    this.isTransitioning = true;
    this.engine.stopTourOrbit();
    this.uiManager.setFadeOverlay(0.18, 220);

    this.engine.playTourStop(stop.cameraPosition, stop.target, () => {
      if (stop.orbit?.enabled) {
        this.engine?.startTourOrbit(stop.orbit, stop.target);
      }

      const sphere = getSphereById(this.activeSphereId);
      const tourScreen = new TourScreen({
        sphereTitle: sphere.menuTitle,
        stop,
        index,
        total: this.currentTourStops.length,
        callbacks: {
          onNext: () => this.goNextTourStep(),
          onPrev: () => this.goPrevTourStep(),
          onSkip: () => this.finishTour(),
          onBack: () => this.finishTour(),
        },
      });

      this.uiManager.show(tourScreen.render());
      this.uiManager.setFadeOverlay(0, 420);
      this.isTransitioning = false;
    });
  }

  private goNextTourStep(): void {
    if (this.isTransitioning) {
      return;
    }

    const nextIndex = this.currentTourIndex + 1;
    if (nextIndex >= this.currentTourStops.length) {
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
    this.engine?.stopTourOrbit();
    this.engine?.unlockCameraControls();
    this.returnToWelcome();
  }

  private syncSceneQuery(sphereId: SphereId): void {
    const sceneParam =
      sphereId === 'black-hole'
        ? 'black-hole'
        : sphereId === 'kerr-black-hole'
          ? 'kerr'
          : sphereId;

    const url = new URL(window.location.href);
    url.searchParams.set('scene', sceneParam);
    window.history.replaceState({}, '', url);
  }
}
