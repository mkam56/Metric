import { BaseScene } from '../scenes/BaseScene';
import { Renderer } from '../rendering/Renderer';

export class SceneManager {
  private currentScene: BaseScene | null = null;
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  setScene(scene: BaseScene): void {
    if (this.currentScene?.dispose) {
      this.currentScene.dispose(this.renderer);
    }
    this.currentScene = scene;
    this.currentScene.init(this.renderer);
  }

  update(deltaTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }
}
