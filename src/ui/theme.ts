export const UI_THEME = {
  fonts: {
    display:
      '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    ui: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  },
  shadows: {
    text: '0 10px 30px rgba(0, 0, 0, 0.5)',
    panel: '0 24px 60px rgba(0, 0, 0, 0.34)',
    card: '0 18px 36px rgba(0, 0, 0, 0.3)',
  },
  colors: {
    textPrimary: '#f4f0e8',
    textMuted: 'rgba(244, 240, 232, 0.78)',
    border: 'rgba(255, 255, 255, 0.14)',
    panel: 'rgba(7, 10, 18, 0.58)',
    panelStrong: 'rgba(7, 10, 18, 0.74)',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceHover: 'rgba(255, 255, 255, 0.1)',
  },
} as const;
