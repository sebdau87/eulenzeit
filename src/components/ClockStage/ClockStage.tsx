import type { ReactNode } from 'react';
import { AnalogClock, type AnalogClockProps } from '../AnalogClock/AnalogClock';
import type { TackPlumage } from '../Tack/Tack';
import { TackRow } from '../TackRow/TackRow';
import styles from './ClockStage.module.css';

export interface ClockStageProps extends AnalogClockProps {
  /** Tack erscheint nur bei Tipp (sonne) und Lob (minze). */
  tack?: { plumage: Exclude<TackPlumage, 'lavendel'>; message: ReactNode } | null;
}

/**
 * Uhr mit Tack. Tack und Sprechblase stehen in einer eigenen Zeile unter der Uhr,
 * damit die Uhr nie verdeckt wird (DECISIONS D27).
 */
export function ClockStage({ tack, className, ...clock }: ClockStageProps) {
  return (
    <div className={[styles.stage, className].filter(Boolean).join(' ')}>
      <AnalogClock {...clock} />
      {tack && <TackRow plumage={tack.plumage}>{tack.message}</TackRow>}
    </div>
  );
}
