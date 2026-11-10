import { useEffect, useRef } from 'react';
import { BUILD_STAND } from '../buildInfo';
import { Button, ScreenColumn, Tack } from '../components';
import styles from './AboutScreen.module.css';

export interface AboutScreenProps {
  onBack: () => void;
}

export function AboutScreen({ onBack }: AboutScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <ScreenColumn className={styles.screen}>
      {/* Dekorativ: Der Text darunter nennt Tack. Schweben am Wrapper, Blinzeln wie in den Übungen. */}
      <div className={styles.tack} data-testid="about-tack">
        <Tack />
      </div>
      <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
        Über Eulenzeit
      </h1>

      <section className={styles.card}>
        <p>Mit Eulenzeit lernen Kinder die Uhr zu lesen – zusammen mit Tack, der Eule.</p>
        <p>
          Eulenzeit ist ein Lernprojekt von Sebastian, um das Arbeiten mit Claude Code zu lernen, einem
          KI-Programmierassistenten von Anthropic. Die App wurde von Claude Code erstellt.
        </p>
        <p className={styles.stand}>Stand: {BUILD_STAND}</p>
      </section>

      <Button variant="secondary" icon="back" fullWidth onClick={onBack}>
        Zurück zu den Levels
      </Button>
    </ScreenColumn>
  );
}
