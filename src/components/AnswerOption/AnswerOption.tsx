import type { ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './AnswerOption.module.css';

export type AnswerState = 'normal' | 'selected' | 'correct' | 'wrong';

export interface AnswerOptionProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  state?: AnswerState;
  /** time = Uhrzeit (Fredoka), words = Zeit in Worten (Nunito, bricht um), clock = kleine Uhr. */
  size?: 'time' | 'words' | 'clock';
}

/**
 * Eine der vier Antwortoptionen. Der Zustand wird nie nur über Farbe gezeigt:
 * „ausgewählt“ über aria-pressed, „richtig“/„nochmal“ zusätzlich mit Icon + Textlabel.
 */
export function AnswerOption({
  state = 'normal',
  size = 'time',
  type = 'button',
  className,
  children,
  ...rest
}: AnswerOptionProps) {
  const classes = [styles.option, styles[state], size === 'words' && styles.words, size === 'clock' && styles.clockOption, className].filter(Boolean).join(' ');
  return (
    <button
      type={type}
      className={classes}
      aria-pressed={state === 'selected'}
      data-state={state}
      {...rest}
    >
      {state === 'correct' && (
        <span className={styles.badge}>
          <Icon name="check" label="richtig" />
        </span>
      )}
      {state === 'wrong' && (
        <span className={styles.badge}>
          <Icon name="retry" label="nicht ganz, nochmal" />
        </span>
      )}
      <span className={styles.content}>{children}</span>
    </button>
  );
}
