import { timeToGermanWords, type WordVariant } from '../../domain/words';
import styles from './TimeInWords.module.css';

export interface TimeInWordsProps {
  hour: number;
  minute: number;
  variant?: WordVariant;
  className?: string | undefined;
}

/** Uhrzeit in Worten, z. B. „fünf vor halb elf“. */
export function TimeInWords({ hour, minute, variant = 'standard', className }: TimeInWordsProps) {
  return (
    <p className={[styles.words, className].filter(Boolean).join(' ')} data-variant={variant}>
      {timeToGermanWords({ hour, minute }, { variant })}
    </p>
  );
}
