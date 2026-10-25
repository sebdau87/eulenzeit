import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import {
  angleToHour12,
  angleToMinute,
  CLOCK,
  hourHandAngle,
  minuteHandAngle,
  pickHand,
  pointToPolar,
  polarToCartesian,
  setHour12,
  setMinuteWithWrap,
  stepMinute,
  type Hand,
} from '../../domain/clockMath';
import { to12h, type ClockTime } from '../../domain/time';
import { timeToGermanWords } from '../../domain/words';
import styles from './AnalogClock.module.css';

export interface AnalogClockProps {
  /** 0–23 */
  hour: number;
  /** 0–59 */
  minute: number;
  /** Zeiger per Pointer (Maus, Touch, Stift) und Tastatur stellen. */
  interactive?: boolean;
  /** Nur bei interactive: wird mit der neuen Zeit aufgerufen. */
  onChange?: (time: ClockTime) => void;
  /** Einrasten der Minuten (5 = Fünf-Minuten-Schritte, 1 = jede Minute). */
  snapMinutes?: number;
  /**
   * Textliche Entsprechung. Standard: die Zeit in Worten („halb fünf“).
   * In Aufgaben describeClockHands() übergeben, damit die Lösung nicht vorgelesen wird.
   */
  ariaLabel?: string;
  /**
   * Kleine Uhr ohne Zahlen (nur Striche und Punkte), z. B. als Antwortoption.
   * Zahlen wären dort kleiner als die Mindestschrift von 16 px (DECISIONS D30).
   */
  compact?: boolean;
  className?: string | undefined;
}

const { size, center: c } = CLOCK;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const MAJOR = new Set([12, 3, 6, 9]);

function handLine(angle: number, length: number) {
  const tip = polarToCartesian(angle, length);
  const tail = polarToCartesian(angle + 180, CLOCK.handTail);
  return { x1: tail.x, y1: tail.y, x2: tip.x, y2: tip.y, tip };
}

export function AnalogClock({
  hour,
  minute,
  interactive = false,
  onChange,
  snapMinutes = 5,
  ariaLabel,
  compact = false,
  className,
}: AnalogClockProps) {
  const dragging = useRef<Hand | null>(null);
  // Während eines Drags kommen Pointer-Events schneller als neue Props: letzte Zeit merken.
  const latest = useRef<ClockTime>({ hour, minute });
  latest.current = dragging.current ? latest.current : { hour, minute };

  const hourAngle = hourHandAngle(hour, minute);
  const minuteAngle = minuteHandAngle(minute);
  const hourHand = handLine(hourAngle, CLOCK.hourHandLength);
  const minuteHand = handLine(minuteAngle, CLOCK.minuteHandLength);
  const label = ariaLabel ?? timeToGermanWords({ hour, minute });

  const emit = (next: ClockTime) => {
    const prev = latest.current;
    if (prev.hour === next.hour && prev.minute === next.minute) return;
    latest.current = next;
    onChange?.(next);
  };

  const toSvgPoint = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = rect.width > 0 ? size / rect.width : 1;
    return pointToPolar((e.clientX - rect.left) * scale, (e.clientY - rect.top) * scale);
  };

  const applyDrag = (hand: Hand, angle: number) => {
    const t = latest.current;
    if (hand === 'minute') emit(setMinuteWithWrap(t, angleToMinute(angle, snapMinutes)));
    else emit(setHour12(t, angleToHour12(angle, t.minute)));
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive || e.button > 0) return;
    const { angle, distance } = toSvgPoint(e);
    const hand = pickHand(angle, distance, latest.current);
    dragging.current = hand;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    (e.currentTarget.querySelector(`[data-hand="${hand}"]`) as SVGElement | null)?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
    e.preventDefault();
    applyDrag(hand, angle);
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    applyDrag(dragging.current, toSvgPoint(e).angle);
  };

  const endDrag = (e: PointerEvent<SVGSVGElement>) => {
    dragging.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const onKeyDown = (hand: Hand) => (e: KeyboardEvent<SVGGElement>) => {
    const dir = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key] as 1 | -1 | undefined;
    if (dir === undefined) return;
    e.preventDefault();
    const t = latest.current;
    emit(hand === 'hour' ? setHour12(t, to12h(t.hour) + dir) : stepMinute(t, dir, snapMinutes));
  };

  const classes = [styles.clock, interactive && styles.interactive, compact && styles.compact, className]
    .filter(Boolean)
    .join(' ');

  const face = (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={styles.svg}
      focusable="false"
      {...(interactive
        ? {
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
          }
        : { role: 'img', 'aria-label': label })}
    >
      <circle className={styles.face} cx={c} cy={c} r={CLOCK.ringRadius} />
      <circle className={styles.ring} cx={c} cy={c} r={CLOCK.ringRadius} strokeWidth={CLOCK.ringWidth} />

      <g className={styles.dots} aria-hidden="true">
        {MINUTES.filter((m) => m % 5 !== 0).map((m) => {
          const p = polarToCartesian(m * 6, CLOCK.dotRadius);
          return <circle key={m} cx={p.x} cy={p.y} r={1.8} />;
        })}
      </g>

      <g className={styles.ticks} aria-hidden="true">
        {HOURS.map((h) => {
          // 12, 3, 6 und 9 sind länger und kräftiger – Orientierung, auch ohne Zahlen.
          const major = MAJOR.has(h);
          const a = polarToCartesian(h * 30, major ? CLOCK.tickInnerMajor : CLOCK.tickInner);
          const b = polarToCartesian(h * 30, CLOCK.tickOuter);
          return <line key={h} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={major ? styles.tickMajor : undefined} />;
        })}
      </g>

      {!compact && (
        <>
          <g aria-hidden="true">
            {HOURS.map((h) => {
              const major = MAJOR.has(h);
              const p = polarToCartesian(h * 30, major ? CLOCK.majorNumberRadius : CLOCK.numberRadius);
              return (
                <text
                  key={h}
                  x={p.x}
                  y={p.y}
                  className={major ? styles.hourMajor : styles.hourMinor}
                  fontSize={major ? 24 : 20}
                  data-hour-number={h}
                >
                  {h}
                </text>
              );
            })}
          </g>

          <g aria-hidden="true">
            {HOURS.map((h) => {
              const p = polarToCartesian(h * 30, CLOCK.minuteNumberRadius);
              return (
                <text key={h} x={p.x} y={p.y} className={styles.minuteNumber} fontSize={15} data-minute-number={h * 5}>
                  {h * 5}
                </text>
              );
            })}
          </g>
        </>
      )}

      <g data-testid="hour-hand" data-angle={hourAngle} className={styles.hourHand}>
        <line x1={hourHand.x1} y1={hourHand.y1} x2={hourHand.x2} y2={hourHand.y2} />
      </g>
      <g data-testid="minute-hand" data-angle={minuteAngle} className={styles.minuteHand}>
        <line x1={minuteHand.x1} y1={minuteHand.y1} x2={minuteHand.x2} y2={minuteHand.y2} />
      </g>
      <circle className={styles.pin} cx={c} cy={c} r={7} />

      {interactive && (
        <>
          <g
            className={styles.handle}
            data-hand="hour"
            role="slider"
            tabIndex={0}
            aria-label="Stundenzeiger"
            aria-valuemin={1}
            aria-valuemax={12}
            aria-valuenow={to12h(hour)}
            aria-valuetext={`zeigt auf ${to12h(hour)}`}
            onKeyDown={onKeyDown('hour')}
          >
            <circle className={styles.focusRing} cx={hourHand.tip.x} cy={hourHand.tip.y} r={16} />
            <circle className={styles.knobHour} cx={hourHand.tip.x} cy={hourHand.tip.y} r={9} />
          </g>
          <g
            className={styles.handle}
            data-hand="minute"
            role="slider"
            tabIndex={0}
            aria-label="Minutenzeiger"
            aria-valuemin={0}
            aria-valuemax={59}
            aria-valuenow={minute}
            aria-valuetext={`${minute} ${minute === 1 ? 'Minute' : 'Minuten'}`}
            onKeyDown={onKeyDown('minute')}
          >
            <circle className={styles.focusRing} cx={minuteHand.tip.x} cy={minuteHand.tip.y} r={14} />
            <circle className={styles.knobMinute} cx={minuteHand.tip.x} cy={minuteHand.tip.y} r={7} />
          </g>
        </>
      )}
    </svg>
  );

  if (!interactive) return <div className={classes}>{face}</div>;

  return (
    <div className={classes} role="group" aria-label={ariaLabel ?? `Uhr zum Stellen, zeigt ${label}`}>
      {face}
    </div>
  );
}
