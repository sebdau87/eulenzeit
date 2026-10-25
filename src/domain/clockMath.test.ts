import { describe, expect, it } from 'vitest';
import {
  angleToHour12,
  angleToMinute,
  angularDistance,
  CLOCK,
  hourHandAngle,
  minuteHandAngle,
  pickHand,
  pointToPolar,
  polarToCartesian,
  setHour12,
  setMinuteWithWrap,
  stepMinute,
} from './clockMath';

describe('Zeigerwinkel', () => {
  it.each([
    [0, 0, 0, 0],
    [12, 0, 0, 0],
    [3, 0, 90, 0],
    [6, 0, 180, 0],
    [4, 30, 135, 180],
    [10, 25, 312.5, 150],
    [11, 59, 359.5, 354],
    [23, 59, 359.5, 354],
    [9, 45, 292.5, 270],
  ])('%s:%s → Stunde %s°, Minute %s°', (h, m, hourDeg, minuteDeg) => {
    expect(hourHandAngle(h, m)).toBeCloseTo(hourDeg, 6);
    expect(minuteHandAngle(m)).toBe(minuteDeg);
  });

  it.each([55, 56, 57, 58, 59])('Stundenzeiger bei Minute %s steht kurz vor der nächsten Stunde', (m) => {
    const angle = hourHandAngle(4, m);
    expect(angle).toBeGreaterThan(4 * 30 + 27);
    expect(angle).toBeLessThan(5 * 30);
  });
});

describe('Polarkoordinaten', () => {
  it('0° liegt oben, 90° rechts', () => {
    const top = polarToCartesian(0, 100);
    const right = polarToCartesian(90, 100);
    expect(top.x).toBeCloseTo(CLOCK.center);
    expect(top.y).toBeCloseTo(CLOCK.center - 100);
    expect(right.x).toBeCloseTo(CLOCK.center + 100);
    expect(right.y).toBeCloseTo(CLOCK.center);
  });

  it.each([0, 45, 90, 180, 270, 359])('pointToPolar ist die Umkehrung bei %s°', (angle) => {
    const p = polarToCartesian(angle, 60);
    const polar = pointToPolar(p.x, p.y);
    expect(angularDistance(polar.angle, angle)).toBeLessThan(1e-9);
    expect(polar.distance).toBeCloseTo(60);
  });

  it('angularDistance nimmt den kurzen Weg', () => {
    expect(angularDistance(350, 10)).toBe(20);
    expect(angularDistance(10, 350)).toBe(20);
    expect(angularDistance(0, 180)).toBe(180);
    expect(angularDistance(-90, 270)).toBe(0);
  });
});

describe('angleToMinute', () => {
  it.each([
    [0, 1, 0],
    [359, 1, 0],
    [357.5, 5, 0],
    [180, 5, 30],
    [152, 5, 25],
    [146, 1, 24],
    [356, 1, 59],
    [-30, 5, 55],
  ])('%s° (Raster %s) → %s', (angle, step, minute) => {
    expect(angleToMinute(angle, step)).toBe(minute);
  });
});

describe('angleToHour12', () => {
  it.each([
    [0, 0, 12],
    [90, 0, 3],
    [135, 30, 4],
    [119, 0, 4],
    [100, 0, 3],
    [355, 0, 12],
    [359.5, 59, 11],
  ])('%s° bei Minute %s → %s', (angle, minute, hour) => {
    expect(angleToHour12(angle, minute)).toBe(hour);
  });
});

describe('setHour12', () => {
  it('behält Vor- bzw. Nachmittag', () => {
    expect(setHour12({ hour: 4, minute: 30 }, 7)).toEqual({ hour: 7, minute: 30 });
    expect(setHour12({ hour: 16, minute: 30 }, 7)).toEqual({ hour: 19, minute: 30 });
    expect(setHour12({ hour: 4, minute: 0 }, 12)).toEqual({ hour: 0, minute: 0 });
    expect(setHour12({ hour: 13, minute: 0 }, 12)).toEqual({ hour: 12, minute: 0 });
  });
});

describe('setMinuteWithWrap', () => {
  it.each([
    [4, 55, 0, 5, 0],
    [5, 5, 55, 4, 55],
    [4, 10, 40, 4, 40],
    [23, 55, 0, 0, 0],
    [0, 5, 55, 23, 55],
    [11, 59, 1, 12, 1],
  ])('%s:%s → Minute %s = %s:%s', (h, m, minute, eh, em) => {
    expect(setMinuteWithWrap({ hour: h, minute: m }, minute)).toEqual({ hour: eh, minute: em });
  });
});

describe('stepMinute', () => {
  it('springt im Raster und über die volle Stunde', () => {
    expect(stepMinute({ hour: 4, minute: 55 }, 1, 5)).toEqual({ hour: 5, minute: 0 });
    expect(stepMinute({ hour: 5, minute: 0 }, -1, 5)).toEqual({ hour: 4, minute: 55 });
    expect(stepMinute({ hour: 4, minute: 33 }, 1, 5)).toEqual({ hour: 4, minute: 35 });
    expect(stepMinute({ hour: 4, minute: 33 }, -1, 5)).toEqual({ hour: 4, minute: 30 });
    expect(stepMinute({ hour: 0, minute: 0 }, -1, 1)).toEqual({ hour: 23, minute: 59 });
  });
});

describe('pickHand', () => {
  const t = { hour: 3, minute: 30 }; // Stunde ≈ 105°, Minute 180°
  it('nimmt außen immer den Minutenzeiger', () => {
    expect(pickHand(105, 80, t)).toBe('minute');
  });
  it('nimmt innen den Zeiger mit dem kleineren Winkelabstand', () => {
    expect(pickHand(100, 40, t)).toBe('hour');
    expect(pickHand(175, 40, t)).toBe('minute');
  });
  it('bevorzugt bei Deckung den Stundenzeiger (12:00)', () => {
    expect(pickHand(0, 30, { hour: 12, minute: 0 })).toBe('hour');
  });
});
