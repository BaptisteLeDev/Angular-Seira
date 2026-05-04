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

export const colors = {
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
} as const;

export const fonts = {
  headline: 'system-ui, -apple-system, sans-serif',
  body: 'system-ui, -apple-system, sans-serif',
  mono: 'ui-monospace, Menlo, monospace',
} as const;
