import { getLevel, type LevelId, type QuestionKind } from './levels';
import { face } from './questions';
import { formatDigital, isSameClockFace, to12h, type ClockTime } from './time';
import { timeToGermanWords, type WordVariant } from './words';

export type Mistake = 'swapped' | 'hour' | 'vorNach' | 'markAsMinute' | 'other';

/** Welche typische Verwechslung steckt hinter der gewählten (oder gestellten) Zeit? */
export function classifyMistake(correct: ClockTime, chosen: ClockTime): Mistake {
  const { hour, minute } = correct;
  const mark = minute % 5 === 0 ? (minute === 0 ? 12 : minute / 5) : null;
  const same = (h: number, m: number) => isSameClockFace(chosen, face(h, m));

  if (same(hour + 1, minute) || same(hour - 1, minute)) return 'hour';
  if (mark !== null && (same(mark, (hour % 12) * 5) || same(mark, 0))) return 'swapped';
  if (minute !== 0 && (same(hour, 60 - minute) || same(hour - 1, 60 - minute) || same(hour + 1, 60 - minute))) {
    return 'vorNach';
  }
  if (mark !== null && same(hour, mark)) return 'markAsMinute';
  return 'other';
}

const LEVEL_HINTS: Record<LevelId, string> = {
  1: 'Bei vollen Stunden zeigt der lange Zeiger genau nach oben auf die 12.',
  2: 'Zeigt der lange Zeiger nach unten auf die 6, ist es „halb“.',
  3: 'Langer Zeiger auf der 3: Viertel nach. Auf der 9: Viertel vor.',
  4: 'Zähle den langen Zeiger in Fünferschritten: 5, 10, 15 …',
  5: 'Zähle bis zur Zahl in Fünferschritten, dann die kleinen Punkte dazu.',
  6: 'Vor dem Doppelpunkt steht die Stunde, dahinter die Minuten.',
  7: 'Stell zuerst den langen Zeiger, dann den kurzen.',
  8: 'Liegt der lange Zeiger rechts, sagt man „nach“, links „vor“.',
};

/** Allgemeiner Tipp für das Level (Tipp-Knopf vor der ersten Antwort). */
export function levelHint(level: LevelId): string {
  return LEVEL_HINTS[getLevel(level).id];
}

const between = (h: number) => `zwischen der ${h} und der ${(h % 12) + 1}`;

/**
 * Kurzer, gezielter Tipp nach einer falschen Antwort.
 * Der Wortlaut hängt davon ab, ob die Antwort in Worten oder digital gegeben wird.
 */
export function tipFor(correct: ClockTime, chosen: ClockTime, level: LevelId): string {
  const kind = getLevel(level).kind;
  const digital = kind === 'clock-to-digital' || kind === 'digital-to-clock';
  const h = to12h(correct.hour);
  const { minute } = correct;

  switch (classifyMistake(correct, chosen)) {
    case 'swapped':
      return 'Der kurze Zeiger zeigt die Stunde, der lange die Minuten.';
    case 'hour':
      if (minute === 0) return `Der kurze Zeiger zeigt genau auf die ${h}.`;
      if (digital) return `Der kurze Zeiger steht ${between(h)}. Digital zählt die ${h}.`;
      if ([25, 30, 35].includes(minute)) return 'Bei „halb“ sagt man schon die nächste Stunde.';
      if (minute >= 40 && minute % 5 === 0) return 'Bei „vor“ sagt man schon die nächste Stunde.';
      return `Der kurze Zeiger steht ${between(h)}.`;
    case 'vorNach':
      return digital
        ? 'Zähle die Minuten ab der 12 im Uhrzeigersinn: 5, 10, 15 …'
        : 'Langer Zeiger rechts: „nach“. Langer Zeiger links: „vor“.';
    case 'markAsMinute':
      return 'Jede Zahl am langen Zeiger zählt fünf Minuten.';
    case 'other':
      return levelHint(level);
  }
}

function hourStep(t: ClockTime): string {
  const h = to12h(t.hour);
  return t.minute === 0 ? `Der kurze Zeiger zeigt genau auf die ${h}.` : `Der kurze Zeiger steht ${between(h)}.`;
}

function minuteStep(t: ClockTime): string {
  const { minute } = t;
  if (minute === 0) return 'Der lange Zeiger zeigt auf die 12. Das ist eine volle Stunde.';
  if (minute % 5 === 0) return `Der lange Zeiger zeigt auf die ${minute / 5}. Das sind ${minute} Minuten.`;
  const mark = Math.floor(minute / 5);
  const extra = minute % 5;
  const dots = `${extra} ${extra === 1 ? 'Punkt' : 'Punkte'}`;
  if (mark === 0) {
    return `Der lange Zeiger steht ${dots} nach der 12. ${minute === 1 ? 'Das ist 1 Minute' : `Das sind ${minute} Minuten`}.`;
  }
  return `Der lange Zeiger steht ${dots} nach der ${mark}. Das sind ${mark * 5} + ${extra} = ${minute} Minuten.`;
}

/** Erklärung in kleinen Schritten, nachdem zwei Versuche nicht geklappt haben (Uhr lesen, in Worten). */
export function explain(correct: ClockTime, variant: WordVariant = 'standard'): string[] {
  return [hourStep(correct), minuteStep(correct), `Also ist es ${timeToGermanWords(correct, { variant })}.`];
}

/** Erklärung passend zur Aufgabenart. */
export function explainFor(kind: QuestionKind, correct: ClockTime, variant: WordVariant = 'standard'): string[] {
  const digital = formatDigital(correct);
  switch (kind) {
    case 'clock-to-words':
      return explain(correct, variant);
    case 'clock-to-digital':
      return [hourStep(correct), minuteStep(correct), `Digital schreibt man ${digital}.`];
    case 'digital-to-clock': {
      const [h, m] = digital.split(':');
      const minuteTarget =
        correct.minute === 0
          ? 'Der lange Zeiger muss auf die 12.'
          : correct.minute % 5 === 0
            ? `Für ${Number(m)} Minuten muss der lange Zeiger auf die ${correct.minute / 5}.`
            : minuteStep(correct);
      return [`${digital} heißt: ${h} Uhr und ${Number(m)} Minuten.`, minuteTarget, hourStep(correct)];
    }
    case 'words-to-clock':
      return [`„${timeToGermanWords(correct, { variant })}“ ist ${digital}.`, hourStep(correct), minuteStep(correct)];
  }
}
