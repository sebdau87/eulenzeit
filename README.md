# Eulenzeit

Web-App für Kinder von 6–10 Jahren zum Uhrzeitlesen-Lernen – mit Tack, der Eule.
Kein Backend, keine Accounts, kein Tracking, keine Drittanbieter-Requests.

## Start

Voraussetzung: Node ≥ 20. (Im Projekt liegt optional ein portables Node unter `.tools/node`;
dann vorher `export PATH="$PWD/.tools/node/bin:$PATH"`.)

```bash
npm install
npm run dev        # Entwicklungsserver, http://localhost:5173
```

- Levelauswahl: `#/`, Level: `#/level/1` … `#/level/8`, Eltern-Bereich: `#/eltern`
- `?seed=123` macht die Aufgaben reproduzierbar
- Komponentenseite (alle Bausteine in allen Zuständen): `#/komponenten`

## Online-Anwendung

Eulenzeit läuft im Browser und ist bewusst **nicht installierbar** (kein Manifest, kein Service Worker),
damit Kinder nichts ohne die Eltern installieren können (DECISIONS D38). Der Lernfortschritt bleibt
lokal auf dem Gerät gespeichert.

## Veröffentlichen (GitHub Pages)

Jeder Push auf `main` testet, baut und veröffentlicht automatisch (`.github/workflows/deploy.yml`).
Einmalig: Repository → **Settings → Pages → Source: GitHub Actions**. Die App liegt dann unter
`https://<name>.github.io/<repository>/`. Suchmaschinen sind ausgesperrt (privates Familienprojekt).

## Build

```bash
npm run build      # Typecheck + Produktions-Build nach dist/
BASE_PATH=/eulenzeit/ npm run build   # Build für einen Unterpfad (wie GitHub Pages)
npm run preview    # gebauten Stand lokal ausliefern
```

## Teststrategie

| Ebene | Werkzeug | Was |
| --- | --- | --- |
| Domain-Logik | Vitest | `timeToGermanWords` (jede der 720 Stellungen eindeutig), Zeigerwinkel, Drag-/Einrast-Logik, Zeitformat – inkl. Randfälle 0:00, 12:00, 11:59, 23:59, Minute 55–59; Aufgaben- und Antwortgenerator, Tipps, Lernsitzung (Zustandsübergänge) |
| Design-Tokens | Vitest | Pflichtfarben vorhanden, Kontrast ≥ 4,5:1 für Text, ≥ 3:1 für Grafik; keine Farb- oder px-Rohwerte außerhalb von `tokens.css` |
| Komponenten | Vitest + Testing Library | Rollen, Namen, Zustände (nie nur Farbe), Tastaturbedienung |
| Kernabläufe | Playwright | Aufgabe lösen, Fehler → Tipp → Erklärung, 5 in Folge → Level frei, Level 6–8 (Zeiger per Tastatur und Ziehen stellen), Speichern über Neuladen, Eltern-Hürde; Uhr nie verdeckt; Querformat ohne Scrollen – auf Tablet hoch/quer und Phone |
| Barrierefreiheit | Playwright + axe-core | WCAG 2.2 AA auf allen Bildschirmen/Zuständen, 320-px-Umbruch, „Bewegung reduzieren“, Seitentitel |
| Datenschutz & keine Installation | Playwright gegen Produktions-Build | CSP, keine fremden Requests, keine Cookies; kein Manifest, kein Service Worker |
| Qualität | Lighthouse | siehe unten |

### Lighthouse (Produktions-Build, 25.10.2026)

| | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Mobil, Levelauswahl | 98 | 100 | 100 | 100 |
| Mobil, Aufgabe | 100 | 100 | 100 | 100 |
| Desktop, Levelauswahl | 100 | 100 | 100 | 100 |
| Desktop, Aufgabe | 100 | 100 | 100 | 100 |

Gemessen nach dem Entfernen von Manifest und Service Worker (D38). Seit D40 ist die Seite bewusst
nicht indexierbar; Lighthouse zieht dafür bei SEO Punkte ab.

```bash
npm test           # alle Unit- und Komponententests
npm run test:e2e   # Playwright (einmalig: npx playwright install chromium --only-shell)
npm run lighthouse # Produktions-Build messen (mobil + Desktop)
npm run check      # Typecheck + Unit + E2E
npm run typecheck
```

## Architektur

```
UI (screens, components)  →  store (Zustand)  →  domain (reine Funktionen: session, questions, hints, words, clockMath)
                                   ↓
                         storage (ProgressStorage-Interface → localStorage, nur auf dem Gerät)
```

- `src/design/tokens.css` ist die einzige Quelle für Farben, Abstände, Radien, Größen und
  Schrift; responsive Werte (Phone ≤ 600, Tablet 601–1024, Desktop) werden dort umdefiniert.
- Komponenten nutzen CSS Modules; drückbare Elemente teilen `components/shared/pressable.module.css`
  (4-px-Kante, 2 px Einsinken beim Drücken).
- Schriften (Fredoka, Nunito) sind über `@fontsource` selbst gehostet.

Details: [docs/PLAN.md](docs/PLAN.md) · Entscheidungen: [docs/DECISIONS.md](docs/DECISIONS.md)
