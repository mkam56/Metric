import { Renderer }          from '../rendering/Renderer';
import { SceneManager }      from './SceneManager';
import { TimeController }    from './TimeController';
import { CameraController }  from './CameraController';
import { BlackHoleScene }    from '../scenes/BlackHoleScene';
import { QuasarScene }       from '../scenes/QuasarScene';
import { PulsarScene }       from '../scenes/PulsarScene';
import { KerrBlackHoleScene } from '../scenes/KerrBlackHoleScene';
import { BaseScene }         from '../scenes/BaseScene';

export class Engine {
  private renderer:        Renderer;
  private sceneManager:    SceneManager;
  private timeController:  TimeController;
  private cameraController: CameraController;
  private animationId:     number = 0;
  private elapsedTime:     number = 0;
  private fpsSmoothed:     number = 60;
  private lastFrameAt:     number = performance.now();
  private lastOverlayAt:   number = 0;
  private debugOverlay:    HTMLDivElement;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer         = new Renderer(canvas);
    this.cameraController = new CameraController(canvas);
    this.sceneManager     = new SceneManager(this.renderer);
    this.timeController   = new TimeController();

    const scene = this.createInitialScene();
    // Link camera before setScene() so it's available inside init().
    if ('linkCamera' in scene && typeof scene.linkCamera === 'function') {
      // Link camera before setScene() so it's available inside init().
      scene.linkCamera(this.cameraController.camera);
    }
    this.sceneManager.setScene(scene);

    this.debugOverlay = this.createDebugOverlay();
    window.addEventListener('keydown', this.onKeyDown);
  }

  start(): void {
    this.loop();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.onKeyDown);
    this.debugOverlay.remove();
  }

  private loop(): void {
    this.animationId = requestAnimationFrame(() => this.loop());

    const now = performance.now();
    const frameDt = Math.max(1e-4, (now - this.lastFrameAt) / 1000);
    this.lastFrameAt = now;

    const fpsNow = 1 / frameDt;
    this.fpsSmoothed = this.fpsSmoothed * 0.9 + fpsNow * 0.1;

    const deltaTime = this.timeController.tick();
    this.elapsedTime += deltaTime;
    this.cameraController.update();
    this.sceneManager.update(deltaTime);
    this.renderer.render(this.cameraController.camera);

    if (now - this.lastOverlayAt > 200) {
      this.lastOverlayAt = now;
      this.updateDebugOverlay();
    }
  }

  private createDebugOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '10px';
    overlay.style.left = '10px';
    overlay.style.padding = '8px 10px';
    overlay.style.background = 'rgba(0, 0, 0, 0.45)';
    overlay.style.color = '#fff';
    overlay.style.fontFamily = 'monospace';
    overlay.style.fontSize = '12px';
    overlay.style.lineHeight = '1.35';
    overlay.style.whiteSpace = 'pre';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '1000';
    document.body.appendChild(overlay);
    return overlay;
  }

  private updateDebugOverlay(): void {
    const cam = this.cameraController.camera.position;
    this.debugOverlay.textContent =
      `FPS: ${this.fpsSmoothed.toFixed(1)}\n` +
      `uTime: ${this.elapsedTime.toFixed(2)}\n` +
      `Camera: ${cam.x.toFixed(2)}, ${cam.y.toFixed(2)}, ${cam.z.toFixed(2)}`;
  }

  private createInitialScene(): BaseScene {
    const sceneName = new URLSearchParams(window.location.search).get('scene');
    if (sceneName === 'quasar') {
      return new QuasarScene();
    }
    if (sceneName === 'pulsar') {
      return new PulsarScene();
    }
    if (sceneName === 'kerr') {
      return new KerrBlackHoleScene();
    }
    return new BlackHoleScene();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      this.timeController.togglePause();
      return;
    }

    if (event.code === 'KeyN' && this.timeController.paused) {
      this.timeController.requestStep();
      return;
    }

    if (event.code === 'KeyP') {
      const canvas = this.renderer.domElement;
      const url = canvas.toDataURL('image/png');
      window.open(url, '_blank');
    }
  };
}
