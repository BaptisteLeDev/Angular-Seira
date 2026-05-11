import { create } from 'zustand';
import { Appearance } from 'react-native';

import { storage } from '@src/utils/storage';
import type { ColorScheme } from '@src/constants/theme';

const THEME_KEY = 'seira.theme.preference';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeState = {
  preference: ThemePreference;
  effective: ColorScheme;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPreference: (pref: ThemePreference) => Promise<void>;
  /** Called by ThemeProvider when system scheme changes (preference=system). */
  syncSystem: (system: ColorScheme | null | undefined) => void;
};

function resolve(pref: ThemePreference, system: ColorScheme | null | undefined): ColorScheme {
  if (pref === 'system') return system === 'light' ? 'light' : 'dark';
  return pref;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'system',
  effective: 'dark',
  hydrated: false,

  hydrate: async () => {
    const raw = await storage.get(THEME_KEY);
    const pref: ThemePreference =
      raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
    const system = Appearance.getColorScheme();
    const effective = resolve(pref, system);
    Appearance.setColorScheme(pref === 'system' ? null : pref);
    set({ preference: pref, effective, hydrated: true });
  },

  setPreference: async (pref) => {
    await storage.set(THEME_KEY, pref);
    Appearance.setColorScheme(pref === 'system' ? null : pref);
    const system = Appearance.getColorScheme();
    set({ preference: pref, effective: resolve(pref, system) });
  },

  syncSystem: (system) => {
    const { preference } = get();
    if (preference !== 'system') return;
    set({ effective: resolve(preference, system) });
  },
}));
