import * as THREE from 'three';

import { Renderer } from '../rendering/Renderer';
import { SceneManager } from './SceneManager';
import { TimeController } from './TimeController';
import { CameraController } from './CameraController';
import { BlackHoleScene } from '../scenes/BlackHoleScene';
import { QuasarScene } from '../scenes/QuasarScene';
import { PulsarScene } from '../scenes/PulsarScene';
import { NeutronStarScene } from '../scenes/NeutronStarScene';
import { KerrBlackHoleScene } from '../scenes/KerrBlackHoleScene';
import { BaseScene } from '../scenes/BaseScene';
import type { CameraPreset, SphereId } from '../content/spheres';

export class Engine {
  private renderer: Renderer;
  private sceneManager: SceneManager;
  private timeController: TimeController;
  private cameraController: CameraController;
  private animationId = 0;
  private elapsedTime = 0;
  private fpsSmoothed = 60;
  private lastFrameAt = performance.now();
  private lastOverlayAt = 0;
  private debugOverlay: HTMLDivElement | null = null;
  private currentSphereId: SphereId;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.cameraController = new CameraController(canvas);
    this.sceneManager = new SceneManager(this.renderer);
    this.timeController = new TimeController();
    this.currentSphereId = this.resolveInitialSphereId();

    this.applyScene(this.createScene(this.currentSphereId));

    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      this.debugOverlay = this.createDebugOverlay();
    }
    window.addEventListener('keydown', this.onKeyDown);
  }

  start(): void {
    this.loop();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.onKeyDown);
    this.debugOverlay?.remove();
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
    if (!this.debugOverlay) {
      return;
    }

    const cam = this.cameraController.camera.position;
    this.debugOverlay.textContent =
      `FPS: ${this.fpsSmoothed.toFixed(1)}\n` +
      `uTime: ${this.elapsedTime.toFixed(2)}\n` +
      `Camera: ${cam.x.toFixed(2)}, ${cam.y.toFixed(2)}, ${cam.z.toFixed(2)}`;
  }

  getCurrentSphereId(): SphereId {
    return this.currentSphereId;
  }

  setSphere(sphereId: SphereId): void {
    this.stopTourOrbit();

    if (this.currentSphereId === sphereId) {
      return;
    }

    this.currentSphereId = sphereId;
    this.applyScene(this.createScene(sphereId));
  }

  private resolveInitialSphereId(): SphereId {
    const sceneName = new URLSearchParams(window.location.search).get('scene');

    if (sceneName === 'quasar') {
      return 'quasar';
    }
    if (sceneName === 'pulsar') {
      return 'pulsar';
    }
    if (sceneName === 'kerr') {
      return 'kerr-black-hole';
    }
    if (sceneName === 'neutron' || sceneName === 'neutron-star') {
      return 'neutron-star';
    }
    if (sceneName === 'black-hole') {
      return 'black-hole';
    }

    return 'black-hole';
  }

  private createScene(sphereId: SphereId): BaseScene {
    switch (sphereId) {
      case 'quasar':
        return new QuasarScene();
      case 'kerr-black-hole':
        return new KerrBlackHoleScene();
      case 'pulsar':
        return new PulsarScene();
      case 'neutron-star':
        return new NeutronStarScene();
      case 'black-hole':
      default:
        return new BlackHoleScene();
    }
  }

  private applyScene(scene: BaseScene): void {
    if ('linkCamera' in scene && typeof scene.linkCamera === 'function') {
      scene.linkCamera(this.cameraController.camera);
    }

    this.sceneManager.setScene(scene);
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
  playFreeModeIntro(preset: CameraPreset, onComplete?: () => void): void {
    this.stopTourOrbit();
    this.unlockCameraControls();
    this.animateCameraTo(preset, onComplete);
  }

  lockCameraControls(): void {
    this.cameraController.lockUserControls();
  }

  unlockCameraControls(): void {
    this.cameraController.unlockUserControls();
  }

  playTourStop(
    position: { x: number; y: number; z: number },
    target: { x: number; y: number; z: number },
    onComplete?: () => void
  ): void {
    this.cameraController.animateTo(
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Vector3(target.x, target.y, target.z),
      1800,
      onComplete,
      3
    );
  }

  startTourOrbit(
    orbit: { yawAmplitude: number; yawSpeed: number; verticalBob?: number },
    target: { x: number; y: number; z: number }
  ): void {
    this.cameraController.startAutoOrbit(
      new THREE.Vector3(target.x, target.y, target.z),
      orbit
    );
  }

  stopTourOrbit(): void {
    this.cameraController.stopAutoOrbit();
  }

  private animateCameraTo(preset: CameraPreset, onComplete?: () => void): void {
    this.cameraController.animateTo(
      new THREE.Vector3(preset.position.x, preset.position.y, preset.position.z),
      new THREE.Vector3(preset.target.x, preset.target.y, preset.target.z),
      preset.durationMs ?? 2000,
      onComplete,
      preset.arcHeight ?? 0
    );
  }
}
