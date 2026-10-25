import { formatDigital, toIsoTime, type DigitalFormat } from '../../domain/time';
import styles from './DigitalTime.module.css';

export interface DigitalTimeProps {
  hour: number;
  minute: number;
  format?: DigitalFormat;
  size?: 'large' | 'medium';
  /**
   * Farbbalken unter Stunde (Rose) und Minute (Himmel) – dieselben Farben wie die Zeiger.
   * Der Text selbst bleibt Ink.
   */
  colorCoded?: boolean;
  className?: string | undefined;
}

export function DigitalTime({
  hour,
  minute,
  format = '12h',
  size = 'large',
  colorCoded = true,
  className,
}: DigitalTimeProps) {
  const text = formatDigital({ hour, minute }, format);
  const [h, m] = text.split(':');
  const classes = [styles.time, styles[size], colorCoded && styles.colorCoded, className]
    .filter(Boolean)
    .join(' ');
  return (
    <time className={classes} dateTime={toIsoTime({ hour, minute })}>
      <span className={styles.hour} data-part="hour">
        {h}
      </span>
      <span className={styles.colon}>:</span>
      <span className={styles.minute} data-part="minute">
        {m}
      </span>
    </time>
  );
}
