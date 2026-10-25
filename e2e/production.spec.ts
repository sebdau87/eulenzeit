import { expect, test } from '@playwright/test';
import { answers, correctAnswer } from './helpers';

test.describe('Produktions-Build: Datenschutz und keine Installation', () => {
  test('nicht installierbar: kein Manifest, kein Service Worker (DECISIONS D38)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Eulenzeit' })).toBeVisible();
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(0);
    const registrations = await page.evaluate(async () =>
      'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0,
    );
    expect(registrations).toBe(0);
    await expect(page.getByRole('button', { name: /install/i })).toHaveCount(0);
  });

  test('keine Requests an fremde Server, CSP aktiv', async ({ page, baseURL }) => {
    const foreign: string[] = [];
    page.on('request', (r) => {
      const url = new URL(r.url());
      if (url.origin !== new URL(baseURL!).origin && url.protocol !== 'data:') foreign.push(r.url());
    });

    await page.goto('/');
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("worker-src 'none'");

    await page.getByRole('button', { name: /Volle Stunden/ }).click();
    const correct = await correctAnswer(page);
    await answers(page).getByText(correct, { exact: true }).click();
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    await page.getByRole('button', { name: 'Zur Levelauswahl' }).click();
    await page.getByRole('button', { name: 'Für Eltern' }).click();
    await page.waitForLoadState('networkidle');

    expect(foreign).toEqual([]);
    // Keine Cookies, nur der Lernfortschritt im lokalen Speicher.
    expect(await page.context().cookies()).toEqual([]);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['eulenzeit:v1']);
  });
});
