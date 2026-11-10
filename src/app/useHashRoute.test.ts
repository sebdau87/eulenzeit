import { describe, expect, it } from 'vitest';
import { hrefFor, parseRoute, titleFor } from './useHashRoute';

describe('parseRoute', () => {
  it.each([
    ['', { name: 'levels' }],
    ['#/', { name: 'levels' }],
    ['#/komponenten', { name: 'komponenten' }],
    ['#komponenten', { name: 'komponenten' }],
    ['#/level/3', { name: 'level', level: 3 }],
    ['#/eltern', { name: 'eltern' }],
    ['#/ueber', { name: 'ueber' }],
    ['#/level/9', { name: 'levels' }],
    ['#/level/abc', { name: 'levels' }],
    ['#/unbekannt', { name: 'levels' }],
  ])('%j', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route);
  });

  it('hrefFor ist die Umkehrung', () => {
    expect(parseRoute(hrefFor({ name: 'level', level: 5 }))).toEqual({ name: 'level', level: 5 });
    expect(hrefFor({ name: 'ueber' })).toBe('#/ueber');
  });
});

describe('titleFor', () => {
  it.each([
    [{ name: 'levels' } as const, 'Eulenzeit'],
    [{ name: 'level', level: 3 } as const, 'Level 3: Viertel nach und vor – Eulenzeit'],
    [{ name: 'eltern' } as const, 'Für Eltern – Eulenzeit'],
    [{ name: 'ueber' } as const, 'Über Eulenzeit – Eulenzeit'],
    [{ name: 'komponenten' } as const, 'Komponenten – Eulenzeit'],
  ])('%j → %s', (route, title) => expect(titleFor(route)).toBe(title));
});
