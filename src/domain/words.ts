import { to12h, type ClockTime } from './time';

/**
 * Regionale Varianten der Zeitansage.
 * - standard: „Viertel nach zehn“, „Viertel vor elf“
 * - ost:      „viertel elf“, „dreiviertel elf“ (Ost- und Süddeutschland, Österreich)
 * Neue Variante = neuer Eintrag in VARIANT_OVERRIDES (nur abweichende Minuten).
 */
export type WordVariant = 'standard' | 'ost';

export const WORD_VARIANTS: readonly WordVariant[] = ['standard', 'ost'];

export interface WordOptions {
  variant?: WordVariant;
}

interface HourContext {
  /** aktuelle Stunde, z. B. „zehn“ (1 → „eins“) */
  current: string;
  /** folgende Stunde, z. B. „elf“ */
  next: string;
}

type Phrase = (h: HourContext) => string;

const VARIANT_OVERRIDES: Record<WordVariant, Partial<Record<number, Phrase>>> = {
  standard: {},
  ost: {
    15: ({ next }) => `viertel ${next}`,
    45: ({ next }) => `dreiviertel ${next}`,
  },
};

const UNITS = [
  '', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn',
] as const;

const TENS: Record<number, string> = { 2: 'zwanzig', 3: 'dreißig', 4: 'vierzig', 5: 'fünfzig' };

/** Zahlwort 1–59: „eins“, „siebzehn“, „einundzwanzig“, „dreiundvierzig“. */
export function numberWord(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 59) throw new RangeError(`Kein Zahlwort für ${n}`);
  if (n < 20) return UNITS[n] as string;
  const tens = TENS[Math.floor(n / 10)] as string;
  const unit = n % 10;
  if (unit === 0) return tens;
  return `${unit === 1 ? 'ein' : UNITS[unit]}und${tens}`;
}

/** Stundenwort auf dem Zifferblatt: 0 und 12 → „zwölf“, 13 → „eins“. */
export function hourWord(hour: number): string {
  return numberWord(to12h(hour));
}

function standardPhrase(minute: number, h: HourContext): string {
  const uhr = `${h.current === 'eins' ? 'ein' : h.current} Uhr`;
  if (minute === 0) return uhr;
  // Krumme Minuten wie auf der Digitaluhr gesprochen: „vier Uhr siebzehn“ (DECISIONS D13).
  if (minute % 5 !== 0) return `${uhr} ${numberWord(minute)}`;
  if (minute === 15) return `Viertel nach ${h.current}`;
  if (minute <= 20) return `${numberWord(minute)} nach ${h.current}`;
  if (minute < 30) return `${numberWord(30 - minute)} vor halb ${h.next}`;
  if (minute === 30) return `halb ${h.next}`;
  if (minute < 40) return `${numberWord(minute - 30)} nach halb ${h.next}`;
  if (minute === 45) return `Viertel vor ${h.next}`;
  return `${numberWord(60 - minute)} vor ${h.next}`;
}

/**
 * Uhrzeit als gesprochene deutsche Zeitangabe im 12-Stunden-Sinn.
 * 10:25 → „fünf vor halb elf“, 10:35 → „fünf nach halb elf“, 10:45 → „Viertel vor elf“,
 * 10:17 → „zehn Uhr siebzehn“.
 * Reine Funktion; wirft RangeError bei ungültiger Zeit.
 */
export function timeToGermanWords(time: ClockTime, options: WordOptions = {}): string {
  const { hour, minute } = time;
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new RangeError(`Ungültige Stunde ${hour}`);
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new RangeError(`Ungültige Minute ${minute}`);

  const h: HourContext = { current: hourWord(hour), next: hourWord(hour + 1) };
  const override = VARIANT_OVERRIDES[options.variant ?? 'standard'][minute];
  return override ? override(h) : standardPhrase(minute, h);
}

/**
 * Beschreibt die Zeigerstellung, ohne die Uhrzeit zu verraten – textliche Entsprechung
 * der Uhr für Screenreader in Aufgaben, bei denen die Zeit erst gefunden werden soll.
 */
export function describeClockHands(time: ClockTime): string {
  const h = to12h(time.hour);
  const nextH = (h % 12) + 1;
  const { minute } = time;

  const hourPart =
    minute === 0
      ? `Der kurze Stundenzeiger zeigt auf die ${h}`
      : `Der kurze Stundenzeiger steht zwischen der ${h} und der ${nextH}`;

  const mark = Math.floor(minute / 5);
  const minutePart =
    minute % 5 === 0
      ? `der lange Minutenzeiger zeigt auf die ${mark === 0 ? 12 : mark}`
      : `der lange Minutenzeiger steht zwischen der ${mark === 0 ? 12 : mark} und der ${mark + 1}`;

  return `${hourPart}, ${minutePart}.`;
}
