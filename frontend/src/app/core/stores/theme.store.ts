import { Injectable, computed, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'seira.theme.preference';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly _preference = signal<ThemePreference>(readPreference());
  private readonly _systemTheme = signal<ResolvedTheme>(readSystemTheme());

  readonly preference = this._preference.asReadonly();
  readonly resolved = computed<ResolvedTheme>(() => {
    const pref = this._preference();
    return pref === 'system' ? this._systemTheme() : pref;
  });

  constructor() {
    this.applyClass(this.resolved());

    const media = matchSystem();
    if (media) {
      const handler = (e: MediaQueryListEvent) => {
        this._systemTheme.set(e.matches ? 'dark' : 'light');
        if (this._preference() === 'system') {
          this.applyClass(this.resolved());
        }
      };
      media.addEventListener('change', handler);
    }
  }

  setPreference(pref: ThemePreference): void {
    this._preference.set(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* ignore */
    }
    this.applyClass(this.resolved());
  }

  private applyClass(theme: ResolvedTheme): void {
    const html = document.documentElement;
    html.classList.toggle('light', theme === 'light');
    html.classList.toggle('dark', theme === 'dark');
  }
}

function readPreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    /* ignore */
  }
  return 'system';
}

function readSystemTheme(): ResolvedTheme {
  return matchSystem()?.matches ? 'dark' : 'light';
}

function matchSystem(): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  return window.matchMedia('(prefers-color-scheme: dark)');
}
