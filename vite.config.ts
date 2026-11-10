/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Content-Security-Policy nur im Build (der Dev-Server braucht Inline-Skripte für HMR).
 * Alles kommt vom eigenen Origin – keine Drittanbieter, kein Tracking (DECISIONS D34).
 * Kein Manifest, kein Service Worker: Eulenzeit ist bewusst nicht installierbar (DECISIONS D38).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'none'",
  "worker-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'eulenzeit-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    ],
  };
}

/** Stand der App als „MM/JJJJ“, beim Build aus dem Datum gesetzt (DECISIONS D42). */
const now = new Date();
const BUILD_STAND = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

export default defineConfig({
  // Unterpfad beim Hosting, z. B. „/eulenzeit/“ für GitHub Pages (setzt der Workflow). Lokal: „/“.
  base: process.env.BASE_PATH ?? '/',
  define: { __BUILD_STAND__: JSON.stringify(BUILD_STAND) },
  plugins: [
    react(),
    contentSecurityPolicy(),
  ],
  css: {
    modules: { localsConvention: 'camelCaseOnly' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
