import { describe, expect, it } from 'vitest';
import { allowedMinutes, getLevel, LEVELS, type LevelId } from './levels';
import { confusionsFor, createQuestion, dialStart, face, generateOptions, OPTION_COUNT, randomTime } from './questions';
import { createRng } from './random';
import { isSameClockFace } from './time';
import { timeToGermanWords } from './words';

const playable = LEVELS.filter((l) => l.playable).map((l) => l.id);
const withOptions = LEVELS.filter((l) => l.kind !== 'digital-to-clock').map((l) => l.id);

describe('randomTime', () => {
  it.each(playable)('Level %s erzeugt nur erlaubte Minuten und Stunden 1–12', (level) => {
    const rng = createRng(level * 11);
    const allowed = allowedMinutes(getLevel(level));
    for (let i = 0; i < 300; i++) {
      const t = randomTime(level, rng);
      expect(allowed.has(t.minute)).toBe(true);
      expect(t.hour).toBeGreaterThanOrEqual(1);
      expect(t.hour).toBeLessThanOrEqual(12);
    }
  });

  it('wiederholt nicht dieselbe Aufgabe direkt', () => {
    const rng = createRng(5);
    let prev = randomTime(1, rng);
    for (let i = 0; i < 200; i++) {
      const t = randomTime(1, rng, prev);
      expect(isSameClockFace(t, prev)).toBe(false);
      prev = t;
    }
  });

  it('bringt in Level 2 auch Wiederholungen aus Level 1', () => {
    const rng = createRng(9);
    const minutes = new Set(Array.from({ length: 200 }, () => randomTime(2, rng).minute));
    expect(minutes).toEqual(new Set([0, 30]));
  });
});

describe('confusionsFor', () => {
  it('vertauscht die Zeiger wie im Auftrag: 10:25 → 5:50', () => {
    expect(confusionsFor(face(10, 25)).swapped).toEqual({ hour: 5, minute: 50 });
  });

  it('hat für 4:30 „halb vier“ und „halb sechs“ als Verwechslung', () => {
    const { others } = confusionsFor(face(4, 30));
    expect(others).toContainEqual({ hour: 3, minute: 30 });
    expect(others).toContainEqual({ hour: 5, minute: 30 });
  });

  it('verwechselt vor/nach: 4:25 ↔ 4:35, Viertel nach vier ↔ Viertel vor vier', () => {
    expect(confusionsFor(face(4, 25)).others).toContainEqual({ hour: 4, minute: 35 });
    expect(confusionsFor(face(4, 15)).others).toContainEqual({ hour: 3, minute: 45 });
  });

  it('bleibt auf dem Zifferblatt: 12 ± 1 → 1 und 11', () => {
    const { others } = confusionsFor(face(12, 0));
    expect(others).toContainEqual({ hour: 1, minute: 0 });
    expect(others).toContainEqual({ hour: 11, minute: 0 });
  });

  it('hat bei krummen Minuten keinen Zeigertausch', () => {
    expect(confusionsFor(face(4, 17)).swapped).toBeNull();
  });
});

describe('generateOptions', () => {
  it.each(withOptions)('Level %s: immer 4 verschiedene Optionen, genau eine richtig', (level) => {
    const rng = createRng(100 + level);
    const allowed = allowedMinutes(getLevel(level));
    for (let i = 0; i < 300; i++) {
      const q = createQuestion(level as LevelId, rng);
      expect(q.options).toHaveLength(OPTION_COUNT);
      const words = new Set(q.options.map((o) => timeToGermanWords(o)));
      expect(words.size).toBe(OPTION_COUNT);
      expect(isSameClockFace(q.options[q.correctIndex]!, q.time)).toBe(true);
      expect(q.options.filter((o) => isSameClockFace(o, q.time))).toHaveLength(1);
      for (const o of q.options) expect(allowed.has(o.minute)).toBe(true);
    }
  });

  it('nimmt den Zeigertausch auf, wenn er ins Level passt (10:25 in Level 4)', () => {
    const q = generateOptions(face(10, 25), 4, createRng(1));
    expect(q.options).toContainEqual({ hour: 5, minute: 50 });
  });

  it('bietet in Level 1 nur volle Stunden an', () => {
    const q = generateOptions(face(4, 0), 1, createRng(2));
    expect(q.options.every((o) => o.minute === 0)).toBe(true);
  });

  it('verteilt die richtige Antwort auf alle Positionen', () => {
    const rng = createRng(77);
    const positions = new Set(Array.from({ length: 100 }, () => createQuestion(3, rng).correctIndex));
    expect(positions).toEqual(new Set([0, 1, 2, 3]));
  });
});

describe('Aufgabenarten', () => {
  it.each([
    [1, 'clock-to-words'],
    [5, 'clock-to-words'],
    [6, 'clock-to-digital'],
    [7, 'digital-to-clock'],
    [8, 'words-to-clock'],
  ] as const)('Level %s → %s', (level, kind) => {
    expect(createQuestion(level, createRng(level)).kind).toBe(kind);
  });

  it('Zeiger stellen: keine Optionen, Start nie schon die Lösung', () => {
    const rng = createRng(70);
    for (let i = 0; i < 200; i++) {
      const q = createQuestion(7, rng);
      expect(q.options).toEqual([]);
      expect(q.correctIndex).toBe(-1);
      expect(isSameClockFace(q.start!, q.time)).toBe(false);
      expect(q.time.minute % 5).toBe(0);
    }
  });

  it('dialStart weicht bei 12 Uhr auf 6 Uhr aus', () => {
    expect(dialStart(face(12, 0))).toEqual({ hour: 6, minute: 0 });
    expect(dialStart(face(4, 30))).toEqual({ hour: 12, minute: 0 });
  });

  it('Level 8 nutzt nur Fünferschritte', () => {
    const rng = createRng(80);
    for (let i = 0; i < 100; i++) {
      for (const o of createQuestion(8, rng).options) expect(o.minute % 5).toBe(0);
    }
  });
});
