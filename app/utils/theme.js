import { theme } from '../theme';

export function applyTheme() {
  // Ensure DOM is loaded
  if (!document || !document.documentElement) {
    console.warn('DOM not ready when applying theme');
    return;
  }

  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--${cssVar}`, value);
    console.log(`Setting ${cssVar} to ${value}`); // Debug log
  });
} 