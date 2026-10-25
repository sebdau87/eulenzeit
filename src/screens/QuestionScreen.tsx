import { useEffect, useRef, type ReactNode } from 'react';
import {
  AnalogClock,
  AnswerOption,
  Button,
  ClockStage,
  DigitalTime,
  Icon,
  ProgressBar,
  ScreenColumn,
  TackRow,
  type AnswerState,
} from '../components';
import { getLevel, STREAK_TO_UNLOCK } from '../domain/levels';
import { levelProgress, type Progress, type Session } from '../domain/session';
import { formatDigital, type ClockTime } from '../domain/time';
import { describeClockHands, timeToGermanWords } from '../domain/words';
import styles from './QuestionScreen.module.css';

export interface QuestionScreenProps {
  session: Session;
  progress: Progress;
  onSelect: (index: number) => void;
  onDial: (time: ClockTime) => void;
  onHint: () => void;
  onCheck: () => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Ein Screen für Frage, „Nicht ganz richtig“, Erklärung und „Richtig“ – für alle Aufgabenarten:
 * Uhr → Worte (Level 1–5), Uhr → digital (6), Zeiger stellen (7), Worte → Uhr (8).
 * Der Hauptknopf bleibt dasselbe Element (Prüfen → Weiter), damit der Tastaturfokus nicht springt.
 */
export function QuestionScreen({
  session,
  progress,
  onSelect,
  onDial,
  onHint,
  onCheck,
  onNext,
  onBack,
}: QuestionScreenProps) {
  const { question, phase, selected, wrong, tack, explanation, variant } = session;
  const { kind } = question;
  const level = getLevel(session.level);
  const lp = levelProgress(progress, session.level);
  const done = phase === 'correct' || phase === 'explained';
  const isDial = kind === 'digital-to-clock';
  const promptRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Neue Aufgabe: Fokus auf die Frage, damit Screenreader sie ansagen und Tab vorne beginnt.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    promptRef.current?.focus();
  }, [question]);

  const stateFor = (i: number): AnswerState => {
    if (wrong.includes(i)) return 'wrong';
    if (done && i === question.correctIndex) return 'correct';
    if (selected === i) return 'selected';
    return 'normal';
  };

  const announcement =
    phase === 'retry'
      ? `Nicht ganz. ${tack?.detail ?? ''} Versuch es noch mal.`
      : phase === 'explained'
        ? explanation?.join(' ')
        : [tack?.text, tack?.detail].filter(Boolean).join(' ');

  const tackMessage: ReactNode = tack && (
    <>
      <span className={tack.detail || explanation ? styles.bubbleLead : undefined}>{tack.text}</span>
      {tack.detail && !explanation && <span className={styles.bubbleDetail}>{tack.detail}</span>}
      {explanation && (
        <ol className={styles.explain} aria-label="So geht es">
          {explanation.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </>
  );
  const tackProp = tack ? { plumage: tack.mood === 'praise' ? ('minze' as const) : ('sonne' as const), message: tackMessage } : null;

  // In der Erklärung ist die Frage beantwortet: nur noch für Screenreader, spart Höhe (D28).
  const promptClass = phase === 'explained' ? 'visually-hidden' : styles.prompt;
  const prompt = (children: ReactNode) => (
    <h1 id="prompt" ref={promptRef} tabIndex={-1} className={promptClass}>
      {children}
    </h1>
  );

  const optionContent = (option: ClockTime) => {
    switch (kind) {
      case 'clock-to-digital':
        return formatDigital(option);
      case 'words-to-clock':
        return <AnalogClock hour={option.hour} minute={option.minute} compact ariaLabel={describeClockHands(option)} />;
      default:
        return timeToGermanWords(option, { variant });
    }
  };

  const answers = !isDial && (
    <div className={styles.answers} role="group" aria-labelledby="prompt">
      {question.options.map((option, i) => {
        const state = stateFor(i);
        return (
          <AnswerOption
            key={`${option.hour}:${option.minute}`}
            size={kind === 'clock-to-digital' ? 'time' : kind === 'words-to-clock' ? 'clock' : 'words'}
            state={state}
            disabled={done || state === 'wrong'}
            onClick={() => onSelect(i)}
          >
            {optionContent(option)}
          </AnswerOption>
        );
      })}
    </div>
  );

  let body: ReactNode;
  if (kind === 'digital-to-clock') {
    const shown = session.dialed ?? question.time;
    body = (
      <>
        {prompt(
          <>
            Stell die Uhr auf{' '}
            <DigitalTime hour={question.time.hour} minute={question.time.minute} className={styles.target} />
          </>,
        )}
        <ClockStage
          hour={shown.hour}
          minute={shown.minute}
          interactive={!done}
          snapMinutes={5}
          onChange={onDial}
          tack={tackProp}
          {...(done ? { ariaLabel: `Die Uhr zeigt ${formatDigital(shown)}.` } : {})}
        />
      </>
    );
  } else if (kind === 'words-to-clock') {
    body = (
      <>
        {prompt(
          <>
            Welche Uhr zeigt{' '}
            <span className={styles.target}>„{timeToGermanWords(question.time, { variant })}“?</span>
          </>,
        )}
        {tackProp && <TackRow plumage={tackProp.plumage}>{tackProp.message}</TackRow>}
        {answers}
      </>
    );
  } else {
    body = (
      <>
        <ClockStage
          hour={question.time.hour}
          minute={question.time.minute}
          ariaLabel={describeClockHands(question.time)}
          tack={tackProp}
        />
        {prompt('Wie spät ist es?')}
        {answers}
      </>
    );
  }

  return (
    <ScreenColumn className={styles.screen} data-kind={kind}>
      <header className={styles.topbar}>
        <Button variant="secondary" icon="back" iconOnly onClick={onBack}>
          Zur Levelauswahl
        </Button>
        <div className={styles.levelInfo}>
          <p className={styles.levelTitle}>
            Level {level.id} · {level.title}
          </p>
          <ProgressBar
            value={lp.streak}
            max={STREAK_TO_UNLOCK}
            label={`Level ${level.id}: richtige Antworten in Folge`}
          />
        </div>
        <p className={styles.stars} role="img" aria-label={`${lp.stars} ${lp.stars === 1 ? 'Stern' : 'Sterne'} in diesem Level`}>
          <Icon name="star" className={styles.starIcon} />
          <span aria-hidden="true">{lp.stars}</span>
        </p>
      </header>

      {body}

      <div className={styles.actions}>
        {phase === 'asking' && !session.hintUsed && (
          <Button variant="tip" icon="hint" onClick={onHint}>
            Tipp
          </Button>
        )}
        <Button
          className={styles.main}
          disabled={!done && !isDial && selected === null}
          onClick={done ? onNext : onCheck}
          icon={done ? 'arrow' : undefined}
        >
          {done ? (phase === 'explained' ? 'Verstanden, weiter' : 'Weiter') : 'Prüfen'}
        </Button>
      </div>

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </ScreenColumn>
  );
}
