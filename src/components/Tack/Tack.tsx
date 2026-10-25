import styles from './Tack.module.css';

export type TackPlumage = 'lavendel' | 'sonne' | 'minze';

export interface TackProps {
  /** lavendel = normal, sonne = gibt einen Tipp, minze = freut sich (Bogenaugen). */
  plumage?: TackPlumage;
  /**
   * Zugänglicher Name. Ohne label ist Tack dekorativ (aria-hidden),
   * weil die Sprechblase daneben den Inhalt trägt.
   */
  label?: string;
  /** Blinzeln an/aus; prefers-reduced-motion schaltet es ohnehin ab. */
  blink?: boolean;
  className?: string | undefined;
}

/**
 * Tack, die Eule. Schnabel, Füße, Bäckchen und Bauch bleiben in allen
 * Gefiedern gleich; nur der Körper wechselt die Farbe.
 * Größe kommt aus --tack-size (Phone 84 / Tablet 104 / Desktop 96 px).
 */
export function Tack({ plumage = 'lavendel', label, blink = true, className }: TackProps) {
  const happy = plumage === 'minze';
  const classes = [styles.tack, styles[plumage], className].filter(Boolean).join(' ');
  return (
    <svg
      viewBox="0 0 120 120"
      className={classes}
      data-plumage={plumage}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {/* Füße */}
      <g className={styles.orange}>
        <ellipse cx="47" cy="112" rx="8" ry="4.5" />
        <ellipse cx="73" cy="112" rx="8" ry="4.5" />
      </g>

      {/* Körper mit Federohren */}
      <path
        className={styles.body}
        d="M21 52 C21 32 24 17 30 9 L46 24 C52 22 68 22 74 24 L90 9 C96 17 99 32 99 52 L99 74 C99 98 82 111 60 111 C38 111 21 98 21 74 Z"
      />

      {/* Bauch */}
      <ellipse className={styles.belly} cx="60" cy="86" rx="26" ry="21" />
      <g className={styles.feathers}>
        <path d="M47 81 q4.5 4 9 0" />
        <path d="M64 81 q4.5 4 9 0" />
        <path d="M55.5 92 q4.5 4 9 0" />
      </g>

      {/* Bäckchen */}
      <g className={styles.cheek}>
        <ellipse cx="27" cy="66" rx="7" ry="4.5" />
        <ellipse cx="93" cy="66" rx="7" ry="4.5" />
      </g>

      {/* Augen */}
      <g className={styles.eyeWhite}>
        <circle cx="42" cy="49" r="15" />
        <circle cx="78" cy="49" r="15" />
      </g>
      {happy ? (
        <g className={styles.happyEyes} data-eyes="bogen">
          <path d="M33 53 Q42 40 51 53" />
          <path d="M69 53 Q78 40 87 53" />
        </g>
      ) : (
        <g className={[styles.pupils, blink && styles.blink].filter(Boolean).join(' ')} data-eyes="punkt">
          <circle cx="44" cy="51" r="7.5" />
          <circle cx="76" cy="51" r="7.5" />
          <circle className={styles.glint} cx="46.5" cy="48" r="2.2" />
          <circle className={styles.glint} cx="78.5" cy="48" r="2.2" />
        </g>
      )}

      {/* Schnabel */}
      <path className={styles.orange} d="M52.5 60 Q60 56.5 67.5 60 L61.3 70.5 Q60 72.5 58.7 70.5 Z" />
    </svg>
  );
}
