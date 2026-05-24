import {
  SPHERE_LIST,
  formatDurationLabel,
  getTourDurationMs,
  type SphereId,
} from '../../content/spheres';
import { UI_THEME } from '../theme';

type WelcomeScreenCallbacks = {
  activeSphereId?: SphereId;
  onFreeMode: (sphereId: SphereId) => void;
  onTourMode: (sphereId: SphereId) => void;
};

export class WelcomeScreen {
  constructor(private callbacks: WelcomeScreenCallbacks) {}

  render(): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.inset = '0';
    container.style.overflowY = 'auto';
    container.style.pointerEvents = 'auto';
    container.style.padding = '40px 24px 48px';
    container.style.background =
      'radial-gradient(circle at top, rgba(26, 32, 56, 0.58) 0%, rgba(7, 10, 18, 0.72) 48%, rgba(4, 5, 9, 0.84) 100%)';
    container.style.backdropFilter = 'blur(14px)';
    (container.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
      'blur(14px)';

    const shell = document.createElement('div');
    shell.style.maxWidth = '1320px';
    shell.style.margin = '0 auto';
    shell.style.display = 'flex';
    shell.style.flexDirection = 'column';
    shell.style.gap = '22px';

    const hero = document.createElement('section');
    hero.style.display = 'flex';
    hero.style.flexDirection = 'column';
    hero.style.gap = '14px';
    hero.style.padding = '12px 4px 6px';

    const eyebrow = document.createElement('div');
    eyebrow.textContent = 'АТЛАС ЭКСТРЕМАЛЬНЫХ ОБЪЕКТОВ';
    eyebrow.style.color = 'rgba(244, 240, 232, 0.68)';
    eyebrow.style.fontFamily = UI_THEME.fonts.ui;
    eyebrow.style.fontSize = '12px';
    eyebrow.style.letterSpacing = '0.24em';

    const title = document.createElement('h1');
    title.textContent = 'Выберите сферу и режим наблюдения';
    title.style.margin = '0';
    title.style.color = UI_THEME.colors.textPrimary;
    title.style.fontFamily = UI_THEME.fonts.display;
    title.style.fontSize = 'clamp(46px, 6vw, 82px)';
    title.style.fontWeight = '600';
    title.style.lineHeight = '0.96';
    title.style.maxWidth = '920px';
    title.style.textShadow = UI_THEME.shadows.text;

    hero.appendChild(eyebrow);
    hero.appendChild(title);

    const grid = document.createElement('section');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';
    grid.style.gap = '20px';

    for (const sphere of SPHERE_LIST) {
      const card = document.createElement('article');
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.minHeight = '440px';
      card.style.borderRadius = '28px';
      card.style.overflow = 'hidden';
      card.style.background =
        'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)';
      card.style.border = `1px solid ${
        this.callbacks.activeSphereId === sphere.id
          ? `${sphere.accentColor}66`
          : UI_THEME.colors.border
      }`;
      card.style.boxShadow = UI_THEME.shadows.card;
      card.style.backdropFilter = 'blur(12px)';

      const media = document.createElement('div');
      media.style.position = 'relative';
      media.style.minHeight = '208px';
      media.style.overflow = 'hidden';
      media.style.background = '#060913';

      const previewImage = document.createElement('img');
      previewImage.src = sphere.imageUrl;
      previewImage.alt = sphere.title;
      previewImage.draggable = false;
      previewImage.style.position = 'absolute';
      previewImage.style.inset = '0';
      previewImage.style.width = '100%';
      previewImage.style.height = '100%';
      previewImage.style.objectFit = 'cover';
      previewImage.style.objectPosition = sphere.imagePosition ?? 'center';
      previewImage.style.transform = `scale(${sphere.imageScale ?? 1})`;
      previewImage.style.transformOrigin = 'center';
      previewImage.style.filter = 'saturate(0.96) contrast(1.02)';

      const mediaShade = document.createElement('div');
      mediaShade.style.position = 'absolute';
      mediaShade.style.inset = '0';
      mediaShade.style.background =
        'linear-gradient(180deg, rgba(8, 10, 18, 0.1) 0%, rgba(8, 10, 18, 0.38) 54%, rgba(8, 10, 18, 0.88) 100%)';

      const accent = document.createElement('div');
      accent.style.position = 'absolute';
      accent.style.inset = '0';
      accent.style.background = `radial-gradient(circle at top right, ${sphere.accentColor}40 0%, transparent 38%)`;

      const topMask = document.createElement('div');
      topMask.style.position = 'absolute';
      topMask.style.left = '0';
      topMask.style.right = '0';
      topMask.style.top = '0';
      topMask.style.height = '16px';
      topMask.style.background =
        'linear-gradient(180deg, rgba(6, 9, 19, 0.98) 0%, rgba(6, 9, 19, 0.8) 54%, rgba(6, 9, 19, 0) 100%)';

      const mediaMeta = document.createElement('div');
      mediaMeta.style.position = 'absolute';
      mediaMeta.style.left = '18px';
      mediaMeta.style.right = '18px';
      mediaMeta.style.bottom = '18px';
      mediaMeta.style.display = 'flex';
      mediaMeta.style.justifyContent = 'space-between';
      mediaMeta.style.alignItems = 'flex-end';
      mediaMeta.style.gap = '10px';

      const label = document.createElement('div');
      label.textContent = sphere.eyebrow;
      label.style.color = UI_THEME.colors.textPrimary;
      label.style.fontFamily = UI_THEME.fonts.ui;
      label.style.fontSize = '11px';
      label.style.letterSpacing = '0.16em';
      label.style.textTransform = 'uppercase';

      const visitBadge = document.createElement('div');
      visitBadge.textContent =
        this.callbacks.activeSphereId === sphere.id ? 'Текущая сцена' : 'Новая экскурсия';
      visitBadge.style.padding = '8px 12px';
      visitBadge.style.borderRadius = '999px';
      visitBadge.style.background =
        this.callbacks.activeSphereId === sphere.id
          ? `${sphere.accentColor}30`
          : 'rgba(0, 0, 0, 0.34)';
      visitBadge.style.border = `1px solid ${
        this.callbacks.activeSphereId === sphere.id
          ? `${sphere.accentColor}66`
          : 'rgba(255, 255, 255, 0.14)'
      }`;
      visitBadge.style.color = UI_THEME.colors.textPrimary;
      visitBadge.style.fontFamily = UI_THEME.fonts.ui;
      visitBadge.style.fontSize = '11px';
      visitBadge.style.letterSpacing = '0.06em';
      visitBadge.style.textTransform = 'uppercase';

      mediaMeta.appendChild(label);
      mediaMeta.appendChild(visitBadge);
      media.appendChild(previewImage);
      media.appendChild(mediaShade);
      media.appendChild(accent);
      media.appendChild(topMask);
      media.appendChild(mediaMeta);

      const body = document.createElement('div');
      body.style.display = 'flex';
      body.style.flexDirection = 'column';
      body.style.flex = '1';
      body.style.gap = '16px';
      body.style.padding = '22px';

      const cardTitle = document.createElement('h2');
      cardTitle.textContent = sphere.menuTitle;
      cardTitle.style.margin = '0';
      cardTitle.style.color = UI_THEME.colors.textPrimary;
      cardTitle.style.fontFamily = UI_THEME.fonts.display;
      cardTitle.style.fontSize = sphere.id === 'kerr-black-hole' ? '29px' : '34px';
      cardTitle.style.fontWeight = '600';
      cardTitle.style.lineHeight = '1.02';
      cardTitle.style.maxWidth = '100%';

      const description = document.createElement('p');
      description.textContent = sphere.description;
      description.style.margin = '0';
      description.style.color = UI_THEME.colors.textMuted;
      description.style.fontFamily = UI_THEME.fonts.ui;
      description.style.fontSize = '15px';
      description.style.lineHeight = '1.6';
      description.style.flex = '1';

      const metaRow = document.createElement('div');
      metaRow.style.display = 'flex';
      metaRow.style.gap = '10px';
      metaRow.style.flexWrap = 'wrap';

      metaRow.appendChild(
        this.createMetaChip(`Экскурсия ${formatDurationLabel(getTourDurationMs(sphere.id))}`)
      );
      metaRow.appendChild(this.createMetaChip('Свободная навигация'));

      const actions = document.createElement('div');
      actions.style.display = 'grid';
      actions.style.gridTemplateColumns = '1fr';
      actions.style.gap = '12px';

      actions.appendChild(
        this.createButton('Экскурсия', sphere.accentColor, () =>
          this.callbacks.onTourMode(sphere.id)
        )
      );
      actions.appendChild(
        this.createSecondaryButton('Свободный режим', () =>
          this.callbacks.onFreeMode(sphere.id)
        )
      );

      body.appendChild(cardTitle);
      body.appendChild(description);
      body.appendChild(metaRow);
      body.appendChild(actions);

      card.appendChild(media);
      card.appendChild(body);
      grid.appendChild(card);
    }

    shell.appendChild(hero);
    shell.appendChild(grid);
    container.appendChild(shell);

    return container;
  }

  private createMetaChip(text: string): HTMLElement {
    const chip = document.createElement('div');
    chip.textContent = text;
    chip.style.padding = '9px 12px';
    chip.style.borderRadius = '999px';
    chip.style.background = UI_THEME.colors.surface;
    chip.style.border = `1px solid ${UI_THEME.colors.border}`;
    chip.style.color = UI_THEME.colors.textMuted;
    chip.style.fontFamily = UI_THEME.fonts.ui;
    chip.style.fontSize = '12px';
    chip.style.letterSpacing = '0.04em';
    return chip;
  }

  private createButton(
    text: string,
    accentColor: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.border = 'none';
    button.style.borderRadius = '16px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.width = '100%';
    button.style.minHeight = '52px';
    button.style.padding = '14px 16px';
    button.style.background = `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}bb 100%)`;
    button.style.color = '#09111f';
    button.style.fontFamily = UI_THEME.fonts.ui;
    button.style.fontSize = '15px';
    button.style.fontWeight = '600';
    button.style.lineHeight = '1.2';
    button.style.textAlign = 'center';
    button.style.cursor = 'pointer';
    button.style.transition = 'transform 180ms ease, filter 180ms ease';

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.filter = 'brightness(1.06)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.filter = 'brightness(1)';
    });
    button.addEventListener('click', onClick);

    return button;
  }

  private createSecondaryButton(
    text: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.border = `1px solid ${UI_THEME.colors.border}`;
    button.style.borderRadius = '16px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.width = '100%';
    button.style.minHeight = '52px';
    button.style.padding = '14px 16px';
    button.style.background = UI_THEME.colors.surface;
    button.style.color = UI_THEME.colors.textPrimary;
    button.style.fontFamily = UI_THEME.fonts.ui;
    button.style.fontSize = '15px';
    button.style.fontWeight = '600';
    button.style.lineHeight = '1.2';
    button.style.textAlign = 'center';
    button.style.cursor = 'pointer';
    button.style.transition = 'transform 180ms ease, background 180ms ease';

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.background = UI_THEME.colors.surfaceHover;
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.background = UI_THEME.colors.surface;
    });
    button.addEventListener('click', onClick);

    return button;
  }
}
