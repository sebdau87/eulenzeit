// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb } from './contrast';

const SRC = join(__dirname, '..');
const TOKENS_FILE = join(__dirname, 'tokens.css');
const tokensCss = readFileSync(TOKENS_FILE, 'utf8');

function readTokens(css: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
    if (name && value && !map.has(name)) map.set(name, value);
  }
  return map;
}

const tokens = readTokens(tokensCss);
const color = (name: string) => {
  const v = tokens.get(`color-${name}`);
  if (!v) throw new Error(`Token color-${name} fehlt`);
  return v;
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe('contrast helpers', () => {
  it('berechnet bekannte Werte', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#fff', '#fff')).toBeCloseTo(1, 5);
    expect(hexToRgb('#6B55D6')).toEqual([107, 85, 214]);
    expect(() => hexToRgb('lila')).toThrow();
  });
});

describe('Design-Tokens', () => {
  it('enthält die verbindliche Palette', () => {
    expect(color('lavendel').toLowerCase()).toBe('#bbaaff');
    expect(color('lavendel-deep').toLowerCase()).toBe('#6b55d6');
    expect(color('rose-deep').toLowerCase()).toBe('#c93465');
    expect(color('himmel-deep').toLowerCase()).toBe('#2268b8');
    expect(color('creme').toLowerCase()).toBe('#fffbf3');
    expect(color('ink').toLowerCase()).toBe('#2d2a4a');
  });

  const surfaces = [
    'creme', 'weiss', 'sand', 'kante',
    ...['lavendel', 'sonne', 'rose', 'himmel', 'minze', 'pfirsich'].flatMap((c) => [c, `${c}-tint`]),
  ];

  it.each(surfaces)('Ink erreicht 4,5:1 auf %s', (surface) => {
    expect(contrastRatio(color('ink'), color(surface))).toBeGreaterThanOrEqual(4.5);
  });

  // Ink weich ist nur auf hellen Flächen erlaubt. Auf Lavendel, Rose, Himmel und Pfirsich
  // (Pastell) liegt es unter 4,5:1 – dort steht Text immer in Ink (siehe docs/DECISIONS.md).
  const softSurfaces = surfaces.filter((s) => !['lavendel', 'rose', 'himmel', 'pfirsich'].includes(s));
  it.each(softSurfaces)('Ink weich erreicht 4,5:1 auf %s', (surface) => {
    expect(contrastRatio(color('ink-weich'), color(surface))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['minze-deep', 'pfirsich-deep'])('weißes Status-Icon auf %s erreicht 3:1', (bg) => {
    expect(contrastRatio(color('weiss'), color(bg))).toBeGreaterThanOrEqual(3);
  });

  it.each(['rose-deep', 'himmel-deep', 'lavendel-deep'])('%s hebt sich als Grafik von Creme/Weiß ab (3:1)', (fg) => {
    expect(contrastRatio(color(fg), color('creme'))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(color(fg), color('weiss'))).toBeGreaterThanOrEqual(3);
  });
});

describe('keine Rohwerte außerhalb der Token-Datei', () => {
  const files = walk(SRC).filter(
    (f) => /\.(css|tsx?)$/.test(f) && f !== TOKENS_FILE && !/\.test\.tsx?$/.test(f),
  );

  it('findet Quelldateien', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files.map((f) => [relative(SRC, f), f]))('%s enthält keine Farbwerte', (_, file) => {
    const text = readFileSync(file, 'utf8');
    expect(text).not.toMatch(/#[0-9a-fA-F]{3,8}\b(?![-\w])/);
    expect(text).not.toMatch(/\b(rgba?|hsla?)\(/);
  });

  it.each(files.filter((f) => f.endsWith('.css')).map((f) => [relative(SRC, f), f]))(
    '%s enthält keine px-Werte',
    (_, file) => {
      expect(readFileSync(file, 'utf8')).not.toMatch(/\d+(\.\d+)?px\b/);
    },
  );
});
