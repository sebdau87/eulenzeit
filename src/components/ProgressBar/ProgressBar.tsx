import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number;
  max: number;
  /** Wofür der Fortschritt steht, z. B. „Level 2“. */
  label: string;
  /** Sichtbarer Zähler „3 von 5“ (Standard: an). */
  showCount?: boolean;
}

export function clampProgress(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(Math.max(Math.round(value), 0), max);
}

export function ProgressBar({ value, max, label, showCount = true }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const current = clampProgress(value, safeMax);
  const percent = (current / safeMax) * 100;
  const valueText = `${current} von ${safeMax}`;
  return (
    <div className={styles.wrapper}>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={current}
        aria-valuetext={valueText}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      {showCount && (
        <span className={styles.count} aria-hidden="true">
          {valueText}
        </span>
      )}
    </div>
  );
}
