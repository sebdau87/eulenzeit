import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button, ScreenColumn } from '../components';
import { getLevel } from '../domain/levels';
import { checkChallenge, createChallenge, type GateChallenge } from '../domain/parentGate';
import { totalStars, type Progress } from '../domain/session';
import { timeToGermanWords, type WordVariant } from '../domain/words';
import type { Settings } from '../storage/progressStorage';
import styles from './ParentsScreen.module.css';

export interface ParentsScreenProps {
  progress: Progress;
  settings: Settings;
  /** Für die Eltern-Aufgabe; injizierbar für Tests. */
  challenge?: () => GateChallenge;
  onWordVariant: (variant: WordVariant) => void;
  onReset: () => void;
  onBack: () => void;
}

const EXAMPLE = { hour: 10, minute: 45 };
const VARIANTS: { value: WordVariant; label: string; hint: string }[] = [
  { value: 'standard', label: 'Viertel nach, Viertel vor', hint: 'Bundesweit üblich' },
  { value: 'ost', label: 'viertel, dreiviertel', hint: 'Ost- und Süddeutschland, Österreich' },
];

function Gate({ challenge, onPass, onBack }: { challenge: () => GateChallenge; onPass: () => void; onBack: () => void }) {
  const [task, setTask] = useState(challenge);
  const [value, setValue] = useState('');
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (checkChallenge(task, value)) {
      onPass();
      return;
    }
    setFailed(true);
    setTask(challenge());
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <form className={styles.card} onSubmit={submit} noValidate>
      <p>Dieser Bereich ist für Eltern. Bitte löse die Aufgabe.</p>
      <label htmlFor={inputId} className={styles.question}>
        Wie viel ist {task.a} × {task.b}?
      </label>
      <input
        ref={inputRef}
        id={inputId}
        className={styles.input}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={failed}
        aria-describedby={failed ? errorId : undefined}
      />
      {failed && (
        <p id={errorId} className={styles.hint} role="alert">
          Das stimmt nicht. Hier ist eine neue Aufgabe.
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" fullWidth>
          Weiter
        </Button>
        <Button variant="secondary" fullWidth onClick={onBack}>
          Zurück
        </Button>
      </div>
    </form>
  );
}

export function ParentsScreen({
  progress,
  settings,
  challenge = () => createChallenge(Math.random),
  onWordVariant,
  onReset,
  onBack,
}: ParentsScreenProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), [unlocked]);

  const stars = totalStars(progress);

  return (
    <ScreenColumn>
      <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
        Für Eltern
      </h1>

      {!unlocked ? (
        <Gate challenge={challenge} onPass={() => setUnlocked(true)} onBack={onBack} />
      ) : (
        <>
          <fieldset className={styles.card}>
            <legend className={styles.legend}>Zeit in Worten</legend>
            <p className={styles.hint}>So sagt Tack 10:45:</p>
            {VARIANTS.map((v) => (
              <label key={v.value} className={styles.option}>
                <input
                  type="radio"
                  name="wordVariant"
                  value={v.value}
                  checked={settings.wordVariant === v.value}
                  onChange={() => onWordVariant(v.value)}
                />
                <span>
                  <span className={styles.optionLabel}>
                    {v.label}: „{timeToGermanWords(EXAMPLE, { variant: v.value })}“
                  </span>
                  <span className={styles.hint}>{v.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <section className={styles.card} aria-labelledby="progress-heading">
            <h2 id="progress-heading" className={styles.legend}>
              Fortschritt
            </h2>
            <p>
              {stars} {stars === 1 ? 'Stern' : 'Sterne'} gesammelt, freigeschaltet bis Level {progress.unlocked} (
              {getLevel(progress.unlocked).title}).
            </p>
            {resetDone && (
              <p className={styles.hint} role="status">
                Der Fortschritt wurde zurückgesetzt.
              </p>
            )}
            {!confirmReset ? (
              <Button variant="secondary" onClick={() => setConfirmReset(true)}>
                Fortschritt zurücksetzen
              </Button>
            ) : (
              <div className={styles.confirm} role="group" aria-labelledby="confirm-text">
                <p id="confirm-text">Wirklich zurücksetzen? Alle Sterne und freigeschalteten Level gehen verloren.</p>
                <div className={styles.actions}>
                  <Button
                    onClick={() => {
                      onReset();
                      setConfirmReset(false);
                      setResetDone(true);
                    }}
                  >
                    Ja, zurücksetzen
                  </Button>
                  <Button variant="secondary" onClick={() => setConfirmReset(false)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className={styles.card} aria-labelledby="privacy-heading">
            <h2 id="privacy-heading" className={styles.legend}>
              Datenschutz
            </h2>
            <p>
              Eulenzeit speichert nur den Lernfortschritt und diese Einstellung – und zwar nur auf diesem Gerät. Es gibt
              keine Konten, kein Tracking, keine Werbung, und es werden keine Daten verschickt.
            </p>
          </section>

          <Button variant="secondary" icon="back" fullWidth onClick={onBack}>
            Zurück zu den Levels
          </Button>
        </>
      )}
    </ScreenColumn>
  );
}
