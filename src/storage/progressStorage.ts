import { isLevelId, STREAK_TO_UNLOCK, type LevelId } from '../domain/levels';
import { initialProgress, type LevelProgress, type Progress } from '../domain/session';
import { WORD_VARIANTS, type WordVariant } from '../domain/words';

/** Einstellungen, die Eltern hinter der Eltern-Hürde ändern. */
export interface Settings {
  wordVariant: WordVariant;
}

export interface SavedState {
  progress: Progress;
  settings: Settings;
}

/**
 * Austauschbare Speicherschicht. Heute localStorage auf dem Gerät;
 * später z. B. IndexedDB oder ein Export – die App kennt nur dieses Interface.
 */
export interface ProgressStorage {
  load(): SavedState | null;
  save(state: SavedState): void;
  clear(): void;
}

export const DEFAULT_SETTINGS: Settings = { wordVariant: 'standard' };
export const STORAGE_KEY = 'eulenzeit:v1';
const VERSION = 1;

export function defaultState(): SavedState {
  return { progress: initialProgress(), settings: { ...DEFAULT_SETTINGS } };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;

function parseLevelProgress(v: unknown): LevelProgress | null {
  if (!isRecord(v)) return null;
  const { streak, stars, completed } = v;
  if (!isCount(streak, STREAK_TO_UNLOCK) || !isCount(stars) || typeof completed !== 'boolean') return null;
  return { streak, stars, completed };
}

/**
 * Prüft gespeicherte Daten streng. Unbekanntes oder Kaputtes wird verworfen,
 * statt die App in einen ungültigen Zustand zu bringen.
 */
export function parseSaved(raw: unknown): SavedState | null {
  if (!isRecord(raw) || raw.version !== VERSION || !isRecord(raw.progress)) return null;
  const { unlocked, levels } = raw.progress;
  if (typeof unlocked !== 'number' || !isLevelId(unlocked) || !isRecord(levels)) return null;

  const parsedLevels: Progress['levels'] = {};
  for (const [key, value] of Object.entries(levels)) {
    const id = Number(key);
    const lp = parseLevelProgress(value);
    if (isLevelId(id) && lp) parsedLevels[id as LevelId] = lp;
  }

  const settings = isRecord(raw.settings) ? raw.settings : {};
  const wordVariant = WORD_VARIANTS.includes(settings.wordVariant as WordVariant)
    ? (settings.wordVariant as WordVariant)
    : DEFAULT_SETTINGS.wordVariant;

  return { progress: { unlocked, levels: parsedLevels }, settings: { wordVariant } };
}

export function serialize(state: SavedState): string {
  return JSON.stringify({ version: VERSION, ...state });
}

/** localStorage-Implementierung. Fehler (privater Modus, voller Speicher) brechen die App nie ab. */
export class LocalStorageProgressStorage implements ProgressStorage {
  constructor(
    private readonly storage: Storage | null = LocalStorageProgressStorage.safeLocalStorage(),
    private readonly key: string = STORAGE_KEY,
  ) {}

  static safeLocalStorage(): Storage | null {
    try {
      return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
      return null;
    }
  }

  load(): SavedState | null {
    try {
      const raw = this.storage?.getItem(this.key);
      return raw ? parseSaved(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  save(state: SavedState): void {
    try {
      this.storage?.setItem(this.key, serialize(state));
    } catch {
      // Speichern ist best effort; Lernen funktioniert auch ohne.
    }
  }

  clear(): void {
    try {
      this.storage?.removeItem(this.key);
    } catch {
      // ignorieren
    }
  }
}

/** Für Tests und als Fallback. */
export class MemoryProgressStorage implements ProgressStorage {
  private data: string | null = null;

  load(): SavedState | null {
    return this.data ? parseSaved(JSON.parse(this.data)) : null;
  }

  save(state: SavedState): void {
    this.data = serialize(state);
  }

  clear(): void {
    this.data = null;
  }
}

