import { expect, test } from '@playwright/test';
import { to12h } from '../src/domain/time';
import { timeToGermanWords } from '../src/domain/words';
import { answers, expectClockUncovered, seedProgress, timeShownIn } from './helpers';

test.describe('Level 6–8', () => {
  test('Level 6: Uhr ablesen und digital antworten', async ({ page }) => {
    await seedProgress(page, 6);
    await page.goto('/?seed=6#/level/6');
    const t = await timeShownIn(page.locator('main'));
    const digital = `${t.hour}:${String(t.minute).padStart(2, '0')}`;
    await answers(page).getByText(digital, { exact: true }).click();
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.getByTestId('tack-helper')).toContainText(digital);
  });

  test('Level 7: Zeiger per Tastatur stellen', async ({ page }) => {
    await seedProgress(page, 7);
    await page.goto('/?seed=7#/level/7');
    const target = (await page.locator('h1 time').textContent())!;
    const [h, m] = target.split(':').map(Number) as [number, number];

    const minute = page.getByRole('slider', { name: 'Minutenzeiger' });
    await minute.focus();
    // Von 12:00 bzw. 6:00 aus: Minuten in Fünferschritten vor, Stunde danach passend stellen.
    for (let i = 0; i < m / 5; i++) await page.keyboard.press('ArrowUp');
    const hour = page.getByRole('slider', { name: 'Stundenzeiger' });
    await hour.focus();
    for (let i = 0; i < 12 && Number(await hour.getAttribute('aria-valuenow')) !== to12h(h); i++) {
      await page.keyboard.press('ArrowUp');
    }
    await expect(minute).toHaveAttribute('aria-valuenow', String(m));
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.getByTestId('tack-helper')).toHaveAttribute('data-mood', 'minze');
    await expectClockUncovered(page);
  });

  test('Level 7: Zeiger per Touch/Maus ziehen, falsch → Tipp', async ({ page }) => {
    await seedProgress(page, 7);
    await page.goto('/?seed=8#/level/7');
    const target = (await page.locator('h1 time').textContent())!;
    const m = Number(target.split(':')[1]);

    // Minutenzeiger an die falsche Stelle (gegenüber) ziehen.
    const box = (await page.locator('[role="group"] svg').boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const r = box.width * 0.3;
    const at = (minute: number) => {
      const rad = ((minute * 6 - 90) * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };
    const wrongMinute = (m + 30) % 60;
    await page.mouse.move(at(0).x, at(0).y);
    await page.mouse.down();
    await page.mouse.move(at(wrongMinute).x, at(wrongMinute).y, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByRole('slider', { name: 'Minutenzeiger' })).toHaveAttribute('aria-valuenow', String(wrongMinute));

    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.getByTestId('tack-helper')).toHaveAttribute('data-mood', 'sonne');
    await expect(page.getByRole('slider', { name: 'Minutenzeiger' })).toBeVisible();
  });

  test('Level 8: Zeit in Worten → passende Uhr wählen', async ({ page }) => {
    await seedProgress(page, 8);
    await page.goto('/?seed=9#/level/8');
    const heading = (await page.getByRole('heading', { level: 1 }).textContent())!;
    const words = heading.match(/„(.+)“/)![1];
    const options = answers(page);
    await expect(options).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      if (timeToGermanWords(await timeShownIn(options.nth(i))) === words) {
        await options.nth(i).click();
        break;
      }
    }
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.getByTestId('tack-helper')).toHaveAttribute('data-mood', 'minze');
  });
});

test.describe('Speichern und Eltern-Bereich', () => {
  test('Fortschritt bleibt nach dem Neuladen erhalten', async ({ page }) => {
    await page.goto('/?seed=12#/level/1');
    const t = await timeShownIn(page.locator('main'));
    await answers(page).getByText(timeToGermanWords(t), { exact: true }).click();
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.getByLabel('1 Stern in diesem Level')).toBeVisible();

    await page.goto('/#/');
    await page.reload();
    await expect(page.getByLabel('1 Stern gesammelt')).toBeVisible();
    await expect(page.getByRole('button', { name: /Volle Stunden/ })).toContainText('1 von 5 in Folge');
  });

  test('Eltern-Hürde, Wortvariante umstellen, bleibt gespeichert', async ({ page }) => {
    await seedProgress(page, 3);
    await page.goto('/#/');
    await page.getByRole('button', { name: 'Für Eltern' }).click();
    await expect(page.getByRole('radio')).toHaveCount(0);

    const solveGate = async () => {
      const label = (await page.getByText(/Wie viel ist \d × \d\?/).textContent())!;
      const [, a, b] = label.match(/(\d) × (\d)/)!;
      await page.getByLabel(label).fill(String(Number(a) * Number(b)));
      await page.getByRole('button', { name: 'Weiter' }).click();
    };
    await solveGate();
    await page.getByRole('radio', { name: /dreiviertel elf/ }).check();

    await page.reload();
    await solveGate();
    await expect(page.getByRole('radio', { name: /dreiviertel elf/ })).toBeChecked();
    await page.getByRole('button', { name: 'Zurück zu den Levels' }).click();
    await expect(page.getByRole('heading', { name: 'Eulenzeit' })).toBeVisible();
  });
});
