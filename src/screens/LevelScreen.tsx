import { useEffect } from 'react';
import { navigate } from '../app/useHashRoute';
import type { LevelId } from '../domain/levels';
import { isUnlocked } from '../domain/session';
import { useLearningStore } from '../store/learningStore';
import { QuestionScreen } from './QuestionScreen';
import { RewardScreen } from './RewardScreen';

/** Verbindet Store und Screens für ein Level. Gesperrte Level leiten zur Auswahl zurück. */
export function LevelScreen({ level }: { level: LevelId }) {
  const { session, progress, startLevel, select, dial, hint, check, next, leave } = useLearningStore();
  const allowed = isUnlocked(progress, level);

  useEffect(() => {
    if (!allowed) navigate({ name: 'levels' });
    else if (session?.level !== level) startLevel(level);
  }, [allowed, level, session?.level, startLevel]);

  if (!allowed || !session || session.level !== level) return null;

  const back = () => {
    leave();
    navigate({ name: 'levels' });
  };

  if (session.phase === 'reward') {
    return (
      <RewardScreen
        level={level}
        unlockedLevel={session.unlockedLevel}
        onNextLevel={(id) => navigate({ name: 'level', level: id })}
        onPracticeMore={next}
        onBack={back}
      />
    );
  }

  return (
    <QuestionScreen
      session={session}
      progress={progress}
      onSelect={select}
      onDial={dial}
      onHint={hint}
      onCheck={check}
      onNext={next}
      onBack={back}
    />
  );
}
