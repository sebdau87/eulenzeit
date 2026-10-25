import { Button, Icon, ScreenColumn } from '../components';
import { LEVELS, STREAK_TO_UNLOCK, type LevelDef } from '../domain/levels';
import { isUnlocked, levelProgress, totalStars, type Progress } from '../domain/session';
import styles from './LevelSelectScreen.module.css';

export interface LevelSelectScreenProps {
  progress: Progress;
  onStart: (level: LevelDef['id']) => void;
  onParents: () => void;
}

function status(level: LevelDef, progress: Progress) {
  const lp = levelProgress(progress, level.id);
  if (!level.playable) return { kind: 'soon' as const, text: 'Kommt bald' };
  if (!isUnlocked(progress, level.id)) return { kind: 'locked' as const, text: 'Noch gesperrt' };
  if (lp.completed) return { kind: 'done' as const, text: `Geschafft · ${lp.stars} ${lp.stars === 1 ? 'Stern' : 'Sterne'}` };
  return { kind: 'open' as const, text: `${lp.streak} von ${STREAK_TO_UNLOCK} in Folge` };
}

export function LevelSelectScreen({ progress, onStart, onParents }: LevelSelectScreenProps) {
  const stars = totalStars(progress);
  return (
    <ScreenColumn>
      <header className={styles.header}>
        <h1>Eulenzeit</h1>
        <p className={styles.stars} role="img" aria-label={`${stars} ${stars === 1 ? 'Stern' : 'Sterne'} gesammelt`}>
          <Icon name="star" className={styles.starIcon} />
          <span aria-hidden="true">{stars}</span>
        </p>
      </header>
      <p className={styles.lead}>Wähle ein Level.</p>

      <ul className={styles.list}>
        {LEVELS.map((level) => {
          const s = status(level, progress);
          const available = s.kind === 'open' || s.kind === 'done';
          return (
            <li key={level.id}>
              <button
                type="button"
                className={styles.card}
                data-status={s.kind}
                aria-disabled={!available}
                aria-describedby={`level-${level.id}-status`}
                onClick={() => available && onStart(level.id)}
              >
                <span className={styles.number} aria-hidden="true">
                  {level.id}
                </span>
                <span className={styles.text}>
                  <span className={styles.title}>
                    <span className="visually-hidden">Level {level.id}: </span>
                    {level.title}
                  </span>
                  <span className={styles.description}>{level.description}</span>
                  <span id={`level-${level.id}-status`} className={styles.status}>
                    {s.kind === 'done' && <Icon name="check" className={styles.doneIcon} />}
                    {(s.kind === 'locked' || s.kind === 'soon') && <Icon name="lock" />}
                    {s.text}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Button variant="secondary" className={styles.parents} onClick={onParents}>
        Für Eltern
      </Button>
    </ScreenColumn>
  );
}
