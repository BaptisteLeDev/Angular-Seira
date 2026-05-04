/**
 * Tokens de design en JS — jumeau de `src/global.css`.
 *
 * Pourquoi ce fichier existe :
 * Uniwind/Tailwind expose les tokens via des classes (`text-on-surface`...) qui
 * marchent dans `className`. Mais certaines APIs React Native attendent une
 * couleur en hex/rgba directement (props `color` d'Icon, styles d'objets passés
 * à des libs tierces comme `react-native-markdown-display`, `LinearGradient`...).
 *
 * Règle : toute valeur ici DOIT rester alignée avec `src/global.css`.
 * Si tu modifies une couleur, modifie les deux endroits.
 */

export type ColorScheme = 'light' | 'dark';

const darkColors: ThemeColors = {
  // Surfaces
  background: '#0b0b0c',
  surface: '#0b0b0c',
  surfaceBright: '#2a2a2d',
  surfaceDim: '#09090a',
  surfaceContainerLowest: '#050506',
  surfaceContainerLow: '#121214',
  surfaceContainer: '#18181b',
  surfaceContainerHigh: '#242428',
  surfaceContainerHighest: '#2d2d31',
  surfaceVariant: '#242428',

  // Foreground
  onSurface: '#fafafa',
  onSurfaceVariant: '#a1a1aa',
  inverseSurface: '#fafafa',
  inverseOnSurface: '#52525b',

  // Primary
  primary: '#7bd0ff',
  primaryDim: '#47c4ff',
  primaryContainer: '#0e3a4d',
  onPrimary: '#041c27',
  onPrimaryContainer: '#97d8ff',

  // Outlines
  outline: '#71717a',
  outlineVariant: '#3f3f46',

  // States
  error: '#f87171',
  errorContainer: '#5c1a1a',
  onErrorContainer: '#fecaca',
  secondary: '#a1a1aa',
  tertiary: '#e4e4e7',

  // Category accents
  catDev: '#7bd0ff',
  catDesign: '#c084fc',
  catProject: '#fbbf24',
  catComm: '#34d399',
  catSecurity: '#f87171',
  catData: '#818cf8',

  // Overlays utilitaires (n'existent pas dans Uniwind, locaux à RN)
  overlayLight: 'rgba(255,255,255,0.08)',
  overlayLighter: 'rgba(255,255,255,0.06)',
  overlayLightest: 'rgba(255,255,255,0.04)',
  primaryTint: 'rgba(123,208,255,0.08)',
  primaryTintMid: 'rgba(123,208,255,0.15)',
};

const lightColors: ThemeColors = {
  // Surfaces
  background: '#fafafa',
  surface: '#ffffff',
  surfaceBright: '#ffffff',
  surfaceDim: '#f1f1f3',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f7f7f8',
  surfaceContainer: '#f1f1f3',
  surfaceContainerHigh: '#e8e8ec',
  surfaceContainerHighest: '#dedee3',
  surfaceVariant: '#e8e8ec',

  // Foreground
  onSurface: '#0b0b0c',
  onSurfaceVariant: '#52525b',
  inverseSurface: '#0b0b0c',
  inverseOnSurface: '#fafafa',

  // Primary
  primary: '#0a7ea4',
  primaryDim: '#0e6e8f',
  primaryContainer: '#cdeaf5',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#053545',

  // Outlines
  outline: '#a1a1aa',
  outlineVariant: '#d4d4d8',

  // States
  error: '#dc2626',
  errorContainer: '#fee2e2',
  onErrorContainer: '#7f1d1d',
  secondary: '#52525b',
  tertiary: '#27272a',

  // Category accents
  catDev: '#0a7ea4',
  catDesign: '#9333ea',
  catProject: '#d97706',
  catComm: '#059669',
  catSecurity: '#dc2626',
  catData: '#4f46e5',

  // Overlays utilitaires
  overlayLight: 'rgba(0,0,0,0.06)',
  overlayLighter: 'rgba(0,0,0,0.04)',
  overlayLightest: 'rgba(0,0,0,0.02)',
  primaryTint: 'rgba(10,126,164,0.08)',
  primaryTintMid: 'rgba(10,126,164,0.15)',
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceBright: string;
  surfaceDim: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  primary: string;
  primaryDim: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  outline: string;
  outlineVariant: string;
  error: string;
  errorContainer: string;
  onErrorContainer: string;
  secondary: string;
  tertiary: string;
  catDev: string;
  catDesign: string;
  catProject: string;
  catComm: string;
  catSecurity: string;
  catData: string;
  overlayLight: string;
  overlayLighter: string;
  overlayLightest: string;
  primaryTint: string;
  primaryTintMid: string;
};

export function getPalette(scheme: ColorScheme): ThemeColors {
  return scheme === 'light' ? lightColors : darkColors;
}

/**
 * Palette par défaut (dark). Pour les composants qui ne peuvent pas être
 * réactifs au thème, on garde l'ancien export. Préférer `useThemeColors()`
 * dans tout nouveau code.
 */
export const colors = darkColors;

export const fonts = {
  headline: 'system-ui, -apple-system, sans-serif',
  body: 'system-ui, -apple-system, sans-serif',
  mono: 'ui-monospace, Menlo, monospace',
} as const;
