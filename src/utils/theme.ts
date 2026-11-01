import { AppSettings } from '../types';

/**
 * Applies custom brand colors and styling dynamically to CSS root variables.
 * Enables instant white-label re-theming across the entire application without reload.
 */
export function applyThemeColors(settings?: Partial<AppSettings> | null) {
  if (typeof document === 'undefined' || !settings) return;
  const root = document.documentElement;

  if (settings.primaryColor) {
    root.style.setProperty('--brand-primary', settings.primaryColor);
    root.style.setProperty('--primary', settings.primaryColor);
    root.style.setProperty('--ring', settings.primaryColor);
  }

  if (settings.primaryDarkColor) {
    root.style.setProperty('--brand-primary-dark', settings.primaryDarkColor);
  }

  if (settings.actionColor) {
    root.style.setProperty('--brand-action', settings.actionColor);
  }

  if (settings.backgroundColor) {
    root.style.setProperty('--brand-bg', settings.backgroundColor);
  }
}
