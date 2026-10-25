import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { answers, correctAnswer, seedProgress, wrongOption } from './helpers';

/** WCAG 2.2 AA mit axe-core. Jede Prüfung meldet Verstöße mit Regel und Ziel. */
async function expectNoViolations(page: Page, label: string) {
  // Erst messen, wenn Einblendungen fertig sind (Tacks Blinzeln läuft endlos und wird ausgenommen).
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished),
    ),
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  const summary = violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary, label).toEqual([]);
}

test.describe('Barrierefreiheit (axe, WCAG 2.2 AA)', () => {
  test('Levelauswahl und Eltern-Bereich', async ({ page }) => {
    await seedProgress(page, 3);
    await page.goto('/#/');
    await expectNoViolations(page, 'Levelauswahl');
    await page.getByRole('button', { name: 'Für Eltern' }).click();
    await expectNoViolations(page, 'Eltern-Hürde');
    const label = (await page.getByText(/Wie viel ist \d × \d\?/).textContent())!;
    const [, a, b] = label.match(/(\d) × (\d)/)!;
    await page.getByLabel(label).fill('1');
    await page.getByRole('button', { name: 'Weiter' }).click();
    await expectNoViolations(page, 'Eltern-Hürde mit Fehler');
    const label2 = (await page.getByText(/Wie viel ist \d × \d\?/).textContent())!;
    const [, c, d] = label2.match(/(\d) × (\d)/)!;
    void a;
    void b;
    await page.getByLabel(label2).fill(String(Number(c) * Number(d)));
    await page.getByRole('button', { name: 'Weiter' }).click();
    await page.getByRole('button', { name: 'Fortschritt zurücksetzen' }).click();
    await expectNoViolations(page, 'Eltern-Einstellungen');
  });

  test('Aufgabe: Frage, Tipp, Erklärung, Lob', async ({ page }) => {
    await page.goto('/?seed=3#/level/1');
    await expectNoViolations(page, 'Frage');
    await page.getByRole('button', { name: 'Tipp' }).click();
    await expectNoViolations(page, 'Tipp-Knopf');
    const correct = await correctAnswer(page);
    await (await wrongOption(page, correct)).click();
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expectNoViolations(page, 'Nicht ganz richtig');
    await (await wrongOption(page, correct)).click();
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expectNoViolations(page, 'Erklärung');
    await page.getByRole('button', { name: 'Verstanden, weiter' }).click();
    await answers(page).getByText(await correctAnswer(page), { exact: true }).click();
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expectNoViolations(page, 'Richtig');
  });

  test('Level 6, 7 und 8', async ({ page }) => {
    await seedProgress(page, 8);
    for (const level of [6, 7, 8]) {
      await page.goto(`/?seed=${level}#/level/${level}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoViolations(page, `Level ${level}`);
    }
  });

  test('Belohnung', async ({ page }) => {
    await page.goto('/?seed=31#/level/1');
    for (let i = 0; i < 5; i++) {
      await answers(page).getByText(await correctAnswer(page), { exact: true }).click();
      await page.getByRole('button', { name: 'Prüfen' }).click();
      await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    }
    await expect(page.getByRole('heading', { name: 'Level 1 geschafft!' })).toBeVisible();
    await expectNoViolations(page, 'Belohnung');
  });

  test('Komponentenseite', async ({ page }) => {
    await page.goto('/#/komponenten');
    await expect(page.getByRole('heading', { name: 'Komponenten' })).toBeVisible();
    await expectNoViolations(page, 'Komponentenseite');
  });
});

test.describe('Barrierefreiheit (ergänzend)', () => {
  test.skip(({ viewport }) => viewport?.width !== 768, 'einmal genügt');

  test('Umbruch bei 320 px ohne seitliches Scrollen (WCAG 1.4.10)', async ({ page }) => {
    await seedProgress(page, 8);
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ['/#/', '/?seed=2#/level/5', '/?seed=3#/level/7', '/?seed=4#/level/8', '/#/eltern']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('„Bewegung reduzieren“ schaltet Animationen ab', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?seed=3#/level/1');
    await page.getByRole('button', { name: 'Tipp' }).click();
    await expect(page.getByTestId('tack-helper')).toBeVisible();
    const running = await page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === 'running' && (a.effect?.getTiming().duration as number) > 0),
    );
    expect(running).toHaveLength(0);
  });

  test('Seitentitel benennt den Bildschirm (WCAG 2.4.2)', async ({ page }) => {
    await page.goto('/#/');
    await expect(page).toHaveTitle('Eulenzeit');
    await page.goto('/#/level/1');
    await expect(page).toHaveTitle('Level 1: Volle Stunden – Eulenzeit');
    await page.goto('/#/eltern');
    await expect(page).toHaveTitle('Für Eltern – Eulenzeit');
  });
});
