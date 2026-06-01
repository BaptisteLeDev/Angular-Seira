import { create } from 'zustand';
import { FormationApi } from '@src/api/formation.api';
import type { Chapitre } from '@src/schemas/chapitre.schema';
import type { Formation } from '@src/schemas/formation.schema';

type Status = 'idle' | 'loading' | 'error';

type FormationState = {
  items: readonly Formation[];
  available: readonly Formation[];
  locked: readonly Formation[];
  status: Status;
  error: string | null;
  chapitresByFormation: Record<number, readonly Chapitre[]>;
  chapitresStatus: Record<number, Status>;
  chapitresError: Record<number, string>;

  load: (force?: boolean) => Promise<void>;
  loadMine: (force?: boolean) => Promise<void>;
  loadChapitres: (formationId: number, force?: boolean) => Promise<void>;
  byId: (id: number) => Formation | null;
  chapitresOf: (formationId: number) => readonly Chapitre[];
  chapitresStatusOf: (formationId: number) => Status;
  chapitresErrorOf: (formationId: number) => string | null;
};

export const useFormationStore = create<FormationState>((set, get) => ({
  items: [],
  available: [],
  locked: [],
  status: 'idle',
  error: null,
  chapitresByFormation: {},
  chapitresStatus: {},
  chapitresError: {},

  byId(id) {
    return get().items.find((f) => f.id === id) ?? null;
  },

  chapitresOf(formationId) {
    return get().chapitresByFormation[formationId] ?? [];
  },

  chapitresStatusOf(formationId) {
    return get().chapitresStatus[formationId] ?? 'idle';
  },

  chapitresErrorOf(formationId) {
    return get().chapitresError[formationId] ?? null;
  },

  async load(force = false) {
    const { status, items } = get();
    if (!force && (status === 'loading' || items.length > 0)) return;

    set({ status: 'loading', error: null });
    try {
      const result = await FormationApi.list();
      set({ items: result, status: 'idle' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les formations.';
      set({ status: 'error', error: message });
    }
  },

  async loadMine(force = false) {
    const { status, available, locked } = get();
    if (!force && (status === 'loading' || available.length > 0 || locked.length > 0)) return;

    set({ status: 'loading', error: null });
    try {
      const { available: av, locked: lk } = await FormationApi.listForMe();
      set({
        available: av,
        locked: lk,
        items: [...av, ...lk],
        status: 'idle',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger vos formations.';
      set({ status: 'error', error: message });
    }
  },

  async loadChapitres(formationId, force = false) {
    const state = get();
    const currentStatus = state.chapitresStatus[formationId];
    const alreadyLoaded = state.chapitresByFormation[formationId] !== undefined;
    if (!force && (currentStatus === 'loading' || alreadyLoaded)) return;

    const formation = state.items.find((f) => f.id === formationId);
    const chapterIris = formation?.chapters ?? [];

    if (chapterIris.length === 0) {
      set((s) => ({
        chapitresByFormation: { ...s.chapitresByFormation, [formationId]: [] },
        chapitresStatus: { ...s.chapitresStatus, [formationId]: 'idle' },
      }));
      return;
    }

    set((s) => ({
      chapitresStatus: { ...s.chapitresStatus, [formationId]: 'loading' },
      chapitresError: omit(s.chapitresError, formationId),
    }));

    try {
      const chapitres = await FormationApi.getChapitresByIris([...chapterIris]);
      const sorted = [...chapitres].sort((a, b) => a.sortOrder - b.sortOrder);
      set((s) => ({
        chapitresByFormation: { ...s.chapitresByFormation, [formationId]: sorted },
        chapitresStatus: { ...s.chapitresStatus, [formationId]: 'idle' },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les chapitres.';
      set((s) => ({
        chapitresStatus: { ...s.chapitresStatus, [formationId]: 'error' },
        chapitresError: { ...s.chapitresError, [formationId]: message },
      }));
    }
  },
}));

function omit<K extends string | number, V>(record: Record<K, V>, key: K): Record<K, V> {
  const { [key]: _removed, ...rest } = record;
  return rest as Record<K, V>;
}
