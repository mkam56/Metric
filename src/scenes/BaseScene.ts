import { Renderer } from '../rendering/Renderer';

export abstract class BaseScene {
  abstract init(renderer: Renderer): void;
  abstract update(deltaTime: number): void;
  dispose?(renderer: Renderer): void;
}
