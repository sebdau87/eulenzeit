import { expect, test } from '@playwright/test';
import { answers, correctAnswer } from './helpers';

/** Wie auf GitHub Pages (https://<name>.github.io/eulenzeit/): alles muss unter dem Unterpfad laden. */
test('App läuft unter einem Unterpfad (GitHub Pages)', async ({ page, baseURL }) => {
  const failed: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });

  await page.goto(baseURL!);
  await expect(page.getByRole('heading', { name: 'Eulenzeit' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');

  await page.getByRole('button', { name: /Volle Stunden/ }).click();
  await expect(page).toHaveURL(/\/eulenzeit\/#\/level\/1$/);
  await answers(page).getByText(await correctAnswer(page), { exact: true }).click();
  await page.getByRole('button', { name: 'Prüfen' }).click();
  await expect(page.getByTestId('tack-helper')).toHaveAttribute('data-mood', 'minze');

  // Schriften und Favicon kommen aus dem Unterpfad.
  await expect.poll(() => page.evaluate(() => document.fonts.check('600 28px Fredoka'))).toBe(true);
  const favicon = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(favicon).toMatch(/^\/eulenzeit\//);
  expect(failed).toEqual([]);

  const robots = await page.request.get(`${baseURL}robots.txt`);
  expect(await robots.text()).toContain('Disallow: /');
});
