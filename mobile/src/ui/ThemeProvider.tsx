import { useEffect, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { useThemeStore } from '@src/stores/theme.store';
import { getPalette } from '@src/constants/theme';

/**
 * Reads the persisted theme preference, applies it to RN's Appearance API,
 * keeps the system-UI background color in sync. Renders children unchanged.
 *
 * The smooth fade between themes is handled by `<ThemeFadeOverlay />`, which
 * must be mounted as a sibling of the app content (typically inside
 * `SafeAreaProvider` in the root layout).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const effective = useThemeStore((s) => s.effective);
  const syncSystem = useThemeStore((s) => s.syncSystem);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      syncSystem(colorScheme);
    });
    return () => sub.remove();
  }, [syncSystem]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(getPalette(effective).background);
  }, [effective]);

  return <>{children}</>;
}
