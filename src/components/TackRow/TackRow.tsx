import type { ReactNode } from 'react';
import { SpeechBubble } from '../SpeechBubble/SpeechBubble';
import { Tack, type TackPlumage } from '../Tack/Tack';
import styles from './TackRow.module.css';

export interface TackRowProps {
  /** sonne = Tipp, minze = Lob. */
  plumage: Exclude<TackPlumage, 'lavendel'>;
  children: ReactNode;
}

/** Tack mit Sprechblase in einer eigenen Zeile: Blase links (Zipfel zu Tack), Tack rechts. */
export function TackRow({ plumage, children }: TackRowProps) {
  return (
    <div className={styles.row} data-testid="tack-helper" data-mood={plumage}>
      <SpeechBubble tone={plumage === 'sonne' ? 'tip' : 'praise'} className={styles.bubble}>
        {children}
      </SpeechBubble>
      <Tack plumage={plumage} />
    </div>
  );
}
