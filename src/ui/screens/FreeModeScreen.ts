type FreeModeScreenCallbacks = {
  onBack: () => void;
};

export class FreeModeScreen {
  constructor(private callbacks: FreeModeScreenCallbacks) {}

  render(): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.inset = '0';

    container.style.pointerEvents = 'none';

    const backButton = document.createElement('button');
    backButton.textContent = '← На главный экран';
    backButton.style.position = 'absolute';
    backButton.style.top = '28px';
    backButton.style.right = '28px';

    backButton.style.pointerEvents = 'auto';
    backButton.style.background = 'transparent';
    backButton.style.border = 'none';
    backButton.style.outline = 'none';
    backButton.style.color = 'white';
    backButton.style.fontSize = '24px';
    backButton.style.fontWeight = '500';
    backButton.style.fontFamily = '"Inter", "Segoe UI", "Helvetica Neue", sans-serif';
    backButton.style.cursor = 'pointer';
    backButton.style.textShadow = '0 4px 16px rgba(0, 0, 0, 0.8)';
    backButton.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    backButton.style.opacity = '0.9';

    backButton.addEventListener('mouseenter', () => {
      backButton.style.transform = 'scale(1.04)';
      backButton.style.opacity = '1';
    });

    backButton.addEventListener('mouseleave', () => {
      backButton.style.transform = 'scale(1)';
      backButton.style.opacity = '0.9';
    });

    backButton.addEventListener('click', this.callbacks.onBack);

    container.appendChild(backButton);
    return container;
  }
}