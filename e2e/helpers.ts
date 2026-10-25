import { expect, type Locator, type Page } from '@playwright/test';
import { to12h } from '../src/domain/time';
import { timeToGermanWords } from '../src/domain/words';

/** Liest die Zeit aus den Zeigerwinkeln der Uhr und bildet die richtige Antwort in Worten. */
export async function correctAnswer(page: Page): Promise<string> {
  const minuteAngle = Number(await page.getByTestId('minute-hand').getAttribute('data-angle'));
  const hourAngle = Number(await page.getByTestId('hour-hand').getAttribute('data-angle'));
  const minute = Math.round(minuteAngle / 6) % 60;
  const hour = to12h(Math.floor((hourAngle - minute * 0.5) / 30 + 0.001));
  return timeToGermanWords({ hour, minute });
}

export function answers(page: Page): Locator {
  return page.getByRole('group', { name: /Wie spät ist es\?|Welche Uhr zeigt/ }).getByRole('button');
}

export async function wrongOption(page: Page, correct: string): Promise<Locator> {
  const all = answers(page);
  const count = await all.count();
  for (let i = 0; i < count; i++) {
    const option = all.nth(i);
    if ((await option.textContent())?.trim() !== correct && (await option.isEnabled())) return option;
  }
  throw new Error('Keine falsche Option gefunden');
}

/** Löst die aktuelle Aufgabe richtig und geht weiter. */
export async function solveCorrectly(page: Page): Promise<void> {
  const correct = await correctAnswer(page);
  await answers(page).getByText(correct, { exact: true }).click();
  await page.getByRole('button', { name: 'Prüfen' }).click();
  await expect(page.getByTestId('tack-helper')).toHaveAttribute('data-mood', 'minze');
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
}

/** Tack und Sprechblase dürfen die Uhr nie überlappen (DECISIONS D27). */
export async function expectClockUncovered(page: Page): Promise<void> {
  // Die große Uhr: erstes Zifferblatt im Inhalt (Label je nach Phase verschieden).
  const clock = await page.locator('main svg[viewBox="0 0 252 252"]').first().boundingBox();
  const helper = await page.getByTestId('tack-helper').boundingBox();
  expect(clock).not.toBeNull();
  expect(helper).not.toBeNull();
  const overlaps =
    clock!.x < helper!.x + helper!.width &&
    helper!.x < clock!.x + clock!.width &&
    clock!.y < helper!.y + helper!.height &&
    helper!.y < clock!.y + clock!.height;
  expect(overlaps, 'Tack/Sprechblase überdecken die Uhr').toBe(false);
}

/** Ohne zu scrollen: liegt das Element vollständig im sichtbaren Bereich? */
export async function expectFullyVisibleWithoutScrolling(page: Page, locator: Locator, label: string): Promise<void> {
  await page.evaluate('window.scrollTo(0, 0)');
  const box = await locator.boundingBox();
  const height = page.viewportSize()!.height;
  expect(box, label).not.toBeNull();
  expect(box!.y, `${label}: oberhalb des Bildschirms`).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height, `${label}: ragt unter den Bildschirmrand`).toBeLessThanOrEqual(height);
}

/** Legt vor dem Laden einen Fortschritt im Gerätespeicher ab (über dasselbe Format wie die App). */
export async function seedProgress(page: Page, unlocked: number, wordVariant: 'standard' | 'ost' = 'standard') {
  await page.addInitScript(
    ([u, v]) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(
          'eulenzeit:v1',
          JSON.stringify({ version: 1, progress: { unlocked: u, levels: {} }, settings: { wordVariant: v } }),
        );
        sessionStorage.setItem('seeded', '1');
      }
    },
    [unlocked, wordVariant] as const,
  );
}

/** Zeit aus den Zeigerwinkeln einer Uhr innerhalb von `scope`. */
export async function timeShownIn(scope: Locator): Promise<{ hour: number; minute: number }> {
  const minuteAngle = Number(await scope.getByTestId('minute-hand').getAttribute('data-angle'));
  const hourAngle = Number(await scope.getByTestId('hour-hand').getAttribute('data-angle'));
  const minute = Math.round(minuteAngle / 6) % 60;
  return { hour: to12h(Math.floor((hourAngle - minute * 0.5) / 30 + 0.001)), minute };
}
