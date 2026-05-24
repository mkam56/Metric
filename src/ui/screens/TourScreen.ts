import type { TourStop } from '../../content/spheres';
import { UI_THEME } from '../theme';

type TourScreenCallbacks = {
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onBack: () => void;
};

type TourScreenParams = {
  sphereTitle: string;
  stop: TourStop;
  index: number;
  total: number;
  callbacks: TourScreenCallbacks;
};

export class TourScreen {
  constructor(private params: TourScreenParams) {}

  render(): HTMLElement {
    const root = document.createElement('div');
    root.style.position = 'absolute';
    root.style.inset = '0';
    root.style.pointerEvents = 'none';
    root.style.opacity = '0';
    root.style.transition = 'opacity 650ms ease';

    const topBar = document.createElement('div');
    topBar.style.position = 'absolute';
    topBar.style.top = '24px';
    topBar.style.left = '24px';
    topBar.style.right = '24px';
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.gap = '16px';
    topBar.style.pointerEvents = 'auto';
    topBar.style.opacity = '0';
    topBar.style.transition = 'opacity 650ms ease, transform 320ms ease';

    const tourMeta = document.createElement('div');
    tourMeta.style.padding = '16px 18px';
    tourMeta.style.borderRadius = '20px';
    tourMeta.style.background = UI_THEME.colors.panelStrong;
    tourMeta.style.border = `1px solid ${UI_THEME.colors.border}`;
    tourMeta.style.backdropFilter = 'blur(14px)';
    tourMeta.style.boxShadow = UI_THEME.shadows.panel;

    const sphereLabel = document.createElement('div');
    sphereLabel.textContent = 'ЭКСКУРСИОННЫЙ РЕЖИМ';
    sphereLabel.style.marginBottom = '6px';
    sphereLabel.style.color = 'rgba(244, 240, 232, 0.68)';
    sphereLabel.style.fontFamily = UI_THEME.fonts.ui;
    sphereLabel.style.fontSize = '11px';
    sphereLabel.style.letterSpacing = '0.22em';

    const sphereTitle = document.createElement('div');
    sphereTitle.textContent = this.params.sphereTitle;
    sphereTitle.style.color = UI_THEME.colors.textPrimary;
    sphereTitle.style.fontFamily = UI_THEME.fonts.display;
    sphereTitle.style.fontSize = '26px';
    sphereTitle.style.fontWeight = '600';
    sphereTitle.style.lineHeight = '1.05';

    const counter = document.createElement('div');
    counter.textContent = `${this.params.index + 1} / ${this.params.total}`;
    counter.style.marginTop = '8px';
    counter.style.color = UI_THEME.colors.textMuted;
    counter.style.fontFamily = UI_THEME.fonts.ui;
    counter.style.fontSize = '13px';
    counter.style.letterSpacing = '0.08em';

    tourMeta.appendChild(sphereLabel);
    tourMeta.appendChild(sphereTitle);
    tourMeta.appendChild(counter);

    const topActions = document.createElement('div');
    topActions.style.display = 'flex';
    topActions.style.alignItems = 'center';
    topActions.style.gap = '12px';

    const countdownChip = document.createElement('div');
    countdownChip.style.padding = '12px 14px';
    countdownChip.style.borderRadius = '16px';
    countdownChip.style.background = UI_THEME.colors.panelStrong;
    countdownChip.style.border = `1px solid ${UI_THEME.colors.border}`;
    countdownChip.style.backdropFilter = 'blur(14px)';
    countdownChip.style.boxShadow = UI_THEME.shadows.panel;
    countdownChip.style.color = UI_THEME.colors.textPrimary;
    countdownChip.style.fontFamily = UI_THEME.fonts.ui;
    countdownChip.style.fontSize = '13px';
    countdownChip.style.lineHeight = '1.35';

    const menuButton = this.createTextButton('В меню', () =>
      animateOutAndRun(this.params.callbacks.onBack)
    );
    menuButton.style.padding = '14px 18px';

    topActions.appendChild(countdownChip);
    topActions.appendChild(menuButton);

    topBar.appendChild(tourMeta);
    topBar.appendChild(topActions);

    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.left = '24px';
    panel.style.right = '24px';
    panel.style.bottom = '24px';
    panel.style.maxWidth = '720px';
    panel.style.padding = '24px';
    panel.style.borderRadius = '28px';
    panel.style.background = UI_THEME.colors.panel;
    panel.style.border = `1px solid ${UI_THEME.colors.border}`;
    panel.style.backdropFilter = 'blur(18px)';
    panel.style.boxShadow = UI_THEME.shadows.panel;
    panel.style.pointerEvents = 'auto';
    panel.style.opacity = '0';
    panel.style.transition = 'opacity 650ms ease, transform 320ms ease';

    const progressRail = document.createElement('div');
    progressRail.style.width = '100%';
    progressRail.style.height = '6px';
    progressRail.style.marginBottom = '18px';
    progressRail.style.borderRadius = '999px';
    progressRail.style.background = 'rgba(255, 255, 255, 0.08)';
    progressRail.style.overflow = 'hidden';

    const progressFill = document.createElement('div');
    progressFill.style.width = '100%';
    progressFill.style.height = '100%';
    progressFill.style.borderRadius = '999px';
    progressFill.style.background =
      'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,196,126,0.92) 100%)';
    progressFill.style.transformOrigin = 'left center';
    progressFill.style.transform = 'scaleX(0)';
    progressFill.style.transition = `transform ${this.params.stop.durationMs}ms linear`;
    progressRail.appendChild(progressFill);

    const title = document.createElement('h2');
    title.textContent = this.params.stop.title;
    title.style.margin = '0 0 14px';
    title.style.color = UI_THEME.colors.textPrimary;
    title.style.fontFamily = UI_THEME.fonts.display;
    title.style.fontSize = 'clamp(32px, 4vw, 44px)';
    title.style.fontWeight = '600';
    title.style.lineHeight = '1.05';

    const text = document.createElement('p');
    text.textContent = this.params.stop.text;
    text.style.margin = '0 0 22px';
    text.style.color = UI_THEME.colors.textPrimary;
    text.style.fontFamily = UI_THEME.fonts.ui;
    text.style.fontSize = '18px';
    text.style.lineHeight = '1.7';

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '12px';
    controls.style.flexWrap = 'wrap';

    const prevButton = this.createTextButton('Назад', () =>
      animateOutAndRun(this.params.callbacks.onPrev)
    );
    if (this.params.index === 0) {
      prevButton.disabled = true;
      prevButton.style.cursor = 'default';
      prevButton.style.opacity = '0.42';
    }

    const nextLabel =
      this.params.index < this.params.total - 1 ? 'Следующая остановка' : 'Завершить экскурсию';
    const nextButton = this.createPrimaryButton(nextLabel, () =>
      animateOutAndRun(
        this.params.index < this.params.total - 1
          ? this.params.callbacks.onNext
          : this.params.callbacks.onSkip
      )
    );
    const finishButton = this.createTextButton('Завершить сейчас', () =>
      animateOutAndRun(this.params.callbacks.onSkip)
    );

    controls.appendChild(prevButton);
    controls.appendChild(nextButton);
    controls.appendChild(finishButton);

    panel.appendChild(progressRail);
    panel.appendChild(title);
    panel.appendChild(text);
    panel.appendChild(controls);

    root.appendChild(topBar);
    root.appendChild(panel);

    const autoAdvanceCallback =
      this.params.index < this.params.total - 1
        ? this.params.callbacks.onNext
        : this.params.callbacks.onSkip;

    const deadline = performance.now() + this.params.stop.durationMs;
    let autoAdvanceTimeout = 0;
    let countdownInterval = 0;

    const clearTimers = (): void => {
      if (autoAdvanceTimeout) {
        window.clearTimeout(autoAdvanceTimeout);
        autoAdvanceTimeout = 0;
      }
      if (countdownInterval) {
        window.clearInterval(countdownInterval);
        countdownInterval = 0;
      }
    };

    const updateCountdown = (): void => {
      const remainingMs = Math.max(0, deadline - performance.now());
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const formatted = `${minutes}:${String(seconds).padStart(2, '0')}`;
      const lead =
        this.params.index < this.params.total - 1
          ? 'Автопереход через'
          : 'Экскурсия завершится через';

      countdownChip.textContent = `${lead} ${formatted}`;
    };

    const animateOutAndRun = (callback: () => void): void => {
      clearTimers();
      root.style.pointerEvents = 'none';
      root.style.opacity = '0';
      topBar.style.opacity = '0';
      panel.style.opacity = '0';

      window.setTimeout(() => {
        callback();
      }, 620);
    };

    autoAdvanceTimeout = window.setTimeout(() => {
      animateOutAndRun(autoAdvanceCallback);
    }, this.params.stop.durationMs);
    countdownInterval = window.setInterval(updateCountdown, 250);
    updateCountdown();

    requestAnimationFrame(() => {
      root.style.opacity = '1';
      topBar.style.opacity = '1';
      panel.style.opacity = '1';
      progressFill.style.transform = 'scaleX(1)';
    });

    return root;
  }

  private createTextButton(
    text: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.border = `1px solid ${UI_THEME.colors.border}`;
    button.style.borderRadius = '16px';
    button.style.padding = '14px 16px';
    button.style.background = UI_THEME.colors.surface;
    button.style.color = UI_THEME.colors.textPrimary;
    button.style.fontFamily = UI_THEME.fonts.ui;
    button.style.fontSize = '15px';
    button.style.fontWeight = '600';
    button.style.cursor = 'pointer';
    button.style.transition = 'transform 180ms ease, background 180ms ease';

    button.addEventListener('mouseenter', () => {
      if (button.disabled) {
        return;
      }

      button.style.transform = 'translateY(-1px)';
      button.style.background = UI_THEME.colors.surfaceHover;
    });
    button.addEventListener('mouseleave', () => {
      if (button.disabled) {
        return;
      }

      button.style.transform = 'translateY(0)';
      button.style.background = UI_THEME.colors.surface;
    });
    button.addEventListener('click', onClick);

    return button;
  }

  private createPrimaryButton(
    text: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.border = 'none';
    button.style.borderRadius = '16px';
    button.style.padding = '14px 18px';
    button.style.background =
      'linear-gradient(135deg, rgba(255, 211, 140, 0.98) 0%, rgba(255, 177, 120, 0.96) 100%)';
    button.style.color = '#101421';
    button.style.fontFamily = UI_THEME.fonts.ui;
    button.style.fontSize = '15px';
    button.style.fontWeight = '700';
    button.style.cursor = 'pointer';
    button.style.transition = 'transform 180ms ease, filter 180ms ease';

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.filter = 'brightness(1.05)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.filter = 'brightness(1)';
    });
    button.addEventListener('click', onClick);

    return button;
  }
}
