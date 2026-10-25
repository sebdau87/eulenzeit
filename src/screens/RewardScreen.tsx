import { useEffect, useRef } from 'react';
import { Button, ScreenColumn, SpeechBubble, StarRow, Tack } from '../components';
import { getLevel, STREAK_TO_UNLOCK, type LevelId } from '../domain/levels';
import styles from './RewardScreen.module.css';

export interface RewardScreenProps {
  level: LevelId;
  /** Gerade freigeschaltetes Level, falls eins dazukam. */
  unlockedLevel: LevelId | null;
  onNextLevel: (level: LevelId) => void;
  onPracticeMore: () => void;
  onBack: () => void;
}

export function RewardScreen({ level, unlockedLevel, onNextLevel, onPracticeMore, onBack }: RewardScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  const unlocked = unlockedLevel ? getLevel(unlockedLevel) : null;
  const message = unlocked
    ? unlocked.playable
      ? `Level ${unlocked.id} ist jetzt frei!`
      : `Bald gibt es Level ${unlocked.id}.`
    : 'Noch eine Runde geschafft!';

  return (
    <ScreenColumn className={styles.screen}>
      <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
        Level {level} geschafft!
      </h1>
      <div className={styles.tackRow}>
        <SpeechBubble tone="praise">
          {STREAK_TO_UNLOCK} richtig hintereinander. {message}
        </SpeechBubble>
        <Tack plumage="minze" />
      </div>
      <StarRow earned={STREAK_TO_UNLOCK} total={STREAK_TO_UNLOCK} />
      <div className={styles.actions}>
        {unlocked?.playable && (
          <Button fullWidth icon="arrow" onClick={() => onNextLevel(unlocked.id)}>
            Weiter zu Level {unlocked.id}
          </Button>
        )}
        <Button variant={unlocked?.playable ? 'secondary' : 'primary'} fullWidth onClick={onPracticeMore}>
          Weiter üben
        </Button>
        <Button variant="secondary" fullWidth onClick={onBack}>
          Zur Levelauswahl
        </Button>
      </div>
    </ScreenColumn>
  );
}
