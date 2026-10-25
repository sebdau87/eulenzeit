import { describe, expect, it } from 'vitest';
import { checkChallenge, createChallenge } from './parentGate';
import { createRng } from './random';

describe('parentGate', () => {
  it('erzeugt Faktoren 6–9', () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) {
      const { a, b } = createChallenge(rng);
      for (const f of [a, b]) {
        expect(f).toBeGreaterThanOrEqual(6);
        expect(f).toBeLessThanOrEqual(9);
      }
    }
  });

  it.each([
    ['56', true],
    [' 56 ', true],
    ['55', false],
    ['', false],
    ['56.0', true],
    ['abc', false],
  ])('7 × 8 mit „%s“ → %s', (input, ok) => {
    expect(checkChallenge({ a: 7, b: 8 }, input)).toBe(ok);
  });
});
