// Misst den Produktions-Build mit Lighthouse (mobil gedrosselt + Desktop).
// Voraussetzung: `npm run build`. Startet selbst `vite preview`.
// Browser: CHROME_PATH, sonst die Chromium-Headless-Shell von Playwright, sonst Playwrights Chromium.
// Aufruf: node scripts/lighthouse.mjs [Ausgabeordner]
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const outDir = process.argv[2] ?? 'lighthouse-report';
mkdirSync(outDir, { recursive: true });
const PORT = 5190;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 1500));

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  if (existsSync(cache)) {
    for (const dir of readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell'))) {
      const bin = join(cache, dir, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
      if (existsSync(bin)) return bin;
    }
  }
  return chromium.executablePath();
}

const pages = ['/', '/#/level/1'];
const chrome = await chromeLauncher.launch({
  chromePath: findChrome(),
  chromeFlags: ['--headless', '--no-sandbox'],
});
const results = [];
try {
  for (const preset of ['mobile', 'desktop']) {
    for (const path of pages) {
      const url = `http://localhost:${PORT}${path}`;
      const config = preset === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
      const run = await lighthouse(
        url,
        { port: chrome.port, output: 'html', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] },
        config,
      );
      const scores = Object.fromEntries(
        Object.entries(run.lhr.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)]),
      );
      results.push({ preset, path, ...scores });
      writeFileSync(join(outDir, `${preset}${path.replace(/[^a-z0-9]+/gi, '-')}.html`), run.report);
      const failing = Object.values(run.lhr.audits)
        .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
        .map((a) => `   - ${a.id}: ${a.displayValue ?? a.score}`);
      console.log(preset, path, scores);
      if (failing.length) console.log(failing.join('\n'));
    }
  }
} finally {
  await chrome.kill();
  server.kill();
}
writeFileSync(join(outDir, 'summary.json'), JSON.stringify(results, null, 2));
