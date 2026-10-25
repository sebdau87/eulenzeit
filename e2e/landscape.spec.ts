import { expect, test, type Page } from '@playwright/test';
import {
  answers,
  correctAnswer,
  expectClockUncovered,
  expectFullyVisibleWithoutScrolling,
  solveCorrectly,
  wrongOption,
} from './helpers';

/** Tablet quer: Auch mit Tipp oder Erklärung bleiben Uhr, Antworten und Hauptknopf ohne Scrollen sichtbar. */
test.describe('Tablet im Querformat', () => {
  test.skip(({ viewport }) => !viewport || viewport.width <= viewport.height, 'nur Querformat');

  async function expectEverythingVisible(page: Page, mainButton: RegExp) {
    await expectClockUncovered(page);
    await expectFullyVisibleWithoutScrolling(page, page.getByRole('img', { name: /Stundenzeiger/ }), 'Uhr');
    await expectFullyVisibleWithoutScrolling(page, page.getByTestId('tack-helper'), 'Tack mit Sprechblase');
    const count = await answers(page).count();
    for (let i = 0; i < count; i++) {
      await expectFullyVisibleWithoutScrolling(page, answers(page).nth(i), `Antwort ${i + 1}`);
    }
    await expectFullyVisibleWithoutScrolling(page, page.getByRole('button', { name: mainButton }), 'Hauptknopf');
  }

  async function tipThenExplanation(page: Page) {
    const correct = await correctAnswer(page);
    await (await wrongOption(page, correct)).click();
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.getByTestId('tack-helper')).toHaveAttribute('data-mood', 'sonne');
    await expectEverythingVisible(page, /^Prüfen$/);

    await (await wrongOption(page, correct)).click();
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.getByRole('list', { name: 'So geht es' })).toBeVisible();
    await expectEverythingVisible(page, /Verstanden, weiter/);
  }

  test('Level 1: Tipp und Erklärung passen auf den Bildschirm', async ({ page }) => {
    await page.goto('/?seed=40#/level/1');
    await tipThenExplanation(page);
  });

  test('Level 5 (längste Erklärungen) passt auf den Bildschirm', async ({ page }) => {
    await page.goto('/?seed=50#/level/1');
    for (let level = 1; level <= 4; level++) {
      for (let i = 0; i < 5; i++) await solveCorrectly(page);
      await page.getByRole('button', { name: `Weiter zu Level ${level + 1}` }).click();
    }
    await expect(page.getByText('Level 5 · Jede Minute')).toBeVisible();
    // Krumme Minute suchen: deren Erklärung ist am längsten („… 3 Punkte nach der 11 …“).
    for (let i = 0; i < 10 && (await correctAnswer(page)).split(' ').length < 3; i++) await solveCorrectly(page);
    await tipThenExplanation(page);
  });
});
