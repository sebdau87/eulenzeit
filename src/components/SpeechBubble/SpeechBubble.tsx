import type { ReactNode } from 'react';
import styles from './SpeechBubble.module.css';

export type SpeechBubbleTone = 'neutral' | 'tip' | 'praise';

export interface SpeechBubbleProps {
  tone?: SpeechBubbleTone;
  /** Seite, auf der der Sprecher sitzt. Tack sitzt rechts. */
  tail?: 'right' | 'none';
  children: ReactNode;
  className?: string | undefined;
}

export function SpeechBubble({
  tone = 'neutral',
  tail = 'right',
  children,
  className,
}: SpeechBubbleProps) {
  const classes = [styles.bubble, styles[tone], tail === 'right' && styles.tailRight, className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} data-tone={tone}>
      {children}
    </div>
  );
}
