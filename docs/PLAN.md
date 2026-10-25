# Eulenzeit – Plan

## Architektur

Reine Client-App (React 19 + TypeScript strict + Vite), kein Backend. Drei Schichten mit
klarer Abhängigkeitsrichtung **UI → Store → Domain**:

| Schicht | Inhalt | Abhängigkeiten |
| --- | --- | --- |
| `domain/` | Reine Funktionen: Zeiterzeugung je Level, `timeToGermanWords`, Zeigerwinkel, Antwortgenerator (Distraktoren), Freischaltregeln | keine (kein React, kein DOM) |
| `store/` | Zustand-Store für die Lernrunde und den Fortschritt | `domain/`, `storage/` |
| `storage/` | `ProgressStorage`-Interface + `LocalStorageProgressStorage` (+ In-Memory für Tests) | keine |
| `components/` | Präsentationskomponenten des Designsystems, zustandslos bzw. nur UI-State | `design/` |
| `screens/` | Frage, Nicht ganz richtig, Richtig, Levelauswahl, Belohnung | alle oben |
| `design/` | `tokens.css` (einzige Quelle für Rohwerte), globale Styles, Schriften | – |

Routing: minimaler Hash-Router (`#/`, `#/komponenten`, später `#/level/3`) ohne Bibliothek –
funktioniert offline und auf jedem statischen Host.

## Ordnerstruktur

```
docs/                 PLAN, DECISIONS
public/               favicon, robots.txt
scripts/              Favicon erzeugen, Lighthouse messen
src/
  app/                App, Routing, Start
  components/         je Komponente: X.tsx, X.module.css, X.test.tsx
  design/             tokens.css, global.css, fonts.ts, contrast.ts (+ Tests)
  domain/             time, words, clockMath, levels, questions, hints, session, parentGate, random (+ Tests)
  storage/            ProgressStorage-Interface, localStorage- und Speicher-Implementierung
  store/              Zustand-Store (dünne Hülle um domain/session)
  screens/            Levelauswahl, Aufgabe (alle Arten, inkl. Feedback), Belohnung, Eltern-Bereich
  showcase/           Komponentenseite (#/komponenten, lazy geladen)
  test/               Test-Setup
e2e/                  Playwright-Kernabläufe
```

## Meilensteine

1. **Setup, Tokens, Basiskomponenten, Komponentenseite** – ✅ erledigt
2. **AnalogClock, DigitalTime, TimeInWords** inkl. `timeToGermanWords`, Zeigerwinkel, Unit-Tests – ✅ erledigt (interaktive Uhr mit Pointer + Tastatur bereits enthalten)
3. **Lernschleife Level 1–5**: Aufgaben- und Antwortgenerator mit typischen Verwechslungen, Frage / Nicht ganz richtig / Erklärung / Richtig, Tack auf der Uhr, Levelauswahl, Belohnung, Playwright – ✅ erledigt
4. **Level 6–8** (Uhr → digital, Zeiger stellen, Worte → Uhr), Fortschritt über `ProgressStorage` speichern, Eltern-Bereich mit Hürde und Wortvariante – ✅ erledigt
5. ~~PWA~~ (nach Test entfernt, D38), CSP, Accessibility-Durchgang (axe + Ergänzungen), Lighthouse, Politur – ✅ erledigt
