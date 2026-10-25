import type { HTMLAttributes } from 'react';
import styles from './ScreenColumn.module.css';

/**
 * Zentrierte Einspaltenfläche für alle Screens:
 * Phone volle Breite mit 20 px Rand, Tablet max. 600 px, Desktop max. 560 px.
 */
export function ScreenColumn({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <main className={[styles.column, className].filter(Boolean).join(' ')} {...rest} />;
}
