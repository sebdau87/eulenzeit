import { allowedMinutes, getLevel, REVIEW_CHANCE, type LevelId, type QuestionKind } from './levels';
import { pick, randomInt, shuffle, type Rng } from './random';
import { isSameClockFace, to12h, type ClockTime } from './time';

export interface Question {
  kind: QuestionKind;
  time: ClockTime;
  /** Vier Optionen, eine davon richtig. Leer bei „Zeiger stellen“. */
  options: ClockTime[];
  /** -1 bei „Zeiger stellen“. */
  correctIndex: number;
  /** Nur bei „Zeiger stellen“: Startstellung der Zeiger (nie schon die Lösung). */
  start?: ClockTime;
}

export const OPTION_COUNT = 4;

/** Normalisiert auf das Zifferblatt: Stunde 1–12. */
export function face(hour: number, minute: number): ClockTime {
  return { hour: to12h(hour), minute };
}

/** Zufällige Zeit für ein Level; avoid verhindert dieselbe Aufgabe zweimal hintereinander. */
export function randomTime(level: LevelId, rng: Rng, avoid?: ClockTime): ClockTime {
  const def = getLevel(level);
  for (let attempt = 0; attempt < 20; attempt++) {
    const useReview = def.review.length > 0 && rng() < REVIEW_CHANCE;
    const minute = pick(rng, useReview ? def.review : def.minutes);
    const t = face(randomInt(rng, 1, 12), minute);
    if (!avoid || !isSameClockFace(t, avoid)) return t;
  }
  return face(avoid ? avoid.hour + 1 : 1, def.minutes[0] ?? 0);
}

/** Zahl auf dem Zifferblatt, auf die der Minutenzeiger zeigt (0 → 12), oder null zwischen zwei Zahlen. */
function minuteMark(minute: number): number | null {
  if (minute % 5 !== 0) return null;
  return minute === 0 ? 12 : minute / 5;
}

/**
 * Typische Verwechslungen, nach Wichtigkeit sortiert:
 * Zeiger vertauscht (10:25 → 5:50), Stunde daneben (halb fünf ↔ halb vier),
 * vor/nach verwechselt (4:25 ↔ 4:35, Viertel nach vier ↔ Viertel vor vier),
 * Minutenzeiger als Stunde gelesen (4:00 → 12:00), Zahl als Minute gelesen (4:25 → 4:05).
 */
export function confusionsFor(t: ClockTime): { swapped: ClockTime | null; others: ClockTime[] } {
  const { hour, minute } = t;
  const mark = minuteMark(minute);
  const swapped = mark !== null ? face(mark, (hour % 12) * 5) : null;
  const others: ClockTime[] = [
    face(hour + 1, minute),
    face(hour - 1, minute),
  ];
  if (minute !== 0 && minute !== 30) {
    others.push(face(hour, 60 - minute));
    others.push(face(minute < 30 ? hour - 1 : hour + 1, 60 - minute));
  }
  if (mark !== null) others.push(face(mark, 0));
  if (mark !== null && minute > 0 && mark !== minute) others.push(face(hour, mark));
  return { swapped, others };
}

/** Vier verschiedene Optionen: richtige Zeit + bis zu drei typische Verwechslungen, aufgefüllt mit Zufallszeiten. */
export function generateOptions(correct: ClockTime, level: LevelId, rng: Rng): Question {
  const allowed = allowedMinutes(getLevel(level));
  const chosen: ClockTime[] = [correct];
  const add = (t: ClockTime | null) => {
    if (!t || chosen.length >= OPTION_COUNT) return;
    if (!allowed.has(t.minute)) return;
    if (chosen.some((c) => isSameClockFace(c, t))) return;
    chosen.push(t);
  };

  const { swapped, others } = confusionsFor(correct);
  add(swapped);
  for (const t of shuffle(rng, others)) add(t);
  for (let guard = 0; chosen.length < OPTION_COUNT && guard < 200; guard++) {
    add(randomTime(level, rng));
  }

  const options = shuffle(rng, chosen);
  return {
    kind: getLevel(level).kind,
    time: correct,
    options,
    correctIndex: options.findIndex((o) => isSameClockFace(o, correct)),
  };
}

/** Startstellung beim Zeiger-Stellen: 12 Uhr, außer die Lösung ist 12 Uhr – dann 6 Uhr. */
export function dialStart(target: ClockTime): ClockTime {
  return isSameClockFace(target, face(12, 0)) ? face(6, 0) : face(12, 0);
}

export function createQuestion(level: LevelId, rng: Rng, avoid?: ClockTime, fixedTime?: ClockTime): Question {
  const time = fixedTime ?? randomTime(level, rng, avoid);
  if (getLevel(level).kind === 'digital-to-clock') {
    return { kind: 'digital-to-clock', time, options: [], correctIndex: -1, start: dialStart(time) };
  }
  return generateOptions(time, level, rng);
}
