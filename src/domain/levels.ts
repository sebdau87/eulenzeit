export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Aufgabenart:
 * - clock-to-words:   Uhr lesen, Antwort in Worten („halb fünf“)
 * - clock-to-digital: Uhr lesen, Antwort digital („4:30“)
 * - digital-to-clock: Digitalzeit vorgegeben, Zeiger selbst stellen
 * - words-to-clock:   Zeit in Worten vorgegeben, passende Uhr wählen
 */
export type QuestionKind = 'clock-to-words' | 'clock-to-digital' | 'digital-to-clock' | 'words-to-clock';

export interface LevelDef {
  id: LevelId;
  kind: QuestionKind;
  title: string;
  /** Kurzer Satz für die Levelauswahl. */
  description: string;
  /** Minuten, um die es in diesem Level geht. */
  minutes: readonly number[];
  /** Bereits gelernte Minuten, die gelegentlich zur Wiederholung kommen. */
  review: readonly number[];
  /** Spielbar? (Erlaubt, Level anzukündigen, bevor sie fertig sind.) */
  playable: boolean;
}

const range = (from: number, to: number, step = 1) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

const FIVES = range(0, 55, 5);
const ODD = range(0, 59).filter((m) => m % 5 !== 0);

export const LEVELS: readonly LevelDef[] = [
  { id: 1, kind: 'clock-to-words', title: 'Volle Stunden', description: 'Drei Uhr, vier Uhr …', minutes: [0], review: [], playable: true },
  { id: 2, kind: 'clock-to-words', title: 'Halbe Stunden', description: 'Halb vier, halb fünf …', minutes: [30], review: [0], playable: true },
  {
    id: 3,
    kind: 'clock-to-words',
    title: 'Viertel nach und vor',
    description: 'Viertel nach drei, Viertel vor vier',
    minutes: [15, 45],
    review: [0, 30],
    playable: true,
  },
  {
    id: 4,
    kind: 'clock-to-words',
    title: 'Fünf-Minuten-Schritte',
    description: 'Fünf nach, zehn vor, fünf vor halb …',
    minutes: [5, 10, 20, 25, 35, 40, 50, 55],
    review: [0, 15, 30, 45],
    playable: true,
  },
  { id: 5, kind: 'clock-to-words', title: 'Jede Minute', description: 'Vier Uhr siebzehn …', minutes: ODD, review: FIVES, playable: true },
  { id: 6, kind: 'clock-to-digital', title: 'Analog und digital', description: 'Von der Uhr zur Digitalzeit', minutes: range(0, 59), review: [], playable: true },
  { id: 7, kind: 'digital-to-clock', title: 'Zeiger stellen', description: 'Stell die Uhr selbst', minutes: FIVES, review: [], playable: true },
  // Level 7 und 8 nur in Fünferschritten (DECISIONS D13, D29).
  { id: 8, kind: 'words-to-clock', title: 'Zeit in Worten', description: 'Fünf vor halb elf …', minutes: FIVES, review: [], playable: true },
];

/** Richtige Antworten in Folge, die das nächste Level freischalten. */
export const STREAK_TO_UNLOCK = 5;
/** Anteil der Wiederholungsaufgaben aus früheren Leveln. */
export const REVIEW_CHANCE = 0.25;

export function getLevel(id: number): LevelDef {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new RangeError(`Unbekanntes Level ${id}`);
  return level;
}

export function isLevelId(value: number): value is LevelId {
  return LEVELS.some((l) => l.id === value);
}

/** Alle Minuten, die in diesem Level als Antwort plausibel sind. */
export function allowedMinutes(level: LevelDef): ReadonlySet<number> {
  return new Set([...level.minutes, ...level.review]);
}
