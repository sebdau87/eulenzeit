// Stellt den Ordner „fuer-github/“ zusammen: genau die Dateien, die ins GitHub-Repository gehören
// (für das Hochladen über die GitHub-Webseite, ohne Git). Ausgelassen wird alles aus .gitignore
// (node_modules, .tools, dist, Testergebnisse …) sowie macOS-Dateien.
// Aufruf: ./.tools/node/bin/node scripts/prepare-upload.mjs
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'fuer-github');
const ignored = new Set(
  readFileSync(join(ROOT, '.gitignore'), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#')),
);
ignored.add('fuer-github');
ignored.add('.DS_Store');

const isIgnored = (name) => ignored.has(name) || [...ignored].some((p) => p.startsWith('*.') && name.endsWith(p.slice(1)));

if (existsSync(OUT)) rmSync(OUT, { recursive: true });

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (isIgnored(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(relative(ROOT, full));
  }
}
walk(ROOT);

for (const file of files) cpSync(join(ROOT, file), join(OUT, file));

const hidden = files.filter((f) => f.split('/').some((part) => part.startsWith('.')));
console.log(`✓ ${files.length} Dateien nach fuer-github/ kopiert.`);
console.log(`  Davon versteckt (beginnen mit „.“): ${hidden.join(', ')}`);
