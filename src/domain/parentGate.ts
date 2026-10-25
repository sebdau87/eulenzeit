import { randomInt, type Rng } from './random';

/**
 * Eltern-Hürde: eine Einmaleins-Aufgabe mit Faktoren 6–9.
 * Für Kinder von 6–8 Jahren in der Regel zu schwer, für Erwachsene trivial.
 * Keine Sicherheitsfunktion, nur eine Hürde gegen versehentliches Umstellen (DECISIONS D31).
 */
export interface GateChallenge {
  a: number;
  b: number;
}

export function createChallenge(rng: Rng): GateChallenge {
  return { a: randomInt(rng, 6, 9), b: randomInt(rng, 6, 9) };
}

export function checkChallenge(challenge: GateChallenge, input: string): boolean {
  const value = Number(input.trim());
  return input.trim() !== '' && Number.isInteger(value) && value === challenge.a * challenge.b;
}
