import { describe, expect, it } from 'vitest';
import {
  defaultState,
  LocalStorageProgressStorage,
  MemoryProgressStorage,
  parseSaved,
  serialize,
  STORAGE_KEY,
  type SavedState,
} from './progressStorage';

const sample: SavedState = {
  progress: { unlocked: 3, levels: { 1: { streak: 0, stars: 7, completed: true }, 3: { streak: 2, stars: 4, completed: false } } },
  settings: { wordVariant: 'ost' },
};

class FakeStorage implements Storage {
  map = new Map<string, string>();
  failWrites = false;
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  setItem(k: string, v: string) {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.map.set(k, v);
  }
}

describe('parseSaved', () => {
  it('liest, was serialize schreibt', () => {
    expect(parseSaved(JSON.parse(serialize(sample)))).toEqual(sample);
  });

  it.each([
    ['null', null],
    ['falsche Version', { version: 2, progress: sample.progress }],
    ['ohne Fortschritt', { version: 1 }],
    ['unbekanntes Level freigeschaltet', { version: 1, progress: { unlocked: 9, levels: {} } }],
    ['Array statt Objekt', { version: 1, progress: { unlocked: 1, levels: [] } }],
  ])('verwirft %s', (_, raw) => {
    expect(parseSaved(raw)).toBeNull();
  });

  it('lässt kaputte Level-Einträge weg und fällt bei unbekannter Variante auf Standard zurück', () => {
    const parsed = parseSaved({
      version: 1,
      progress: {
        unlocked: 2,
        levels: { 1: { streak: 1, stars: 2, completed: false }, 2: { streak: -1, stars: 0, completed: false }, 42: { streak: 0, stars: 0, completed: false } },
      },
      settings: { wordVariant: 'bayrisch' },
    });
    expect(parsed).toEqual({
      progress: { unlocked: 2, levels: { 1: { streak: 1, stars: 2, completed: false } } },
      settings: { wordVariant: 'standard' },
    });
  });

  it('enthält keine personenbezogenen Daten', () => {
    expect(Object.keys(JSON.parse(serialize(defaultState()))).sort()).toEqual(['progress', 'settings', 'version']);
  });
});

describe('LocalStorageProgressStorage', () => {
  it('speichert, lädt und löscht', () => {
    const fake = new FakeStorage();
    const storage = new LocalStorageProgressStorage(fake);
    expect(storage.load()).toBeNull();
    storage.save(sample);
    expect(fake.getItem(STORAGE_KEY)).toContain('"version":1');
    expect(storage.load()).toEqual(sample);
    storage.clear();
    expect(storage.load()).toBeNull();
  });

  it('übersteht kaputtes JSON und Schreibfehler', () => {
    const fake = new FakeStorage();
    fake.setItem(STORAGE_KEY, '{kaputt');
    const storage = new LocalStorageProgressStorage(fake);
    expect(storage.load()).toBeNull();
    fake.failWrites = true;
    expect(() => storage.save(sample)).not.toThrow();
  });

  it('funktioniert ohne localStorage (z. B. gesperrt)', () => {
    const storage = new LocalStorageProgressStorage(null);
    expect(storage.load()).toBeNull();
    expect(() => storage.save(sample)).not.toThrow();
  });
});

describe('MemoryProgressStorage', () => {
  it('verhält sich wie der echte Speicher', () => {
    const storage = new MemoryProgressStorage();
    storage.save(sample);
    expect(storage.load()).toEqual(sample);
    storage.clear();
    expect(storage.load()).toBeNull();
  });
});
