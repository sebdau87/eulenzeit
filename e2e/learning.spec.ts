import { expect, test } from '@playwright/test';
import { answers, correctAnswer, expectClockUncovered, solveCorrectly, wrongOption } from './helpers';

test.describe('Lernschleife', () => {
  test('Aufgabe lesen und richtig beantworten – mit Lob, Stern und Fortschritt', async ({ page }) => {
    await page.goto('/?seed=11#/');
    await page.getByRole('button', { name: /Volle Stunden/ }).click();

    await expect(page.getByRole('heading', { name: 'Wie spät ist es?' })).toBeVisible();
    await expect(page.getByTestId('tack-helper')).toHaveCount(0); // Tack nicht auf dem Frage-Screen
    await expect(answers(page)).toHaveCount(4);
    await expect(page.getByRole('img', { name: /kurze Stundenzeiger/ })).toBeVisible();

    const check = page.getByRole('button', { name: 'Prüfen' });
    await expect(check).toBeDisabled();

    const correct = await correctAnswer(page);
    await answers(page).getByText(correct, { exact: true }).click();
    await check.click();

    await expect(page.getByTestId('tack-helper')).toHaveAttribute('data-mood', 'minze');
    await expectClockUncovered(page);
    await expect(page.getByRole('button', { name: new RegExp(`richtig.*${correct}`) })).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    await expect(page.getByLabel('1 Stern in diesem Level')).toBeVisible();

    // Weiter per Tastatur: der Hauptknopf behält den Fokus (Prüfen → Weiter).
    await page.getByRole('button', { name: 'Weiter', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Wie spät ist es?' })).toBeFocused();
    await expect(page.getByTestId('tack-helper')).toHaveCount(0);
  });

  test('Fehler → Tack gibt einen Tipp → nochmal versuchen → Erklärung nach zwei Fehlern', async ({ page }) => {
    await page.goto('/?seed=21#/level/1');
    const correct = await correctAnswer(page);

    const first = await wrongOption(page, correct);
    await first.click();
    await page.getByRole('button', { name: 'Prüfen' }).click();

    const helper = page.getByTestId('tack-helper');
    await expect(helper).toHaveAttribute('data-mood', 'sonne');
    await expectClockUncovered(page);
    await expect(first).toBeDisabled();
    await expect(first).toHaveAccessibleName(/nicht ganz, nochmal/);
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

    const second = await wrongOption(page, correct);
    await second.click();
    await page.getByRole('button', { name: 'Prüfen' }).click();

    await expect(page.getByRole('list', { name: 'So geht es' })).toContainText(`Also ist es ${correct}.`);
    await expectClockUncovered(page);
    await expect(page.getByRole('button', { name: new RegExp(`richtig.*${correct}`) })).toBeVisible();
    await page.getByRole('button', { name: 'Verstanden, weiter' }).click();
    await expect(page.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  });

  test('Fünf richtige in Folge schalten das nächste Level frei', async ({ page }) => {
    await page.goto('/?seed=31#/');
    await expect(page.getByRole('button', { name: /Halbe Stunden/ })).toHaveAttribute('aria-disabled', 'true');

    await page.getByRole('button', { name: /Volle Stunden/ }).click();
    for (let i = 0; i < 5; i++) await solveCorrectly(page);

    await expect(page.getByRole('heading', { name: 'Level 1 geschafft!' })).toBeVisible();
    await expect(page.getByText('Level 2 ist jetzt frei!', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Weiter zu Level 2' }).click();
    await expect(page.getByText('Level 2 · Halbe Stunden')).toBeVisible();

    await page.getByRole('button', { name: 'Zur Levelauswahl' }).click();
    await expect(page.getByRole('button', { name: /Halbe Stunden/ })).toHaveAttribute('aria-disabled', 'false');
    await expect(page.getByLabel('5 Sterne gesammelt')).toBeVisible();
  });
});
