import { describe, expect, it } from 'vitest';
import { STREAK_TO_UNLOCK } from './levels';
import { createRng } from './random';
import {
  checkAnswer,
  dial,
  initialProgress,
  isUnlocked,
  levelProgress,
  nextStep,
  REPEAT_AFTER,
  selectOption,
  showHint,
  startSession,
  totalStars,
  type Progress,
  type Session,
} from './session';
import { isSameClockFace } from './time';

const wrongIndex = (s: Session, skip: number[] = []) =>
  s.question.options.findIndex((_, i) => i !== s.question.correctIndex && !skip.includes(i));

function answer(s: Session, p: Progress, index: number) {
  return checkAnswer(selectOption(s, index), p);
}

describe('Fortschritt', () => {
  it('startet mit Level 1 frei, ohne Sterne', () => {
    const p = initialProgress();
    expect(isUnlocked(p, 1)).toBe(true);
    expect(isUnlocked(p, 2)).toBe(false);
    expect(totalStars(p)).toBe(0);
    expect(levelProgress(p, 1)).toEqual({ streak: 0, stars: 0, completed: false });
  });
});

describe('Lernsitzung', () => {
  const rng = createRng(1234);

  it('beginnt im Zustand „asking“ ohne Tack', () => {
    const s = startSession(1, rng);
    expect(s.phase).toBe('asking');
    expect(s.tack).toBeNull();
    expect(s.question.options).toHaveLength(4);
  });

  it('prüft nichts ohne Auswahl', () => {
    const s = startSession(1, rng);
    const p = initialProgress();
    expect(checkAnswer(s, p)).toEqual({ session: s, progress: p });
  });

  it('richtige Antwort: Lob, Stern, Serie +1', () => {
    const s = startSession(2, rng);
    const { session, progress } = answer(s, initialProgress(), s.question.correctIndex);
    expect(session.phase).toBe('correct');
    expect(session.tack?.mood).toBe('praise');
    expect(levelProgress(progress, 2)).toMatchObject({ stars: 1, streak: 1 });
  });

  it('erste falsche Antwort: Tipp, nochmal, kein Abzug', () => {
    const s = startSession(2, rng);
    const p0 = { ...initialProgress(), levels: { 2: { streak: 3, stars: 7, completed: false } } };
    const w = wrongIndex(s);
    const { session, progress } = answer(s, p0, w);
    expect(session.phase).toBe('retry');
    expect(session.tack?.mood).toBe('tip');
    expect(session.wrong).toEqual([w]);
    expect(session.selected).toBeNull();
    expect(progress).toBe(p0);
  });

  it('falsche Option ist danach nicht mehr wählbar', () => {
    const s = startSession(3, rng);
    const w = wrongIndex(s);
    const { session } = answer(s, initialProgress(), w);
    expect(selectOption(session, w).selected).toBeNull();
  });

  it('zweiter Versuch richtig zählt als richtig', () => {
    const s = startSession(2, rng);
    const first = answer(s, initialProgress(), wrongIndex(s));
    const second = answer(first.session, first.progress, s.question.correctIndex);
    expect(second.session.phase).toBe('correct');
    expect(levelProgress(second.progress, 2)).toMatchObject({ stars: 1, streak: 1 });
  });

  it('nach zwei Fehlern wird erklärt, Sterne bleiben, Serie beginnt neu', () => {
    const s = startSession(2, rng);
    const p0 = { ...initialProgress(), levels: { 2: { streak: 4, stars: 9, completed: false } } };
    const w1 = wrongIndex(s);
    const first = answer(s, p0, w1);
    const second = answer(first.session, first.progress, wrongIndex(s, [w1]));
    expect(second.session.phase).toBe('explained');
    expect(second.session.explanation).toHaveLength(3);
    expect(levelProgress(second.progress, 2)).toMatchObject({ stars: 9, streak: 0 });
  });

  it('wiederholt eine falsch beantwortete Aufgabe nach zwei weiteren', () => {
    let s = startSession(4, createRng(99));
    const missed = s.question.time;
    let p = initialProgress();
    ({ session: s, progress: p } = answer(s, p, wrongIndex(s)));
    ({ session: s, progress: p } = answer(s, p, s.question.correctIndex));
    const seen = [];
    for (let i = 0; i < REPEAT_AFTER; i++) {
      ({ session: s, progress: p } = nextStep(s, p, createRng(i)));
      seen.push(s.question.time);
      ({ session: s, progress: p } = answer(s, p, s.question.correctIndex));
    }
    expect(isSameClockFace(seen[REPEAT_AFTER - 1]!, missed)).toBe(true);
    expect(s.repeat).toHaveLength(0);
  });

  it('Tipp-Knopf zeigt Tack einmal, ohne Versuch', () => {
    const s = startSession(1, rng);
    const hinted = showHint(s);
    expect(hinted.tack?.mood).toBe('tip');
    expect(hinted.wrong).toEqual([]);
    expect(showHint(hinted)).toBe(hinted);
  });

  it('nach 5 richtigen in Folge: Belohnung und nächstes Level frei', () => {
    let s = startSession(1, createRng(5));
    let p = initialProgress();
    for (let i = 0; i < STREAK_TO_UNLOCK; i++) {
      ({ session: s, progress: p } = answer(s, p, s.question.correctIndex));
      ({ session: s, progress: p } = nextStep(s, p, createRng(i)));
    }
    expect(s.phase).toBe('reward');
    expect(s.unlockedLevel).toBe(2);
    expect(isUnlocked(p, 2)).toBe(true);
    expect(levelProgress(p, 1)).toMatchObject({ completed: true, streak: 0, stars: 5 });

    ({ session: s, progress: p } = nextStep(s, p, createRng(9)));
    expect(s.phase).toBe('asking');
  });

  it('erneute Belohnung schaltet nichts doppelt frei', () => {
    let s = startSession(1, createRng(6));
    let p: Progress = { unlocked: 3, levels: { 1: { streak: 4, stars: 20, completed: true } } };
    ({ session: s, progress: p } = answer(s, p, s.question.correctIndex));
    ({ session: s, progress: p } = nextStep(s, p, createRng(1)));
    expect(s.phase).toBe('reward');
    expect(s.unlockedLevel).toBeNull();
    expect(p.unlocked).toBe(3);
  });

  it('ignoriert „weiter“ während eine Antwort offen ist', () => {
    const s = startSession(1, rng);
    const p = initialProgress();
    expect(nextStep(s, p, rng).session).toBe(s);
  });
});

describe('Zeiger stellen (Level 7)', () => {
  it('startet mit der Startstellung, Auswahl von Optionen ist wirkungslos', () => {
    const s = startSession(7, createRng(1));
    expect(s.dialed).toEqual(s.question.start);
    expect(selectOption(s, 0)).toBe(s);
  });

  it('richtig gestellt → Lob mit Digitalzeit', () => {
    const s = dial(startSession(7, createRng(2)), { hour: 0, minute: 0 });
    const target = s.question.time;
    const { session, progress } = checkAnswer(dial(s, target), initialProgress());
    expect(session.phase).toBe('correct');
    expect(session.tack?.text).toContain(':');
    expect(levelProgress(progress, 7).stars).toBe(1);
  });

  it('auch 16:30 statt 4:30 ist richtig (gleiche Zeigerstellung)', () => {
    const s = startSession(7, createRng(3));
    const t = s.question.time;
    const { session } = checkAnswer(dial(s, { hour: (t.hour % 12) + 12, minute: t.minute }), initialProgress());
    expect(session.phase).toBe('correct');
  });

  it('zwei Fehlversuche → Erklärung, Uhr zeigt die Lösung', () => {
    let s = startSession(7, createRng(4));
    const t = s.question.time;
    const off = { hour: (t.hour % 12) + 1, minute: t.minute };
    let p = initialProgress();
    ({ session: s, progress: p } = checkAnswer(dial(s, off), p));
    expect(s.phase).toBe('retry');
    expect(s.tack?.detail).toBeTruthy();
    ({ session: s, progress: p } = checkAnswer(s, p));
    expect(s.phase).toBe('explained');
    expect(s.dialed).toEqual(t);
    expect(dial(s, off)).toBe(s);
  });
});

describe('Varianten', () => {
  it('Lob und Erklärung nutzen die eingestellte Wortvariante', () => {
    let s = startSession(3, createRng(12), 'ost');
    for (let i = 0; i < 50 && ![15, 45].includes(s.question.time.minute); i++) s = startSession(3, createRng(100 + i), 'ost');
    const { session } = answer(s, initialProgress(), s.question.correctIndex);
    expect(session.tack?.text).toMatch(/viertel|dreiviertel/);
  });
});
