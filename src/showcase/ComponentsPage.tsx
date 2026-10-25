import { useState, type ReactNode } from 'react';
import { describeClockHands, type WordVariant } from '../domain/words';
import {
  AnalogClock,
  AnswerOption,
  Button,
  DigitalTime,
  ProgressBar,
  ScreenColumn,
  SpeechBubble,
  StarRow,
  Tack,
  TackRow,
  TimeInWords,
  type AnswerState,
  type TackPlumage,
} from '../components';
import styles from './ComponentsPage.module.css';

const palette = ['lavendel', 'sonne', 'rose', 'himmel', 'minze', 'pfirsich'] as const;
const neutrals = ['creme', 'weiss', 'sand', 'kante', 'ink', 'ink-weich'] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `sec-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

const tackStates: { plumage: TackPlumage; tone: 'neutral' | 'tip' | 'praise'; text: string }[] = [
  { plumage: 'lavendel', tone: 'neutral', text: 'Hallo, ich bin Tack!' },
  { plumage: 'sonne', tone: 'tip', text: 'Schau auf den kurzen Zeiger. Er zeigt die Stunde.' },
  { plumage: 'minze', tone: 'praise', text: 'Super, das ist richtig!' },
];

const answers = ['4:30', '6:20', '10:25', '5:50'];

export default function ComponentsPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [progress, setProgress] = useState(2);
  const correctIndex = 2;
  const [clock, setClock] = useState({ hour: 10, minute: 25 });
  const [snap, setSnap] = useState(5);
  const [variant, setVariant] = useState<WordVariant>('standard');

  const stateFor = (i: number): AnswerState => {
    if (selected !== i) return 'normal';
    if (!checked) return 'selected';
    return i === correctIndex ? 'correct' : 'wrong';
  };

  return (
    <ScreenColumn>
      <header className={styles.header}>
        <a className={styles.back} href="#/">
          Zurück zum Start
        </a>
        <h1>Komponenten</h1>
        <p className={styles.lead}>Arbeitsfläche für das Eulenzeit-Designsystem.</p>
      </header>

      <Section title="Uhr">
        <AnalogClock
          hour={clock.hour}
          minute={clock.minute}
          interactive
          snapMinutes={snap}
          onChange={setClock}
        />
        <div className={styles.readout}>
          <DigitalTime hour={clock.hour} minute={clock.minute} />
          <TimeInWords hour={clock.hour} minute={clock.minute} variant={variant} />
        </div>
        <p className={styles.hint}>{describeClockHands(clock)}</p>
        <div className={styles.row}>
          <Button variant={snap === 5 ? 'primary' : 'secondary'} aria-pressed={snap === 5} onClick={() => setSnap(5)}>
            5 Minuten
          </Button>
          <Button variant={snap === 1 ? 'primary' : 'secondary'} aria-pressed={snap === 1} onClick={() => setSnap(1)}>
            1 Minute
          </Button>
        </div>
        <div className={styles.row}>
          <Button
            variant={variant === 'standard' ? 'primary' : 'secondary'}
            aria-pressed={variant === 'standard'}
            onClick={() => setVariant('standard')}
          >
            Viertel vor
          </Button>
          <Button variant={variant === 'ost' ? 'primary' : 'secondary'} aria-pressed={variant === 'ost'} onClick={() => setVariant('ost')}>
            Dreiviertel
          </Button>
        </div>
        <p className={styles.hint}>Statisch (nicht ziehbar):</p>
        <div className={styles.grid}>
          <AnalogClock hour={4} minute={30} />
          <AnalogClock hour={11} minute={59} />
        </div>
      </Section>

      <Section title="Farben">
        <ul className={styles.swatches}>
          {palette.map((name) => (
            <li key={name} className={styles.swatchGroup}>
              <span className={styles.swatch} style={{ background: `var(--color-${name})` }} />
              <span className={styles.swatch} style={{ background: `var(--color-${name}-tint)` }} />
              <span className={styles.swatch} style={{ background: `var(--color-${name}-deep)` }} />
              <span className={styles.swatchLabel}>{name}</span>
            </li>
          ))}
          {neutrals.map((name) => (
            <li key={name} className={styles.swatchGroup}>
              <span className={styles.swatch} style={{ background: `var(--color-${name})` }} />
              <span className={styles.swatchLabel}>{name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typografie">
        <p className={styles.time}>10:25</p>
        <p className={styles.title}>Titel 40/48</p>
        <p className={styles.heading}>Überschrift 28/36</p>
        <p>Text 20/30 – Wie spät ist es?</p>
        <p className={styles.hint}>Hinweis 16/24 – kleinste Schrift</p>
      </Section>

      <Section title="Button">
        <div className={styles.stack}>
          <Button fullWidth>Prüfen</Button>
          <Button variant='secondary' fullWidth>
            Zurück
          </Button>
          <Button variant="tip" icon="hint" fullWidth>
            Tipp
          </Button>
          <Button disabled fullWidth>
            Prüfen
          </Button>
        </div>
      </Section>

      <Section title="AnswerOption">
        <div className={styles.grid}>
          {answers.map((a, i) => (
            <AnswerOption
              key={a}
              state={stateFor(i)}
              onClick={() => {
                setSelected(i);
                setChecked(false);
              }}
            >
              {a}
            </AnswerOption>
          ))}
        </div>
        <Button fullWidth disabled={selected === null || checked} onClick={() => setChecked(true)}>
          Prüfen
        </Button>
        <p className={styles.hint}>Alle Zustände:</p>
        <div className={styles.grid}>
          <AnswerOption>normal</AnswerOption>
          <AnswerOption state="selected">gewählt</AnswerOption>
          <AnswerOption state="correct">richtig</AnswerOption>
          <AnswerOption state="wrong">nochmal</AnswerOption>
        </div>
      </Section>

      <Section title="ProgressBar und StarRow">
        <ProgressBar value={progress} max={5} label="Level 1" />
        <StarRow earned={progress} />
        <div className={styles.row}>
          <Button variant='secondary' onClick={() => setProgress((p) => Math.max(0, p - 1))}>
            Weniger
          </Button>
          <Button variant='secondary' onClick={() => setProgress((p) => Math.min(5, p + 1))}>
            Mehr
          </Button>
        </div>
      </Section>

      <Section title="Tack und SpeechBubble">
        {tackStates.map(({ plumage, tone, text }) => (
          <div key={plumage} className={styles.tackRow}>
            <SpeechBubble tone={tone}>{text}</SpeechBubble>
            <Tack plumage={plumage} label={`Tack, Gefieder ${plumage}`} />
          </div>
        ))}
      </Section>

      <Section title="TackRow (unter der Uhr)">
        <TackRow plumage="sonne">
          <strong>Fast! Schau mal:</strong> Der kurze Zeiger zeigt die Stunde, der lange die Minuten.
        </TackRow>
        <TackRow plumage="minze">Genau, es ist fünf vor halb elf!</TackRow>
      </Section>

      <Section title="Kleine Uhren (Level 8)">
        <div className={styles.grid}>
          {[
            { hour: 10, minute: 25 },
            { hour: 5, minute: 50 },
          ].map((t, i) => (
            <AnswerOption key={i} size="clock" state={i === 0 ? 'correct' : 'wrong'}>
              <AnalogClock hour={t.hour} minute={t.minute} compact ariaLabel={describeClockHands(t)} />
            </AnswerOption>
          ))}
        </div>
      </Section>
    </ScreenColumn>
  );
}
