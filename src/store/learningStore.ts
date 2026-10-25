import { create } from 'zustand';
import type { LevelId } from '../domain/levels';
import { createRng, type Rng } from '../domain/random';
import {
  checkAnswer,
  dial,
  initialProgress,
  nextStep,
  selectOption,
  showHint,
  startSession,
  type Progress,
  type Session,
} from '../domain/session';
import type { ClockTime } from '../domain/time';
import type { WordVariant } from '../domain/words';
import {
  defaultState,
  LocalStorageProgressStorage,
  type ProgressStorage,
  type Settings,
} from '../storage/progressStorage';

/**
 * Dünne Hülle um die reinen Funktionen aus domain/session.
 * Fortschritt und Einstellungen werden über ProgressStorage geladen und bei jeder Änderung gespeichert.
 */
export interface LearningState {
  progress: Progress;
  settings: Settings;
  session: Session | null;
  startLevel: (level: LevelId) => void;
  select: (index: number) => void;
  dial: (time: ClockTime) => void;
  hint: () => void;
  check: () => void;
  next: () => void;
  leave: () => void;
  setWordVariant: (variant: WordVariant) => void;
  resetProgress: () => void;
}

/** ?seed=123 in der URL macht Aufgaben reproduzierbar (für E2E-Tests). */
export function rngFromLocation(search: string): Rng {
  const seed = Number(new URLSearchParams(search).get('seed'));
  return Number.isInteger(seed) && seed > 0 ? createRng(seed) : Math.random;
}

export function createLearningStore(rng: Rng, storage: ProgressStorage) {
  const saved = storage.load() ?? defaultState();
  const store = create<LearningState>()((set, get) => ({
    progress: saved.progress,
    settings: saved.settings,
    session: null,
    startLevel: (level) => set({ session: startSession(level, rng, get().settings.wordVariant) }),
    select: (index) => {
      const { session } = get();
      if (session) set({ session: selectOption(session, index) });
    },
    dial: (time) => {
      const { session } = get();
      if (session) set({ session: dial(session, time) });
    },
    hint: () => {
      const { session } = get();
      if (session) set({ session: showHint(session) });
    },
    check: () => {
      const { session, progress: p } = get();
      if (session) set(checkAnswer(session, p));
    },
    next: () => {
      const { session, progress: p } = get();
      if (session) set(nextStep(session, p, rng));
    },
    leave: () => set({ session: null }),
    setWordVariant: (wordVariant) => set({ settings: { ...get().settings, wordVariant }, session: null }),
    resetProgress: () => set({ progress: initialProgress(), session: null }),
  }));

  store.subscribe((state, prev) => {
    if (state.progress !== prev.progress || state.settings !== prev.settings) {
      storage.save({ progress: state.progress, settings: state.settings });
    }
  });
  return store;
}

export const useLearningStore = createLearningStore(
  rngFromLocation(typeof window === 'undefined' ? '' : window.location.search),
  new LocalStorageProgressStorage(),
);
