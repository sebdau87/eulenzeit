/** Uhrzeit im 24-h-Raum. Die analoge Uhr zeigt davon nur die 12-h-Hälfte. */
export interface ClockTime {
  /** 0–23 */
  readonly hour: number;
  /** 0–59 */
  readonly minute: number;
}

export type DigitalFormat = '12h' | '24h';

const MINUTES_PER_DAY = 24 * 60;

function assertInt(value: number, min: number, max: number, name: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} muss eine ganze Zahl von ${min} bis ${max} sein, war ${value}`);
  }
}

/** Erzeugt eine gültige Zeit; wirft bei Werten außerhalb des Bereichs. */
export function makeTime(hour: number, minute: number): ClockTime {
  assertInt(hour, 0, 23, 'hour');
  assertInt(minute, 0, 59, 'minute');
  return { hour, minute };
}

/** Rechnet beliebige Minuten (auch negativ) in eine Zeit innerhalb eines Tages um. */
export function fromTotalMinutes(total: number): ClockTime {
  const wrapped = ((Math.round(total) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 };
}

export function toTotalMinutes(t: ClockTime): number {
  return t.hour * 60 + t.minute;
}

export function addMinutes(t: ClockTime, delta: number): ClockTime {
  return fromTotalMinutes(toTotalMinutes(t) + delta);
}

/** 0 → 12, 13 → 1, 12 → 12. */
export function to12h(hour: number): number {
  const h = ((hour % 12) + 12) % 12;
  return h === 0 ? 12 : h;
}

/** Gleiche Zeigerstellung auf der analogen Uhr (4:30 = 16:30). */
export function isSameClockFace(a: ClockTime, b: ClockTime): boolean {
  return to12h(a.hour) === to12h(b.hour) && a.minute === b.minute;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Kindgerechte Digitalanzeige ohne führende Null bei der Stunde: „4:30“ bzw. „16:30“. */
export function formatDigital(t: ClockTime, format: DigitalFormat = '12h'): string {
  const hour = format === '12h' ? to12h(t.hour) : t.hour;
  return `${hour}:${pad2(t.minute)}`;
}

/** Maschinenlesbare Form für das datetime-Attribut von <time>. */
export function toIsoTime(t: ClockTime): string {
  return `${pad2(t.hour)}:${pad2(t.minute)}`;
}
