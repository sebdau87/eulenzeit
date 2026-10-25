import { describe, expect, it } from 'vitest';
import { createRng } from '../domain/random';
import { levelProgress } from '../domain/session';
import { MemoryProgressStorage } from '../storage/progressStorage';
import { createLearningStore, rngFromLocation } from './learningStore';

describe('learningStore', () => {
  it('führt eine Aufgabe von Start bis Lob', () => {
    const store = createLearningStore(createRng(1), new MemoryProgressStorage());
    store.getState().startLevel(1);
    const { session } = store.getState();
    expect(session?.phase).toBe('asking');
    store.getState().select(session!.question.correctIndex);
    store.getState().check();
    expect(store.getState().session?.phase).toBe('correct');
    expect(levelProgress(store.getState().progress, 1).stars).toBe(1);
    store.getState().next();
    expect(store.getState().session?.phase).toBe('asking');
    store.getState().leave();
    expect(store.getState().session).toBeNull();
  });

  it('speichert Fortschritt und lädt ihn in einem neuen Store wieder', () => {
    const storage = new MemoryProgressStorage();
    const first = createLearningStore(createRng(2), storage);
    first.getState().startLevel(1);
    first.getState().select(first.getState().session!.question.correctIndex);
    first.getState().check();

    const second = createLearningStore(createRng(3), storage);
    expect(levelProgress(second.getState().progress, 1)).toMatchObject({ stars: 1, streak: 1 });
    expect(second.getState().session).toBeNull();
  });

  it('speichert die Wortvariante und nutzt sie für neue Sitzungen', () => {
    const storage = new MemoryProgressStorage();
    const store = createLearningStore(createRng(4), storage);
    store.getState().setWordVariant('ost');
    expect(storage.load()?.settings.wordVariant).toBe('ost');
    store.getState().startLevel(3);
    expect(store.getState().session?.variant).toBe('ost');
  });

  it('setzt den Fortschritt zurück, behält die Einstellungen', () => {
    const storage = new MemoryProgressStorage();
    storage.save({
      progress: { unlocked: 4, levels: { 1: { streak: 0, stars: 9, completed: true } } },
      settings: { wordVariant: 'ost' },
    });
    const store = createLearningStore(createRng(5), storage);
    expect(store.getState().progress.unlocked).toBe(4);
    store.getState().resetProgress();
    expect(storage.load()).toEqual({
      progress: { unlocked: 1, levels: {} },
      settings: { wordVariant: 'ost' },
    });
  });

  it('stellt beim Zeiger-Stellen die Zeiger', () => {
    const store = createLearningStore(createRng(6), new MemoryProgressStorage());
    store.getState().startLevel(7);
    store.getState().dial({ hour: 3, minute: 15 });
    expect(store.getState().session?.dialed).toEqual({ hour: 3, minute: 15 });
  });

  it('liest einen Seed aus der URL', () => {
    const a = rngFromLocation('?seed=5');
    const b = rngFromLocation('?seed=5');
    expect(a()).toBe(b());
    expect(rngFromLocation('')).toBe(Math.random);
    expect(rngFromLocation('?seed=-3')).toBe(Math.random);
  });
});
