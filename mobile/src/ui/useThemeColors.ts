import { useThemeStore } from '@src/stores/theme.store';
import { getPalette, type ThemeColors } from '@src/constants/theme';

/** Returns the active palette (reactive to theme preference + system scheme). */
export function useThemeColors(): ThemeColors {
  const effective = useThemeStore((s) => s.effective);
  return getPalette(effective);
}

export function useColorScheme() {
  return useThemeStore((s) => s.effective);
}
