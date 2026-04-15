export class UIManager {
  private root: HTMLDivElement;
  private fadeLayer: HTMLDivElement;

  constructor() {
    this.root = document.createElement('div');
    this.fadeLayer = document.createElement('div');
  }

  mount(): void {
    this.root.style.position = 'fixed';
    this.root.style.top = '0';
    this.root.style.left = '0';
    this.root.style.width = '100vw';
    this.root.style.height = '100vh';
    this.root.style.zIndex = '10';
    this.root.style.pointerEvents = 'none';

    this.fadeLayer.style.position = 'fixed';
    this.fadeLayer.style.top = '0';
    this.fadeLayer.style.left = '0';
    this.fadeLayer.style.width = '100vw';
    this.fadeLayer.style.height = '100vh';
    this.fadeLayer.style.zIndex = '9';
    this.fadeLayer.style.pointerEvents = 'none';
    this.fadeLayer.style.opacity = '0';
    this.fadeLayer.style.background =
      'radial-gradient(circle at center, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%)';

    document.body.appendChild(this.fadeLayer);
    document.body.appendChild(this.root);
  }

  show(element: HTMLElement): void {
    this.root.innerHTML = '';
    this.root.appendChild(element);
  }

  clear(): void {
    this.root.innerHTML = '';
  }

  fadeOutCurrent(durationMs: number = 500): void {
    const current = this.root.firstElementChild as HTMLElement | null;

    if (!current) {
      return;
    }

    current.style.transition = `opacity ${durationMs}ms ease`;
    current.style.opacity = '1';

    requestAnimationFrame(() => {
      current.style.opacity = '0';
    });
  }

  setFadeOverlay(opacity: number, durationMs: number = 500): void {
    this.fadeLayer.style.transition = `opacity ${durationMs}ms ease`;
    this.fadeLayer.style.opacity = String(opacity);
  }
}