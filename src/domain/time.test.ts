import { describe, expect, it } from 'vitest';
import {
  addMinutes,
  formatDigital,
  fromTotalMinutes,
  isSameClockFace,
  makeTime,
  to12h,
  toIsoTime,
} from './time';

describe('makeTime', () => {
  it('akzeptiert die Grenzen', () => {
    expect(makeTime(0, 0)).toEqual({ hour: 0, minute: 0 });
    expect(makeTime(23, 59)).toEqual({ hour: 23, minute: 59 });
  });

  it.each([
    [24, 0],
    [-1, 0],
    [4, 60],
    [4, -1],
    [4.5, 0],
    [4, Number.NaN],
  ])('wirft bei %s:%s', (h, m) => {
    expect(() => makeTime(h, m)).toThrow(RangeError);
  });
});

describe('fromTotalMinutes / addMinutes', () => {
  it('rechnet über Mitternacht in beide Richtungen', () => {
    expect(addMinutes(makeTime(23, 59), 1)).toEqual({ hour: 0, minute: 0 });
    expect(addMinutes(makeTime(0, 0), -1)).toEqual({ hour: 23, minute: 59 });
    expect(addMinutes(makeTime(11, 55), 10)).toEqual({ hour: 12, minute: 5 });
    expect(fromTotalMinutes(-1440 * 3 + 61)).toEqual({ hour: 1, minute: 1 });
  });
});

describe('to12h', () => {
  it.each([
    [0, 12],
    [12, 12],
    [1, 1],
    [11, 11],
    [13, 1],
    [23, 11],
  ])('%s → %s', (h, expected) => expect(to12h(h)).toBe(expected));
});

describe('formatDigital', () => {
  it.each([
    [0, 0, '12:00', '0:00'],
    [12, 0, '12:00', '12:00'],
    [11, 59, '11:59', '11:59'],
    [4, 5, '4:05', '4:05'],
    [16, 30, '4:30', '16:30'],
    [23, 59, '11:59', '23:59'],
  ])('%s:%s → %s / %s', (h, m, twelve, twentyFour) => {
    expect(formatDigital({ hour: h, minute: m })).toBe(twelve);
    expect(formatDigital({ hour: h, minute: m }, '24h')).toBe(twentyFour);
  });

  it('liefert ISO-Form für <time>', () => {
    expect(toIsoTime({ hour: 4, minute: 5 })).toBe('04:05');
    expect(toIsoTime({ hour: 0, minute: 0 })).toBe('00:00');
  });
});

describe('isSameClockFace', () => {
  it('behandelt 4:30 und 16:30 sowie 0:00 und 12:00 als gleich', () => {
    expect(isSameClockFace(makeTime(4, 30), makeTime(16, 30))).toBe(true);
    expect(isSameClockFace(makeTime(0, 0), makeTime(12, 0))).toBe(true);
    expect(isSameClockFace(makeTime(4, 30), makeTime(4, 31))).toBe(false);
  });
});
