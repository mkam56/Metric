import { UI_THEME } from '../theme';

type FreeModeScreenCallbacks = {
  onBack: () => void;
};

type FreeModeScreenParams = {
  sphereTitle: string;
  callbacks: FreeModeScreenCallbacks;
};

export class FreeModeScreen {
  constructor(private params: FreeModeScreenParams) {}

  render(): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';

    const infoPanel = document.createElement('div');
    infoPanel.style.position = 'absolute';
    infoPanel.style.left = '24px';
    infoPanel.style.top = '24px';
    infoPanel.style.maxWidth = 'min(440px, calc(100vw - 110px))';
    infoPanel.style.padding = '18px 20px';
    infoPanel.style.borderRadius = '24px';
    infoPanel.style.background = UI_THEME.colors.panelStrong;
    infoPanel.style.border = `1px solid ${UI_THEME.colors.border}`;
    infoPanel.style.backdropFilter = 'blur(14px)';
    infoPanel.style.boxShadow = UI_THEME.shadows.panel;
    infoPanel.style.pointerEvents = 'auto';

    const modeLabel = document.createElement('div');
    modeLabel.textContent = 'СВОБОДНЫЙ РЕЖИМ';
    modeLabel.style.marginBottom = '10px';
    modeLabel.style.color = 'rgba(244, 240, 232, 0.68)';
    modeLabel.style.fontFamily = UI_THEME.fonts.ui;
    modeLabel.style.fontSize = '12px';
    modeLabel.style.letterSpacing = '0.22em';

    const title = document.createElement('h2');
    title.textContent = this.params.sphereTitle;
    title.style.margin = '0 0 8px';
    title.style.color = UI_THEME.colors.textPrimary;
    title.style.fontFamily = UI_THEME.fonts.display;
    title.style.fontSize = '38px';
    title.style.fontWeight = '600';
    title.style.lineHeight = '1.05';

    const hint = document.createElement('p');
    hint.textContent =
      'Осматривайте сцену самостоятельно: мышью вращайте камеру, колесом меняйте масштаб.';
    hint.style.margin = '0';
    hint.style.color = UI_THEME.colors.textMuted;
    hint.style.fontFamily = UI_THEME.fonts.ui;
    hint.style.fontSize = '15px';
    hint.style.lineHeight = '1.55';

    infoPanel.appendChild(modeLabel);
    infoPanel.appendChild(title);
    infoPanel.appendChild(hint);

    const backButton = document.createElement('button');
    backButton.textContent = 'В меню';
    backButton.style.position = 'absolute';
    backButton.style.top = '24px';
    backButton.style.right = '24px';
    backButton.style.padding = '14px 18px';
    backButton.style.borderRadius = '16px';
    backButton.style.border = `1px solid ${UI_THEME.colors.border}`;
    backButton.style.background = UI_THEME.colors.panelStrong;
    backButton.style.color = UI_THEME.colors.textPrimary;
    backButton.style.fontFamily = UI_THEME.fonts.ui;
    backButton.style.fontSize = '15px';
    backButton.style.fontWeight = '600';
    backButton.style.cursor = 'pointer';
    backButton.style.pointerEvents = 'auto';
    backButton.style.backdropFilter = 'blur(14px)';
    backButton.style.boxShadow = UI_THEME.shadows.panel;
    backButton.style.transition = 'transform 180ms ease, background 180ms ease';

    backButton.addEventListener('mouseenter', () => {
      backButton.style.transform = 'translateY(-1px)';
      backButton.style.background = 'rgba(20, 26, 42, 0.88)';
    });
    backButton.addEventListener('mouseleave', () => {
      backButton.style.transform = 'translateY(0)';
      backButton.style.background = UI_THEME.colors.panelStrong;
    });
    backButton.addEventListener('click', this.params.callbacks.onBack);

    container.appendChild(infoPanel);
    container.appendChild(backButton);
    return container;
  }
}
