import { describe, expect, it } from 'vitest';
import { classifyMistake, explain, explainFor, levelHint, tipFor } from './hints';
import { LEVELS } from './levels';
import { face } from './questions';

describe('classifyMistake', () => {
  it.each([
    [face(10, 25), face(5, 50), 'swapped'],
    [face(4, 0), face(12, 0), 'swapped'],
    [face(4, 30), face(3, 30), 'hour'],
    [face(4, 30), face(5, 30), 'hour'],
    [face(11, 0), face(12, 0), 'hour'],
    [face(4, 25), face(4, 35), 'vorNach'],
    [face(4, 15), face(3, 45), 'vorNach'],
    [face(4, 25), face(4, 5), 'markAsMinute'],
    [face(4, 25), face(9, 10), 'other'],
  ] as const)('%o statt %o → %s', (correct, chosen, kind) => {
    expect(classifyMistake(correct, chosen)).toBe(kind);
  });
});

describe('tipFor', () => {
  it('erklärt bei „halb“ die nächste Stunde', () => {
    expect(tipFor(face(4, 30), face(3, 30), 2)).toMatch(/halb/);
  });

  it('erklärt bei „vor“ die nächste Stunde', () => {
    expect(tipFor(face(4, 45), face(3, 45), 3)).toMatch(/„vor“/);
  });

  it('nennt bei voller Stunde die Zahl', () => {
    expect(tipFor(face(7, 0), face(8, 0), 1)).toContain('7');
  });

  it('erklärt bei vertauschten Zeigern kurz und lang', () => {
    expect(tipFor(face(10, 25), face(5, 50), 4)).toMatch(/kurze.*Stunde.*lange.*Minuten/);
  });

  it('fällt auf den Level-Tipp zurück', () => {
    expect(tipFor(face(4, 25), face(9, 10), 4)).toBe(levelHint(4));
  });

  it('bleibt kurz genug für die Sprechblase', () => {
    for (const l of LEVELS) expect(levelHint(l.id).length).toBeLessThanOrEqual(80);
  });
});

describe('explain', () => {
  it('erklärt halb fünf in drei Schritten', () => {
    expect(explain(face(4, 30))).toEqual([
      'Der kurze Zeiger steht zwischen der 4 und der 5.',
      'Der lange Zeiger zeigt auf die 6. Das sind 30 Minuten.',
      'Also ist es halb fünf.',
    ]);
  });

  it('erklärt volle Stunden und 12 Uhr', () => {
    expect(explain(face(12, 0))).toEqual([
      'Der kurze Zeiger zeigt genau auf die 12.',
      'Der lange Zeiger zeigt auf die 12. Das ist eine volle Stunde.',
      'Also ist es zwölf Uhr.',
    ]);
  });

  it('zählt bei krummen Minuten die Punkte', () => {
    expect(explain(face(4, 17))[1]).toBe('Der lange Zeiger steht 2 Punkte nach der 3. Das sind 15 + 2 = 17 Minuten.');
    expect(explain(face(4, 1))[1]).toBe('Der lange Zeiger steht 1 Punkt nach der 12. Das ist 1 Minute.');
    expect(explain(face(4, 3))[1]).toBe('Der lange Zeiger steht 3 Punkte nach der 12. Das sind 3 Minuten.');
  });

  it('erklärt 11:59 mit der nächsten Stunde 12', () => {
    expect(explain(face(11, 59))[0]).toBe('Der kurze Zeiger steht zwischen der 11 und der 12.');
    expect(explain(face(11, 59))[2]).toBe('Also ist es elf Uhr neunundfünfzig.');
  });
});

describe('tipFor – digital', () => {
  it('spricht bei Stunde daneben von der Digitalstunde statt von „halb“', () => {
    expect(tipFor(face(4, 30), face(5, 30), 6)).toBe('Der kurze Zeiger steht zwischen der 4 und der 5. Digital zählt die 4.');
  });

  it('erklärt vor/nach digital über das Zählen ab der 12', () => {
    expect(tipFor(face(4, 25), face(4, 35), 6)).toMatch(/ab der 12/);
  });

  it('beim Zeiger stellen: vertauschte Zeiger', () => {
    expect(tipFor(face(10, 25), face(5, 50), 7)).toMatch(/kurze.*Stunde/);
  });
});

describe('explainFor', () => {
  it('Uhr → digital', () => {
    expect(explainFor('clock-to-digital', face(4, 30))).toEqual([
      'Der kurze Zeiger steht zwischen der 4 und der 5.',
      'Der lange Zeiger zeigt auf die 6. Das sind 30 Minuten.',
      'Digital schreibt man 4:30.',
    ]);
  });

  it('Zeiger stellen', () => {
    expect(explainFor('digital-to-clock', face(4, 30))).toEqual([
      '4:30 heißt: 4 Uhr und 30 Minuten.',
      'Für 30 Minuten muss der lange Zeiger auf die 6.',
      'Der kurze Zeiger steht zwischen der 4 und der 5.',
    ]);
    expect(explainFor('digital-to-clock', face(7, 0))[1]).toBe('Der lange Zeiger muss auf die 12.');
  });

  it('Worte → Uhr, auch in der Variante „ost“', () => {
    expect(explainFor('words-to-clock', face(10, 25))[0]).toBe('„fünf vor halb elf“ ist 10:25.');
    expect(explainFor('words-to-clock', face(10, 45), 'ost')[0]).toBe('„dreiviertel elf“ ist 10:45.');
    expect(explain(face(10, 15), 'ost')[2]).toBe('Also ist es viertel elf.');
  });
});
