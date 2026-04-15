type WelcomeScreenCallbacks = {
  onFreeMode: () => void;
  onTourMode: () => void;
  onCredits: () => void;
};

export class WelcomeScreen {
  constructor(private callbacks: WelcomeScreenCallbacks) {}

  render(): HTMLElement {
    

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.gap = '18px';

    container.style.pointerEvents = 'auto';

    container.style.background = 'rgba(0, 0, 0, 0.12)';
    container.style.backdropFilter = 'blur(6px)';
    (container.style as any).webkitBackdropFilter = 'blur(7px)';    container.style.color = 'white';
    container.style.fontFamily = '"Cormorant", serif';

    const title = document.createElement('h1');
    title.textContent = 'Экскурсия по чёрной дыре';
    title.style.margin = '0';
    title.style.fontSize = '64px';
    title.style.fontWeight = '700';
    title.style.textAlign = 'center';
    title.style.textShadow = '0 6px 24px rgba(0, 0, 0, 0.8)';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Выбери режим';
    subtitle.style.margin = '0 0 26px 0';
    subtitle.style.fontSize = '28px';
    subtitle.style.fontWeight = '500';
    subtitle.style.textShadow = '0 4px 16px rgba(0, 0, 0, 0.8)';

    const menu = document.createElement('div');
    menu.style.display = 'flex';
    menu.style.flexDirection = 'column';
    menu.style.alignItems = 'center';
    menu.style.gap = '16px';

    const freeButton = this.createButton('Свободный режим', this.callbacks.onFreeMode);
    const tourButton = this.createButton('Экскурсионный режим', this.callbacks.onTourMode);
    const creditsButton = this.createButton('Credits', this.callbacks.onCredits);

    menu.appendChild(freeButton);
    menu.appendChild(tourButton);
    menu.appendChild(creditsButton);

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(menu);


    return container;
  }

  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;

    button.style.background = 'transparent';
    button.style.border = 'none';
    button.style.outline = 'none';

    button.style.color = 'white';
    button.style.fontSize = '30px';
    button.style.fontWeight = '500';
    button.style.fontFamily = '"Cormorant", serif';
    button.style.cursor = 'pointer';
    button.style.padding = '0';
    button.style.textShadow = '0 4px 16px rgba(0, 0, 0, 0.8)';
    button.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    button.style.opacity = '0.9';

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.04)';
      button.style.opacity = '1';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.opacity = '0.9';
    });

    button.addEventListener('click', onClick);

    return button;
  }
}