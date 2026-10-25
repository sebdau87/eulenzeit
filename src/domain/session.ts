import { explainFor, levelHint, tipFor } from './hints';
import { getLevel, LEVELS, STREAK_TO_UNLOCK, type LevelId } from './levels';
import { createQuestion, type Question } from './questions';
import type { Rng } from './random';
import { formatDigital, isSameClockFace, type ClockTime } from './time';
import { timeToGermanWords, type WordVariant } from './words';

/**
 * Lernschleife als reine Zustandsübergänge (kein React, kein Speicher).
 *
 *  asking ──falsch──▶ retry ──falsch──▶ explained ──weiter──▶ asking (neue Aufgabe)
 *    │                  │
 *    └──richtig──▶ correct ◀──richtig──┘
 *                    └─weiter─▶ asking | reward (5 in Folge)
 *
 * Nie Strafe: Sterne werden nie abgezogen. Nur nach einer Erklärung
 * (zwei Fehlversuche) beginnt die Serie von vorn (DECISIONS D20).
 */
export type Phase = 'asking' | 'retry' | 'explained' | 'correct' | 'reward';

export interface TackMessage {
  mood: 'tip' | 'praise';
  /** Kurzer erster Satz in Tacks Sprechblase. */
  text: string;
  /** Der eigentliche Tipp, darunter in derselben Blase. */
  detail?: string;
}

export interface Session {
  level: LevelId;
  variant: WordVariant;
  question: Question;
  /** Auswahl bei Aufgaben mit Optionen. */
  selected: number | null;
  /** Falsch gewählte Optionen (bleiben markiert und gesperrt). */
  wrong: number[];
  /** Bei „Zeiger stellen“: aktuelle Zeigerstellung des Kindes. */
  dialed: ClockTime | null;
  /** Fehlversuche bei dieser Aufgabe. */
  attempts: number;
  phase: Phase;
  /** Tack erscheint nur bei Tipp und Lob; null = nicht sichtbar. */
  tack: TackMessage | null;
  explanation: string[] | null;
  hintUsed: boolean;
  /** Fehlerhafte Aufgaben kommen nach `due` weiteren Aufgaben wieder. */
  repeat: { time: ClockTime; due: number }[];
  /** Beim Belohnungs-Screen: das gerade freigeschaltete Level (falls eins dazukam). */
  unlockedLevel: LevelId | null;
}

export interface LevelProgress {
  streak: number;
  stars: number;
  completed: boolean;
}

export interface Progress {
  /** Höchstes freigeschaltetes Level. */
  unlocked: LevelId;
  levels: Partial<Record<LevelId, LevelProgress>>;
}

export const REPEAT_AFTER = 2;

const EMPTY_LEVEL: LevelProgress = { streak: 0, stars: 0, completed: false };

export function initialProgress(): Progress {
  return { unlocked: 1, levels: {} };
}

export function levelProgress(p: Progress, level: LevelId): LevelProgress {
  return p.levels[level] ?? EMPTY_LEVEL;
}

export function totalStars(p: Progress): number {
  return Object.values(p.levels).reduce((sum, l) => sum + (l?.stars ?? 0), 0);
}

export function isUnlocked(p: Progress, level: LevelId): boolean {
  return level <= p.unlocked && getLevel(level).playable;
}

function updateLevel(p: Progress, level: LevelId, patch: Partial<LevelProgress>): Progress {
  return { ...p, levels: { ...p.levels, [level]: { ...levelProgress(p, level), ...patch } } };
}

function freshQuestion(level: LevelId, variant: WordVariant, q: Question, repeat: Session['repeat']): Session {
  return {
    level,
    variant,
    question: q,
    selected: null,
    wrong: [],
    dialed: q.start ?? null,
    attempts: 0,
    phase: 'asking',
    tack: null,
    explanation: null,
    hintUsed: false,
    repeat,
    unlockedLevel: null,
  };
}

export function startSession(level: LevelId, rng: Rng, variant: WordVariant = 'standard'): Session {
  return freshQuestion(level, variant, createQuestion(level, rng), []);
}

const canAnswer = (s: Session) => s.phase === 'asking' || s.phase === 'retry';
const isDial = (s: Session) => s.question.kind === 'digital-to-clock';

export function selectOption(s: Session, index: number): Session {
  if (!canAnswer(s) || isDial(s) || s.wrong.includes(index) || index < 0 || index >= s.question.options.length) {
    return s;
  }
  return { ...s, selected: index };
}

/** Zeiger stellen: neue Stellung übernehmen. */
export function dial(s: Session, time: ClockTime): Session {
  if (!canAnswer(s) || !isDial(s)) return s;
  return { ...s, dialed: time };
}

/** Tipp-Knopf: Tack (gelb) gibt einen allgemeinen Hinweis, ohne dass es als Versuch zählt. */
export function showHint(s: Session): Session {
  if (s.phase !== 'asking' || s.hintUsed) return s;
  return { ...s, hintUsed: true, tack: { mood: 'tip', text: 'Ein Tipp für dich:', detail: levelHint(s.level) } };
}

const PRAISE = ['Genau, es ist {t}!', 'Super, {t} stimmt!', 'Richtig! Das ist {t}.'];

/** Wie die Zeit im Lob genannt wird: digital in Level 6/7, sonst in Worten. */
function spoken(s: Session): string {
  const { kind, time } = s.question;
  return kind === 'clock-to-digital' || kind === 'digital-to-clock'
    ? formatDigital(time)
    : timeToGermanWords(time, { variant: s.variant });
}

export function checkAnswer(s: Session, p: Progress): { session: Session; progress: Progress } {
  if (!canAnswer(s)) return { session: s, progress: p };
  const { question } = s;
  const chosen = isDial(s) ? s.dialed : s.selected === null ? null : (question.options[s.selected] ?? null);
  if (!chosen) return { session: s, progress: p };
  const lp = levelProgress(p, s.level);

  if (isSameClockFace(chosen, question.time)) {
    const praise = (PRAISE[lp.stars % PRAISE.length] as string).replace('{t}', spoken(s));
    return {
      session: { ...s, phase: 'correct', tack: { mood: 'praise', text: praise } },
      progress: updateLevel(p, s.level, { stars: lp.stars + 1, streak: lp.streak + 1 }),
    };
  }

  const attempts = s.attempts + 1;
  const wrong = s.selected === null ? s.wrong : [...s.wrong, s.selected];
  const repeat = s.repeat.some((r) => isSameClockFace(r.time, question.time))
    ? s.repeat
    : [...s.repeat, { time: question.time, due: REPEAT_AFTER }];

  if (attempts >= 2) {
    return {
      session: {
        ...s,
        attempts,
        wrong,
        repeat,
        selected: null,
        // Beim Zeiger-Stellen zeigt die Uhr jetzt die Lösung.
        dialed: isDial(s) ? question.time : s.dialed,
        phase: 'explained',
        tack: { mood: 'tip', text: 'Ich zeig dir, wie es geht.' },
        explanation: explainFor(question.kind, question.time, s.variant),
      },
      progress: updateLevel(p, s.level, { streak: 0 }),
    };
  }

  return {
    session: {
      ...s,
      attempts,
      wrong,
      repeat,
      selected: null,
      phase: 'retry',
      tack: { mood: 'tip', text: 'Fast! Schau mal:', detail: tipFor(question.time, chosen, s.level) },
    },
    progress: p,
  };
}

/** „Weiter“: Belohnung nach 5 in Folge, sonst nächste Aufgabe (fällige Wiederholungen zuerst). */
export function nextStep(s: Session, p: Progress, rng: Rng): { session: Session; progress: Progress } {
  if (canAnswer(s)) return { session: s, progress: p };
  const lp = levelProgress(p, s.level);

  if (s.phase === 'correct' && lp.streak >= STREAK_TO_UNLOCK) {
    const nextLevel = LEVELS.find((l) => l.id === s.level + 1);
    const unlocks = nextLevel !== undefined && nextLevel.id > p.unlocked;
    const progress: Progress = {
      ...updateLevel(p, s.level, { streak: 0, completed: true }),
      unlocked: unlocks ? nextLevel.id : p.unlocked,
    };
    return {
      session: { ...s, phase: 'reward', tack: null, unlockedLevel: unlocks ? nextLevel.id : null },
      progress,
    };
  }

  const aged = s.repeat.map((r) => ({ ...r, due: r.due - 1 }));
  const dueIndex = aged.findIndex((r) => r.due <= 0);
  const fixed = dueIndex >= 0 ? aged[dueIndex]?.time : undefined;
  const repeat = dueIndex >= 0 ? aged.filter((_, i) => i !== dueIndex) : aged;
  const question = createQuestion(s.level, rng, s.question.time, fixed);
  return { session: freshQuestion(s.level, s.variant, question, repeat), progress: p };
}
