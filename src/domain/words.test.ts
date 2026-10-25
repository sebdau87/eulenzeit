import { describe, expect, it } from 'vitest';
import { describeClockHands, hourWord, numberWord, timeToGermanWords, WORD_VARIANTS } from './words';

const words = (h: number, m: number) => timeToGermanWords({ hour: h, minute: m });

describe('timeToGermanWords – Beispiele aus dem Auftrag', () => {
  it.each([
    [10, 25, 'fünf vor halb elf'],
    [10, 35, 'fünf nach halb elf'],
    [10, 45, 'Viertel vor elf'],
  ])('%s:%s → „%s“', (h, m, expected) => expect(words(h, m)).toBe(expected));
});

describe('timeToGermanWords – volle, halbe, Viertel', () => {
  it.each([
    [4, 0, 'vier Uhr'],
    [1, 0, 'ein Uhr'],
    [13, 0, 'ein Uhr'],
    [0, 0, 'zwölf Uhr'],
    [12, 0, 'zwölf Uhr'],
    [4, 30, 'halb fünf'],
    [12, 30, 'halb eins'],
    [0, 30, 'halb eins'],
    [11, 30, 'halb zwölf'],
    [4, 15, 'Viertel nach vier'],
    [0, 15, 'Viertel nach zwölf'],
    [1, 15, 'Viertel nach eins'],
    [11, 45, 'Viertel vor zwölf'],
    [12, 45, 'Viertel vor eins'],
  ])('%s:%s → „%s“', (h, m, expected) => expect(words(h, m)).toBe(expected));
});

describe('timeToGermanWords – Fünf-Minuten-Schritte', () => {
  it.each([
    [4, 5, 'fünf nach vier'],
    [4, 10, 'zehn nach vier'],
    [4, 20, 'zwanzig nach vier'],
    [4, 25, 'fünf vor halb fünf'],
    [4, 35, 'fünf nach halb fünf'],
    [4, 40, 'zwanzig vor fünf'],
    [4, 50, 'zehn vor fünf'],
    [4, 55, 'fünf vor fünf'],
  ])('%s:%s → „%s“', (h, m, expected) => expect(words(h, m)).toBe(expected));
});

describe('timeToGermanWords – krumme Minuten (Digitalform)', () => {
  it.each([
    [4, 1, 'vier Uhr eins'],
    [1, 1, 'ein Uhr eins'],
    [4, 7, 'vier Uhr sieben'],
    [4, 16, 'vier Uhr sechzehn'],
    [4, 19, 'vier Uhr neunzehn'],
    [4, 21, 'vier Uhr einundzwanzig'],
    [4, 29, 'vier Uhr neunundzwanzig'],
    [4, 31, 'vier Uhr einunddreißig'],
    [4, 43, 'vier Uhr dreiundvierzig'],
    [4, 56, 'vier Uhr sechsundfünfzig'],
    [4, 57, 'vier Uhr siebenundfünfzig'],
    [4, 58, 'vier Uhr achtundfünfzig'],
    [4, 59, 'vier Uhr neunundfünfzig'],
    [11, 59, 'elf Uhr neunundfünfzig'],
    [23, 59, 'elf Uhr neunundfünfzig'],
    [12, 59, 'zwölf Uhr neunundfünfzig'],
    [0, 1, 'zwölf Uhr eins'],
  ])('%s:%s → „%s“', (h, m, expected) => expect(words(h, m)).toBe(expected));
});

describe('numberWord', () => {
  it.each([
    [1, 'eins'], [12, 'zwölf'], [17, 'siebzehn'], [20, 'zwanzig'], [21, 'einundzwanzig'],
    [30, 'dreißig'], [44, 'vierundvierzig'], [59, 'neunundfünfzig'],
  ])('%s → %s', (n, w) => expect(numberWord(n)).toBe(w));

  it.each([0, 60, 2.5])('wirft bei %s', (n) => expect(() => numberWord(n)).toThrow(RangeError));
});

describe('timeToGermanWords – Eigenschaften', () => {
  it('liefert für jede der 720 Zeigerstellungen eine eigene Angabe', () => {
    const all = new Set<string>();
    for (let h = 0; h < 12; h++) for (let m = 0; m < 60; m++) all.add(words(h, m));
    expect(all.size).toBe(720);
  });

  it('Vor- und Nachmittag klingen gleich', () => {
    for (let h = 0; h < 12; h++) for (let m = 0; m < 60; m += 7) expect(words(h + 12, m)).toBe(words(h, m));
  });

  it.each([
    [24, 0],
    [-1, 0],
    [4, 60],
    [4, 2.5],
  ])('wirft bei %s:%s', (h, m) => {
    expect(() => words(h, m)).toThrow(RangeError);
  });
});

describe('timeToGermanWords – Variante „ost“', () => {
  const ost = (h: number, m: number) => timeToGermanWords({ hour: h, minute: m }, { variant: 'ost' });

  it.each([
    [10, 15, 'viertel elf'],
    [10, 45, 'dreiviertel elf'],
    [11, 15, 'viertel zwölf'],
    [0, 45, 'dreiviertel eins'],
  ])('%s:%s → „%s“', (h, m, expected) => expect(ost(h, m)).toBe(expected));

  it('weicht nur bei Viertel ab', () => {
    for (let m = 0; m < 60; m++) {
      if (m === 15 || m === 45) continue;
      expect(ost(10, m)).toBe(words(10, m));
    }
  });

  it('alle Varianten sind registriert', () => {
    expect(WORD_VARIANTS).toEqual(['standard', 'ost']);
  });
});

describe('hourWord', () => {
  it.each([
    [0, 'zwölf'],
    [1, 'eins'],
    [12, 'zwölf'],
    [13, 'eins'],
    [23, 'elf'],
  ])('%s → %s', (h, w) => expect(hourWord(h)).toBe(w));
});

describe('describeClockHands', () => {
  it.each([
    [4, 0, 'Der kurze Stundenzeiger zeigt auf die 4, der lange Minutenzeiger zeigt auf die 12.'],
    [4, 30, 'Der kurze Stundenzeiger steht zwischen der 4 und der 5, der lange Minutenzeiger zeigt auf die 6.'],
    [0, 0, 'Der kurze Stundenzeiger zeigt auf die 12, der lange Minutenzeiger zeigt auf die 12.'],
    [12, 2, 'Der kurze Stundenzeiger steht zwischen der 12 und der 1, der lange Minutenzeiger steht zwischen der 12 und der 1.'],
    [11, 59, 'Der kurze Stundenzeiger steht zwischen der 11 und der 12, der lange Minutenzeiger steht zwischen der 11 und der 12.'],
    [10, 25, 'Der kurze Stundenzeiger steht zwischen der 10 und der 11, der lange Minutenzeiger zeigt auf die 5.'],
  ])('%s:%s', (h, m, expected) => expect(describeClockHands({ hour: h, minute: m })).toBe(expected));

  it('verrät die Uhrzeit nicht in Worten', () => {
    expect(describeClockHands({ hour: 4, minute: 30 })).not.toMatch(/halb|Uhr\b|Viertel/);
  });
});
