# Entscheidungen und Annahmen

Format: Datum · Entscheidung · Begründung. Neue Einträge unten anhängen.

## Meilenstein 1 (2026-10-25)

### D1 · Anhang fehlt: Tack und Uhr selbst gezeichnet
Das Design-Artefakt, die Tack-SVGs und die Beispiel-Screens lagen dem Auftrag nicht bei.
Tack wurde nach der Textbeschreibung neu gezeichnet (runder Körper mit Federohren, Creme-Bauch,
orange Schnabel/Füße, rosa Bäckchen, Punktaugen bzw. Bogenaugen bei „minze“).
**Folge:** Sobald die Original-SVGs vorliegen, wird nur der Inhalt von `Tack.tsx` ersetzt;
API (`plumage`, `label`, `blink`) und Klassen für die Gefiederfarbe bleiben.

### D2 · Schnabel-Orange als eigener Token
Die Palette enthält kein Orange. Für Schnabel und Füße gibt es `--color-tack-schnabel: #FF9F5A`
in `tokens.css`. Wird ersetzt, falls das Original-Asset einen anderen Wert nutzt.

### D3 · Ink weich nicht auf Lavendel, Rose, Himmel, Pfirsich (Pastell)
Gemessen: Ink weich erreicht dort nur 3,3 / 4,0 / 4,5 (knapp darunter) / 4,3 : 1.
Auf diesen Flächen steht Text **immer in Ink**. Ink weich ist auf Creme, Weiß, Sand, Kante,
allen Tints sowie Sonne- und Minze-Pastell erlaubt. Abgesichert durch `tokens.test.ts`.

### D4 · Fokusring trotz „keine Rahmenlinien“
WCAG 2.4.7/2.4.11 verlangen sichtbaren Fokus. Fokus = 3-px-Outline in Lavendel-Deep mit
3 px Abstand, nur bei `:focus-visible` (also nicht bei Touch/Maus).

### D5 · Status-Icons: weißes Glyph auf Deep-Kreis
„Richtig“ (Haken) und „Nochmal“ (Pfeil im Kreis) sitzen als runde Plakette in Minze-Deep bzw.
Pfirsich-Deep in der Antwort, mit Textlabel („richtig“, „nicht ganz, nochmal“) für Screenreader.
Kontrast Weiß auf Deep ≥ 3:1 (Nicht-Text-Kontrast), getestet.

### D6 · Fortschrittsbalken-Spur in Kante statt Sand
Auf Sand-Karten wäre eine Sand-Spur unsichtbar. Spur = Kante, Füllung = Lavendel, plus
sichtbarer Zähler „3 von 5“ (Zustand nicht nur über Fläche/Farbe).

### D7 · Ausgewählte Antwort: aria-pressed statt Radiogruppe
Ablauf „antippen → Prüfen“ verlangt einen Auswahlzustand. Toggle-Buttons mit `aria-pressed`
sind per Tab erreichbar und auf Touch einfacher als eine Radiogruppe mit Pfeiltasten-Logik.
Wird in M3 im Screen-Kontext noch einmal mit Screenreader geprüft.

### D8 · Tokens rein in CSS, Breakpoints im Token-File
Alle Rohwerte stehen in `src/design/tokens.css`; responsive Größen (Uhr, Tack, Knopfhöhen,
Spaltenbreite) werden dort per Media Query umdefiniert. Komponenten kennen keine Breakpoints.
Ein Test verbietet Hex-/rgb()-Farben in `src/` außerhalb von `tokens.css` und px-Werte in CSS.
Ausnahmen außerhalb von `src/`: `index.html` (`theme-color`) und `public/favicon.svg`, die
Werte aus den Tokens spiegeln müssen; das Manifest kommt in M5 dazu.

### D9 · Schriften über @fontsource, nur Latin-Subset
`@fontsource/fredoka` (500, 600) und `@fontsource/nunito` (600, 700, 800) werden von Vite
gebündelt und vom eigenen Origin ausgeliefert – keine Requests an Google (DSGVO).
Latin deckt Deutsch inkl. Umlaute und ß ab.

### D10 · Kein Router, keine UI-Bibliothek, Komponentenseite statt Storybook
Hash-Routing mit `useSyncExternalStore` (≈ 20 Zeilen). Statt Storybook gibt es
`#/komponenten` (lazy geladen): weniger Abhängigkeiten, gleiche Tokens, gleicher Build.

### D11 · Titelgröße fließend 34–40 px
`--type-title-size: clamp(34px, 2.6vw + 24px, 40px)` erfüllt „34–40/48“ ohne eigenen Breakpoint.

### D12 · Werkzeugkette
Vite 8, React 19, TypeScript 7 (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`),
Vitest 5 + Testing Library + jsdom. Playwright folgt mit den ersten Kernabläufen in M3.
Node liegt lokal unter `.tools/node` (auf dem Entwicklungsrechner war kein Node installiert);
mit systemweitem Node ≥ 20 funktioniert alles genauso.

## Meilenstein 2 (2026-10-25)

### D13 · Wortbildung: welche Form für welche Minute (mit Nutzer abgestimmt)
Fünferschritte (Hochdeutsch, wie in Schulbüchern): `:00` „vier Uhr“ (1 → „ein Uhr“),
`:05/:10/:20` „… nach vier“ (20 = „zwanzig nach“), `:15` „Viertel nach vier“,
`:25` „fünf vor halb fünf“, `:30` „halb fünf“, `:35` „fünf nach halb fünf“,
`:40/:50/:55` „… vor fünf“ (40 = „zwanzig vor“), `:45` „Viertel vor fünf“.
**Krumme Minuten** werden wie auf der Digitaluhr gesprochen: „vier Uhr siebzehn“,
„elf Uhr neunundfünfzig“, „ein Uhr eins“. Grund: Die frühere Form („neun Minuten vor halb
fünf“) wechselte bei :20/:21 und :39/:40 den Bezugspunkt – für Kinder schwer, im Alltag unüblich.
„Viertel“ ist großgeschrieben (Nomen), alles andere klein. 0:00 und 12:00 heißen „zwölf Uhr“
(kein „Mitternacht“/„Mittag“, weil die analoge Uhr Vor-/Nachmittag nicht unterscheidet).
Level 8 („Zeit in Worten“) nutzt nur Fünferschritte.
**Verworfen:** „zehn vor halb“ für :20 – regional verbreitet; als weitere Variante nachrüstbar.

### D14 · Regionale Varianten als Overrides
`timeToGermanWords(time, { variant })`. Eine Variante überschreibt nur einzelne Minuten.
Mitgeliefert: `ost` („viertel elf“, „dreiviertel elf“). Neue Variante = ein Eintrag in
`VARIANT_OVERRIDES` und `WORD_VARIANTS`; Tests prüfen, dass nur die gewollten Minuten abweichen.

### D15 · Textliche Entsprechung der Uhr: Worte – außer in Aufgaben
Standard-`aria-label` der Uhr ist die Zeit in Worten („halb fünf“). In Aufgaben würde das
die Lösung vorlesen. Dafür gibt es `describeClockHands()` („Der kurze Stundenzeiger steht
zwischen der 4 und der 5, der lange Minutenzeiger zeigt auf die 6.“), das die Screens in M3
als `ariaLabel` übergeben.

### D16 · Interaktive Uhr: ein Zeigerauswahl-Algorithmus, zwei Slider
- Pointer Events auf der ganzen Uhrfläche (große Berührfläche, `touch-action: none`).
  Außerhalb der Reichweite des Stundenzeigers wird immer der Minutenzeiger gegriffen,
  innen der Zeiger mit dem kleineren Winkelabstand (bei Deckung die Stunde).
- Minutenzeiger über die 12 gedreht schiebt die Stunde mit (4:55 → 5:00), wie bei einer
  echten Uhr. Stundenzeiger-Drag lässt die Minute stehen.
- Tastatur: beide Zeiger sind `role="slider"` (Pfeiltasten; Minuten im Raster `snapMinutes`).
  Fokusring nur bei Tastaturfokus.
- Die Uhr ist kontrolliert (`hour`, `minute`, `onChange`); der Store hält die Zeit.
- Zeiger springen ohne Animation: Eine Drehanimation würde beim Sprung 59 → 0 rückwärts
  laufen und lenkt beim Ziehen ab.

### D17 · Digitalanzeige im 12-h-Format ohne führende Null
„4:30“ statt „04:30“/„16:30“, weil die analoge Uhr nur 12 Stunden zeigt und die Antworten
vergleichbar sein müssen. `format="24h"` ist vorhanden (z. B. für spätere Tagesablauf-Aufgaben).
Unter Stunde und Minute liegen Balken in Zeigerfarben (Rose/Himmel); der Text bleibt Ink.

### D18 · Uhrgröße
`width: min(var(--clock-size), 100%, var(--clock-max-height))` mit `aspect-ratio: 1` – erfüllt
Phone 288 / Tablet 400 / Desktop 320 px, „max-width 100 %“ und „max. 55 vh im Querformat“ in einer Regel.
Kleinste Schrift auf der Uhr (Minutenzahlen, 15 Einheiten) ergibt bei 288 px ≈ 17 px.

## Meilenstein 3 (2026-10-25)

### D19 · Antworten in Level 1–5 sind Zeitangaben in Worten
Level 1–5 trainieren das Ablesen der analogen Uhr; geantwortet wird so, wie Kinder die Zeit
sagen („halb fünf“). So bleiben die Level 6–8 echte neue Schritte: 6 Analog → Digital,
7 Digital → Zeiger stellen, 8 Worte ↔ Uhr. Die Distraktoren bleiben dieselben typischen
Verwechslungen, nur in Worten (10:25 → „zehn vor sechs“ = 5:50, Zeiger vertauscht).

### D20 · Was „5 richtige in Folge“ heißt – ohne Strafe
- Richtig im 1. **oder 2. Versuch** zählt als richtig (Stern + Serie +1). Das Kind durfte nochmal
  – das soll sich lohnen.
- Erst nach zwei Fehlversuchen (Erklärung) beginnt die Serie neu. Sterne werden **nie** abgezogen.
- Nach 5 in Folge: Belohnungs-Screen, nächstes Level frei, Serie startet für eine neue Runde bei 0.
- Falsch beantwortete Zeiten kommen nach zwei weiteren Aufgaben noch einmal dran.
- Gesperrte Level sind sichtbar und per Tastatur erreichbar (`aria-disabled`, mit Status „Noch gesperrt“).

### D21 · ~~Tack zeigt nur einen kurzen Satz, der Tipp steht darunter~~ (abgelöst durch D27)
Lange Tipps in der Sprechblase verdeckten auf dem Phone genau die Stelle der Uhr, auf die der
Tipp verweist (11–12). Jetzt: Blase kurz („Fast! Schau mal:“, „Ein Tipp für dich:“, Lob),
der eigentliche Tipp bzw. die Erklärung als Sonnen-Karte unter der Frage.
Tack sitzt weiterhin rechts oben auf der Uhrfläche, Blase links daneben.

### D22 · Typische Verwechslungen (Distraktoren)
Reihenfolge: Zeiger vertauscht → Stunde ±1 (z. B. „halb vier“ statt „halb fünf“) → vor/nach
vertauscht (4:25 ↔ 4:35, Viertel nach vier ↔ Viertel vor vier) → Minutenzeiger als Stunde
gelesen (4:00 → zwölf Uhr) → Zahl als Minute gelesen (4:25 → 4:05). Nur Minuten, die im
Level vorkommen; Rest mit Zufallszeiten aufgefüllt. Der Tipp nach einem Fehler richtet
sich nach der erkannten Verwechslung (`classifyMistake`).

### D23 · Fokus und Ansagen
Der Hauptknopf ist ein Element (Prüfen → Weiter), damit der Fokus nicht springt. Bei neuer
Aufgabe geht der Fokus auf „Wie spät ist es?“. Feedback wird über eine `aria-live`-Region
angesagt. Die Uhr nennt im Aufgabenmodus nur die Zeigerstellung (D15).

### D24 · Querformat
Bei `orientation: landscape` und Höhe ≤ 820 px werden Rand- und Zwischenabstände kleiner,
damit auf 1024 × 768 Uhr, Antworten und Prüfen ohne Scrollen passen (gemessen: Unterkante 748 px).

### D25 · Reproduzierbare Aufgaben
`?seed=123` in der URL macht den Zufall deterministisch – für E2E-Tests und Fehlerberichte.
Ohne Parameter: `Math.random`.

### D26 · Playwright mit Chromium-Headless-Shell
Auf dem Rechner ist kein Chrome installiert; Playwright lädt seine eigene Chromium-Headless-Shell.
Projekte: Tablet (768 × 1024, Touch) und Phone (375 × 812, Touch).

## Nach M3: Rückmeldung aus dem Test (2026-10-25)

### D27 · Tack und Sprechblase stehen unter der Uhr, nie darauf
**Abweichung von der Vorgabe** („Tack sitzt rechts oben auf der Uhrfläche“), auf Wunsch nach
dem ersten Test: Tack und Blase verdeckten Teile der Uhr. Jetzt hat Tack eine eigene Zeile
direkt unter der Uhr – Blase links (Zipfel zu Tack), Tack rechts, Größen wie vorgegeben.
Der vollständige Tipp bzw. die Erklärung (als Liste) steht in der Blase; die Tipp-Karte aus D21
entfällt. Ein E2E-Check (`expectClockUncovered`) prüft auf Tablet und Phone, dass sich
Uhr und Tack-Zeile nicht überlappen.
**Folge:** Bei Tipp/Erklärung wird die Seite höher. Hochformat-Tablet passt (fast) ohne Scrollen;
auf dem Phone und im Tablet-Querformat (1024 × 768) muss für den Hauptknopf gescrollt werden
(Querformat Tipp: Antworten enden bei 806 px, Seite 894 px). Querformat gelöst in D28.

### D28 · Kompaktes Querformat (auf Wunsch)
Bei `orientation: landscape` und Höhe ≤ 820 px (Tablet quer, kleine Laptops):
- Uhr höchstens **34 vh** (≈ 261 px auf 1024 × 768) statt 55 vh – **Abweichung von der Vorgabe**.
- Tack **64 px** statt 104 px – **Abweichung von der Vorgabe**.
- Antwort- und Hauptknöpfe in Mindesthöhe 56 px (Berührfläche bleibt erfüllt), knappere Abstände.
- In der Erklärungsphase ist „Wie spät ist es?“ nur noch für Screenreader da (die Frage ist
  beantwortet); die Schritte in der Blase stehen ohne Zusatzabstand. Gilt in allen Formaten.
Gemessen auf 1024 × 768: mit Tipp und mit Erklärung liegen Uhr, Tack-Zeile, alle vier Antworten
und der Hauptknopf ohne Scrollen im Bild. Abgesichert durch das Playwright-Projekt
`tablet-landscape` (`e2e/landscape.spec.ts`), auch für die längsten Erklärungen aus Level 5.
Hochformat und Phone bleiben unverändert (Phone braucht bei Tipp/Erklärung weiter etwas Scrollen).

## Meilenstein 4 (2026-10-25)

### D29 · Aufgabenarten der Level 6–8
- **Level 6 – Analog und digital:** Uhr lesen, antworten in Digitalform („4:30“), jede Minute.
  Tipps sprechen digital („Digital zählt die 4“) statt von „halb“.
- **Level 7 – Zeiger stellen:** Digitalzeit vorgegeben, Kind stellt die interaktive Uhr
  (Ziehen per Touch/Maus oder Pfeiltasten), Fünf-Minuten-Raster. Start bei 12:00 (bei Ziel 12:00: 6:00).
  Richtig ist jede Stellung mit gleichem Zifferblatt (4:30 = 16:30). Nach zwei Fehlversuchen
  zeigt die Uhr die Lösung und ist nicht mehr stellbar.
- **Level 8 – Zeit in Worten:** „Welche Uhr zeigt „fünf vor halb elf“?“ – vier kleine Uhren als
  Antworten, nur Fünferschritte. Die Wortvariante aus den Eltern-Einstellungen gilt überall.
- Alle Arten teilen sich Sitzung, Tipps, Erklärung, Sterne und Freischalten (`question.kind`).

### D30 · Kleine Uhren ohne Zahlen
Als Antwortoptionen (Level 8) sind die Uhren 112 / 168 / 88 px groß (Phone / Tablet / Querformat).
Ziffern wären dort kleiner als die Mindestschrift von 16 px. Deshalb `compact`: keine Zahlen,
dafür längere, kräftigere Striche bei 12, 3, 6 und 9 zur Orientierung (auch auf der großen Uhr
etwas kräftiger). Screenreader bekommen die Zeigerbeschreibung, nicht die Lösung.

### D31 · Eltern-Hürde und Eltern-Bereich
- Erreichbar über „Für Eltern“ unten in der Levelauswahl (`#/eltern`).
- Hürde: Einmaleins-Aufgabe mit Faktoren 6–9 als Texteingabe. Für Kinder von 6–8 meist zu schwer,
  für Erwachsene trivial; nach falscher Antwort neue Aufgabe. **Keine Sicherheitsfunktion**,
  nur Schutz vor versehentlichem Umstellen. Wird bei jedem Besuch neu verlangt.
- Inhalt: Wortvariante (mit Beispiel 10:45), Fortschritt zurücksetzen (mit Bestätigung),
  Datenschutzhinweis. Externe Links gibt es weiterhin keine.
- Ausnahme von „keine Rahmenlinien“: Das Eingabefeld hat eine 2-px-Linie in Ink weich, weil
  Eingabefelder eine erkennbare Grenze brauchen (WCAG 1.4.11, Kontrast ≥ 3:1).

### D32 · Speichern
`ProgressStorage`-Interface (`load`, `save`, `clear`) mit `LocalStorageProgressStorage`
(Schlüssel `eulenzeit:v1`) und `MemoryProgressStorage` für Tests. Gespeichert werden nur
Fortschritt je Level (Serie, Sterne, geschafft), höchstes freigeschaltetes Level und die Wortvariante –
keine personenbezogenen Daten. Gelesene Daten werden streng geprüft (Version, Wertebereiche);
Kaputtes wird verworfen. Fehler beim Speichern (privater Modus, voller Speicher) stoppen die App
nie. Der Store speichert bei jeder Änderung von Fortschritt oder Einstellungen.
Die laufende Aufgabe wird bewusst nicht gespeichert: Nach dem Neuladen beginnt eine neue.

## Meilenstein 5 (2026-10-25)

### D33 · ~~PWA: Offline, Updates, Install-Hinweis~~ (abgelöst durch D38)
- `vite-plugin-pwa` (Workbox, generateSW). Vorab gespeichert: HTML, JS, CSS, Icons und die
  woff2-Schriften (22 Dateien, ≈ 418 KiB). Danach läuft die App komplett offline.
- Updates mit `registerType: 'prompt'` **ohne** Hinweis: Eine neue Version wartet, bis die App
  geschlossen wurde, und ist beim nächsten Start aktiv. So lädt die App nie mitten in einer Aufgabe neu.
- Der Install-Prompt des Browsers wird abgefangen (`beforeinstallprompt`) und erst angeboten,
  wenn mindestens eine Runde (5 in Folge) geschafft ist – als ruhige Karte in der Levelauswahl und
  auf dem Belohnungs-Screen, nie als Pop-up und nie in einer Aufgabe. „Nicht jetzt“ wird gespeichert.
- Safari/iOS kennt das Ereignis nicht; dort bleibt „Zum Home-Bildschirm“ im Teilen-Menü
  (Apple-Touch-Icon und App-Titel sind gesetzt).

### D34 · Datenschutz technisch abgesichert
- Content-Security-Policy im Build (`default-src 'self'`, `connect-src 'self'`, keine fremden
  Skripte/Schriften/Bilder), `referrer: no-referrer`.
- Ein E2E-Test im Produktions-Build zeichnet alle Requests eines Durchlaufs auf (Levelauswahl,
  Aufgabe, Eltern-Bereich) und erwartet **null** fremde Origins, **keine Cookies** und genau einen
  localStorage-Schlüssel (`eulenzeit:v1`).

### D35 · Accessibility-Durchgang
- axe-core (WCAG 2.0/2.1/2.2 A+AA + Best Practices) auf allen Bildschirmen und Zuständen
  (Frage, Tipp, Nicht ganz, Erklärung, Richtig, Belohnung, Level 6–8, Eltern-Hürde inkl. Fehler,
  Einstellungen, Komponentenseite) in drei Gerätegrößen: 0 Verstöße.
- Gefunden und behoben: Der Sternzähler hatte `aria-label` auf einem `<p>` ohne Rolle
  (wird teils ignoriert) → `role="img"`.
- Ergänzend getestet: kein seitliches Scrollen bei 320 px (WCAG 1.4.10), keine laufenden
  Animationen bei „Bewegung reduzieren“, Seitentitel je Bildschirm (WCAG 2.4.2, neu eingebaut).
- axe misst erst nach Ende von Einblendungen; während des 250-ms-Fades wäre der Kontrast scheinbar zu niedrig.
- Nicht automatisiert prüfbar und **noch offen**: Test mit echtem Screenreader (VoiceOver/TalkBack)
  und mit Kindern.

### D36 · Lighthouse und die PWA-Kategorie (PWA-Teil abgelöst durch D38)
Lighthouse 12+ hat die Kategorie „PWA“ entfernt; ein PWA-Score ≥ 95 lässt sich nicht mehr messen.
Ersatz: automatisierte Prüfung der Installierbarkeits-Kriterien im Produktions-Build
(Manifest mit Name, Sprache, `display: standalone`, Icons 192/512/maskable erreichbar; Service
Worker übernimmt; App startet offline inkl. Schriften). Lighthouse misst Performance,
Accessibility, Best Practices und SEO (`npm run lighthouse`, Ergebnisse im README).
`robots.txt` ergänzt (sonst SEO 91).

### D37 · ~~App-Icons~~ (abgelöst durch D38, nur noch Favicon)
Erzeugt aus Tacks SVG mit Playwrights Chromium (`npm run icons`): 192, 512, maskable 512
(Tack in der sicheren Zone) und Apple-Touch-Icon 180, Hintergrund Lavendel-Tint. Werden mit den
Original-Assets neu erzeugt, sobald diese vorliegen (siehe D1).

## Nach dem Test durch den Auftraggeber (2026-10-25)

### D38 · Keine Installation – reine Online-Anwendung
**Änderung der Vorgabe** („PWA, offlinefähig, installierbar“) auf Wunsch des Auftraggebers:
Kinder sollen nichts installieren können, ohne dass Eltern es erlauben; eine Online-Anwendung reicht.
- Entfernt: Install-Hinweis, Abfangen von `beforeinstallprompt`, Web-App-Manifest, Service Worker
  (`vite-plugin-pwa`), App-Icons, Apple-Touch-Icon. Ohne Manifest bieten Browser auch von sich aus
  keine Installation an (Adressleiste/Mini-Infoleiste).
- CSP verbietet beides zusätzlich: `manifest-src 'none'`, `worker-src 'none'`.
- Folge: kein Offline-Betrieb mehr; die App braucht beim Öffnen eine Verbindung. Lernfortschritt
  bleibt wie bisher lokal gespeichert.
- Abgesichert: `e2e/production.spec.ts` prüft im Produktions-Build, dass kein Manifest verlinkt,
  kein Service Worker registriert und kein Installieren-Knopf vorhanden ist.
- Bleibt möglich (bewusste Eltern-Handlung, nicht von der App angeboten): „Zum Home-Bildschirm“
  bzw. „Verknüpfung erstellen“ über das Browser-Menü. Das öffnet dann einfach die Webseite.

### D39 · Zahlen 12, 3, 6, 9 weiter innen
**Abweichung von der Vorgabe** („Zahlen 1–12 auf gleichem Radius 68“): Die großen Zahlen 12, 3, 6, 9
standen zu dicht an ihren (seit D30 längeren) Strichen. Jetzt: große Zahlen auf Radius 62, ihre
Striche beginnen bei 78 (vorher 76) → gemessen rund 8 Einheiten Luft (≈ 13 px bei 400-px-Uhr).
Die übrigen Zahlen bleiben auf 68. Der Stundenzeiger ist 46 statt 50 lang, damit er die nach innen
gerückte 12 nicht berührt; er bleibt deutlich kürzer als der Minutenzeiger (82).

## Veröffentlichung (2026-10-25)

### D40 · Hosting auf GitHub Pages
- Der Workflow `.github/workflows/deploy.yml` läuft bei jedem Push auf `main`:
  Typecheck → Unit-Tests → E2E (Playwright) → Build → Veröffentlichung. Schlägt ein Test fehl,
  wird nichts veröffentlicht (Playwright-Spuren liegen dann 7 Tage als Artefakt bereit).
- Unterpfad: Pages liefert unter `https://<name>.github.io/<repository>/` aus. `vite.config.ts` liest
  dafür `BASE_PATH` (der Workflow setzt ihn aus dem Repository-Namen); lokal bleibt es `/`.
  Das E2E-Projekt `subpath` baut mit `/eulenzeit/` und prüft, dass alles unter dem Unterpfad lädt.
- Privates Familienprojekt: `robots.txt` mit `Disallow: /` und `<meta name="robots" content="noindex, nofollow">`.
  Lighthouse wertet das bei SEO bewusst ab („nicht indexierbar“); Performance/Accessibility unverändert.
- Datenschutz: Die App selbst trackt nichts; GitHub (Microsoft, USA) protokolliert als Hoster technisch
  bedingt IP-Adressen, setzt aber keine Cookies. Für eine öffentliche Nutzung durch Dritte wären
  Impressum/Datenschutzerklärung zu prüfen (keine Rechtsberatung).
