import { addMinutes, fromTotalMinutes, type ClockTime } from './time';

/** Geometrie der Uhr im SVG-Koordinatensystem (viewBox 0 0 252 252). */
export const CLOCK = {
  size: 252,
  center: 126,
  ringRadius: 98,
  ringWidth: 8,
  tickOuter: 90,
  tickInner: 82,
  tickInnerMajor: 78,
  dotRadius: 87,
  numberRadius: 68,
  /** 12, 3, 6 und 9 (größer) sitzen weiter innen, mit Abstand zu den Strichen (DECISIONS D39). */
  majorNumberRadius: 62,
  minuteNumberRadius: 115,
  hourHandLength: 46,
  minuteHandLength: 82,
  handTail: 10,
} as const;

export type Hand = 'hour' | 'minute';

/** Grad im Uhrzeigersinn ab 12 Uhr. Stundenzeiger rückt mit den Minuten weiter. */
export function hourHandAngle(hour: number, minute: number): number {
  return (hour % 12) * 30 + minute * 0.5;
}

export function minuteHandAngle(minute: number): number {
  return minute * 6;
}

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/** Kürzester Winkelabstand (0–180). */
export function angularDistance(a: number, b: number): number {
  const d = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return d > 180 ? 360 - d : d;
}

/** Punkt auf dem Kreis: 0° = oben, im Uhrzeigersinn. */
export function polarToCartesian(angle: number, radius: number, center: number = CLOCK.center) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
}

/** Winkel und Abstand eines Punktes relativ zur Uhrmitte (umgekehrt zu polarToCartesian). */
export function pointToPolar(x: number, y: number, center: number = CLOCK.center) {
  const dx = x - center;
  const dy = y - center;
  const angle = normalizeAngle((Math.atan2(dy, dx) * 180) / Math.PI + 90);
  return { angle, distance: Math.hypot(dx, dy) };
}

/** Winkel → Minute, eingerastet auf step (1, 5, 15 …). 360° ergibt 0. */
export function angleToMinute(angle: number, step = 1): number {
  const raw = normalizeAngle(angle) / 6;
  const snapped = Math.round(raw / step) * step;
  return snapped % 60;
}

/** Winkel des Stundenzeigers → Stunde 1–12, unter Berücksichtigung der aktuellen Minute. */
export function angleToHour12(angle: number, minute: number): number {
  const h = Math.round(normalizeAngle(angle - minute * 0.5) / 30) % 12;
  return h === 0 ? 12 : h;
}

/** Stunde (1–12) setzen und dabei Vor-/Nachmittag behalten. */
export function setHour12(t: ClockTime, hour12: number): ClockTime {
  const h = ((Math.round(hour12) % 12) + 12) % 12;
  return { hour: (t.hour >= 12 ? 12 : 0) + h, minute: t.minute };
}

/**
 * Minute setzen wie beim Drehen am echten Zeiger: Wer über die 12 dreht,
 * verschiebt auch die Stunde (4:55 → 5:00, 5:05 → 4:55).
 */
export function setMinuteWithWrap(t: ClockTime, minute: number): ClockTime {
  const delta = minute - t.minute;
  const hourShift = delta < -30 ? 1 : delta > 30 ? -1 : 0;
  return fromTotalMinutes((t.hour + hourShift) * 60 + minute);
}

/** Einen Tastaturschritt weiter; nicht eingerastete Minuten springen zur nächsten Rasterstelle. */
export function stepMinute(t: ClockTime, direction: 1 | -1, step: number): ClockTime {
  const rest = t.minute % step;
  if (rest === 0) return addMinutes(t, direction * step);
  return addMinutes(t, direction > 0 ? step - rest : -rest);
}

/** Welcher Zeiger wird gegriffen? Außerhalb der Reichweite des Stundenzeigers immer der Minutenzeiger. */
export function pickHand(pointerAngle: number, distance: number, t: ClockTime): Hand {
  if (distance > CLOCK.hourHandLength + 14) return 'minute';
  const hourDiff = angularDistance(pointerAngle, hourHandAngle(t.hour, t.minute));
  const minuteDiff = angularDistance(pointerAngle, minuteHandAngle(t.minute));
  return hourDiff <= minuteDiff ? 'hour' : 'minute';
}
