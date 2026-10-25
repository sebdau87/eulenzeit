// Erzeugt das Favicon aus Tack (SVG).
// Aufruf: node scripts/generate-favicon.mjs  → public/favicon.svg
// (App-Icons entfallen: Eulenzeit ist bewusst nicht installierbar, DECISIONS D38.)
// Farben spiegeln src/design/tokens.css (Creme, Lavendel, Lavendel-Tint, Ink, Schnabel, Rose).
import { writeFileSync } from 'node:fs';

const C = {
  creme: '#FFFBF3',
  lavendel: '#BBAAFF',
  lavendelTint: '#EEE8FF',
  ink: '#2D2A4A',
  weiss: '#FFFFFF',
  schnabel: '#FF9F5A',
  rose: '#FFB3CB',
};

// Tack wie in src/components/Tack/Tack.tsx (Gefieder Lavendel), viewBox 0 0 120 120.
const tack = `
  <g fill="${C.schnabel}" stroke="${C.schnabel}" stroke-width="2" stroke-linejoin="round">
    <ellipse cx="47" cy="112" rx="8" ry="4.5"/><ellipse cx="73" cy="112" rx="8" ry="4.5"/>
  </g>
  <path d="M21 52 C21 32 24 17 30 9 L46 24 C52 22 68 22 74 24 L90 9 C96 17 99 32 99 52 L99 74 C99 98 82 111 60 111 C38 111 21 98 21 74 Z"
    fill="${C.lavendel}" stroke="${C.lavendel}" stroke-width="6" stroke-linejoin="round"/>
  <ellipse cx="60" cy="86" rx="26" ry="21" fill="${C.creme}"/>
  <g fill="none" stroke="${C.lavendel}" stroke-width="3" stroke-linecap="round">
    <path d="M47 81 q4.5 4 9 0"/><path d="M64 81 q4.5 4 9 0"/><path d="M55.5 92 q4.5 4 9 0"/>
  </g>
  <g fill="${C.rose}"><ellipse cx="27" cy="66" rx="7" ry="4.5"/><ellipse cx="93" cy="66" rx="7" ry="4.5"/></g>
  <g fill="${C.weiss}"><circle cx="42" cy="49" r="15"/><circle cx="78" cy="49" r="15"/></g>
  <g fill="${C.ink}"><circle cx="44" cy="51" r="7.5"/><circle cx="76" cy="51" r="7.5"/></g>
  <g fill="${C.weiss}"><circle cx="46.5" cy="48" r="2.2"/><circle cx="78.5" cy="48" r="2.2"/></g>
  <path d="M52.5 60 Q60 56.5 67.5 60 L61.3 70.5 Q60 72.5 58.7 70.5 Z" fill="${C.schnabel}" stroke="${C.schnabel}" stroke-width="2" stroke-linejoin="round"/>`;

/** Tack auf Hintergrund; scale = Anteil der Fläche, den Tack einnimmt. */
const svg = (bg, scale, rounded = false) => {
  const size = 120 / scale;
  const offset = (size - 120) / 2;
  const r = rounded ? size * 0.22 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-offset} ${-offset} ${size} ${size}">
  <rect x="${-offset}" y="${-offset}" width="${size}" height="${size}" rx="${r}" fill="${bg}"/>${tack}</svg>`;
};

writeFileSync('public/favicon.svg', svg(C.lavendelTint, 0.82, true) + '\n');
console.log('✓ public/favicon.svg');
