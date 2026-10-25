import { describe, expect, it } from 'vitest';
import { createRng, pick, randomInt, shuffle } from './random';

describe('random', () => {
  it('ist mit gleichem Seed reproduzierbar', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('liefert Werte in [0, 1)', () => {
    const rng = createRng(1);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('randomInt deckt beide Grenzen ab', () => {
    const rng = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randomInt(rng, 1, 12));
    expect([...seen].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('shuffle behält alle Elemente', () => {
    expect(shuffle(createRng(3), [1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4]);
  });

  it('pick wirft bei leerer Liste', () => {
    expect(() => pick(createRng(1), [])).toThrow(RangeError);
  });
});
