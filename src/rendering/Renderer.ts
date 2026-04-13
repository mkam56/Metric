import * as THREE from 'three';
import { PostProcessingManager } from './PostProcessingManager';

export class Renderer {
  readonly scene: THREE.Scene;
  private webGLRenderer: THREE.WebGLRenderer;
  private postFX: PostProcessingManager | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.webGLRenderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    this.webGLRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // ACES filmic — applied on composer’s final blit to screen.
    this.webGLRenderer.toneMapping       = THREE.ACESFilmicToneMapping;
    this.webGLRenderer.toneMappingExposure = 1.4;
    this.webGLRenderer.outputColorSpace  = THREE.SRGBColorSpace;
    window.addEventListener('resize', () => this.onResize());
  }

  get domElement(): HTMLCanvasElement {
    return this.webGLRenderer.domElement;
  }

  getWebGLRenderer(): THREE.WebGLRenderer {
    return this.webGLRenderer;
  }

  initPostProcessing(camera: THREE.Camera): void {
    this.postFX = new PostProcessingManager(this.webGLRenderer, this.scene, camera);
  }

  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  render(camera: THREE.Camera): void {
    if (this.postFX) {
      this.postFX.render();
    } else {
      this.webGLRenderer.render(this.scene, camera);
    }
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.webGLRenderer.setSize(w, h);
    this.postFX?.setSize(w, h);
  }
}
