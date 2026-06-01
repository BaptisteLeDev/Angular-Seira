import { create } from 'zustand';
import { SchoolApi } from '@src/api/school.api';
import type { School } from '@src/schemas/school.schema';

type Status = 'idle' | 'loading' | 'error';

type SchoolState = {
  items: readonly School[];
  status: Status;
  error: string | null;
  load: (force?: boolean) => Promise<void>;
};

export const useSchoolStore = create<SchoolState>((set, get) => ({
  items: [],
  status: 'idle',
  error: null,

  async load(force = false) {
    const { status, items } = get();
    if (!force && (status === 'loading' || items.length > 0)) return;
    set({ status: 'loading', error: null });
    try {
      const result = await SchoolApi.list();
      set({ items: result, status: 'idle' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les écoles.';
      set({ status: 'error', error: message });
    }
  },
}));
