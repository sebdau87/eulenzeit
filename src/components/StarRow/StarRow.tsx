import { Icon } from '../Icon/Icon';
import styles from './StarRow.module.css';

export interface StarRowProps {
  earned: number;
  total?: number;
}

export function StarRow({ earned, total = 5 }: StarRowProps) {
  const safeTotal = Math.max(0, Math.floor(total));
  const filled = Math.min(Math.max(0, Math.floor(earned)), safeTotal);
  const label = `${filled} von ${safeTotal} ${safeTotal === 1 ? 'Stern' : 'Sternen'}`;
  return (
    <div className={styles.row} role="img" aria-label={label}>
      {Array.from({ length: safeTotal }, (_, i) => (
        <Icon
          key={i}
          name="star"
          className={i < filled ? styles.filled : styles.empty}
          data-filled={i < filled}
        />
      ))}
    </div>
  );
}
