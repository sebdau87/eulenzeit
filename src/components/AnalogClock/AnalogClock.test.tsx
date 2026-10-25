import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CLOCK, polarToCartesian } from '../../domain/clockMath';
import { formatDigital, type ClockTime } from '../../domain/time';
import { describeClockHands } from '../../domain/words';
import { AnalogClock } from './AnalogClock';

const angleOf = (testId: string) => Number(screen.getByTestId(testId).getAttribute('data-angle'));

function Controlled({ start, snap = 5, spy }: { start: ClockTime; snap?: number; spy?: (t: ClockTime) => void }) {
  const [t, setT] = useState(start);
  return (
    <>
      <AnalogClock
        hour={t.hour}
        minute={t.minute}
        interactive
        snapMinutes={snap}
        onChange={(next) => {
          spy?.(next);
          setT(next);
        }}
      />
      <output data-testid="value">{formatDigital(t)}</output>
    </>
  );
}

describe('AnalogClock – Darstellung', () => {
  it('zeigt 12 Stundenzahlen und 12 Minutenzahlen 5–60', () => {
    const { container } = render(<AnalogClock hour={4} minute={30} />);
    expect(container.querySelectorAll('[data-hour-number]')).toHaveLength(12);
    const minuteNumbers = [...container.querySelectorAll('[data-minute-number]')].map((n) => n.textContent);
    expect(minuteNumbers).toEqual(['5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55', '60']);
  });

  it('hebt 12, 3, 6 und 9 hervor', () => {
    const { container } = render(<AnalogClock hour={4} minute={30} />);
    const major = [...container.querySelectorAll('.hour-major, .hourMajor')].map((n) => n.textContent);
    expect(major.sort()).toEqual(['12', '3', '6', '9'].sort());
  });

  it.each([
    [4, 30, 135, 180],
    [0, 0, 0, 0],
    [12, 0, 0, 0],
    [11, 59, 359.5, 354],
    [10, 25, 312.5, 150],
  ])('%s:%s stellt die Zeiger auf %s° / %s°', (h, m, hourDeg, minuteDeg) => {
    render(<AnalogClock hour={h} minute={m} />);
    expect(angleOf('hour-hand')).toBeCloseTo(hourDeg);
    expect(angleOf('minute-hand')).toBeCloseTo(minuteDeg);
  });

  it('hat als textliche Entsprechung die Zeit in Worten', () => {
    render(<AnalogClock hour={4} minute={30} />);
    expect(screen.getByRole('img', { name: 'halb fünf' })).toBeInTheDocument();
  });

  it('übernimmt ein eigenes Label, z. B. die Zeigerbeschreibung', () => {
    const label = describeClockHands({ hour: 4, minute: 30 });
    render(<AnalogClock hour={4} minute={30} ariaLabel={label} />);
    expect(screen.getByRole('img', { name: label })).toBeInTheDocument();
  });

  it('ist statisch nicht fokussierbar', () => {
    render(<AnalogClock hour={4} minute={30} />);
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
  });
});

describe('AnalogClock – Tastatur', () => {
  it('bietet beide Zeiger als Slider an', () => {
    render(<Controlled start={{ hour: 4, minute: 30 }} />);
    const hour = screen.getByRole('slider', { name: 'Stundenzeiger' });
    const minute = screen.getByRole('slider', { name: 'Minutenzeiger' });
    expect(hour).toHaveAttribute('aria-valuenow', '4');
    expect(minute).toHaveAttribute('aria-valuenow', '30');
    expect(minute).toHaveAttribute('aria-valuetext', '30 Minuten');
  });

  it('stellt die Stunde mit Pfeiltasten', async () => {
    const user = userEvent.setup();
    render(<Controlled start={{ hour: 12, minute: 0 }} />);
    await user.tab();
    expect(screen.getByRole('slider', { name: 'Stundenzeiger' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('value')).toHaveTextContent(/^1:00$/);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByTestId('value')).toHaveTextContent(/^11:00$/);
  });

  it('stellt die Minuten im Raster und schiebt die Stunde mit', async () => {
    const user = userEvent.setup();
    render(<Controlled start={{ hour: 4, minute: 50 }} />);
    await user.tab();
    await user.tab();
    expect(screen.getByRole('slider', { name: 'Minutenzeiger' })).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByTestId('value')).toHaveTextContent(/^5:00$/);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByTestId('value')).toHaveTextContent(/^4:55$/);
  });

  it('respektiert snapMinutes = 1', async () => {
    const user = userEvent.setup();
    render(<Controlled start={{ hour: 4, minute: 50 }} snap={1} />);
    await user.tab();
    await user.tab();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByTestId('value')).toHaveTextContent(/^4:51$/);
  });
});

describe('AnalogClock – Zeiger ziehen', () => {
  function setup(start: ClockTime, snap = 5) {
    const spy = vi.fn();
    const { container } = render(<Controlled start={start} snap={snap} spy={spy} />);
    const svg = container.querySelector('svg')!;
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: CLOCK.size, height: CLOCK.size, right: CLOCK.size, bottom: CLOCK.size, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    const at = (angle: number, r: number) => {
      const p = polarToCartesian(angle, r);
      return { clientX: p.x, clientY: p.y, pointerId: 1, button: 0 };
    };
    return { svg, spy, at };
  }

  it('zieht den Minutenzeiger und rastet auf 5 Minuten ein', () => {
    const { svg, at } = setup({ hour: 4, minute: 0 });
    fireEvent.pointerDown(svg, at(0, 75));
    fireEvent.pointerMove(svg, at(92, 75)); // ≈ 15,3 min → 15
    fireEvent.pointerUp(svg, at(92, 75));
    expect(screen.getByTestId('value')).toHaveTextContent(/^4:15$/);
  });

  it('rastet bei snapMinutes = 1 auf jede Minute', () => {
    const { svg, at } = setup({ hour: 4, minute: 0 }, 1);
    fireEvent.pointerDown(svg, at(0, 75));
    fireEvent.pointerMove(svg, at(44, 75)); // ≈ 7,3 min → 7
    expect(screen.getByTestId('value')).toHaveTextContent(/^4:07$/);
  });

  it('schiebt die Stunde mit, wenn der Minutenzeiger über die 12 läuft', () => {
    const { svg, at } = setup({ hour: 4, minute: 45 });
    fireEvent.pointerDown(svg, at(270, 75));
    fireEvent.pointerMove(svg, at(330, 75));
    fireEvent.pointerMove(svg, at(30, 75));
    expect(screen.getByTestId('value')).toHaveTextContent(/^5:05$/);
  });

  it('zieht innen den Stundenzeiger und lässt die Minute stehen', () => {
    const { svg, at } = setup({ hour: 4, minute: 30 }); // Stunde 135°, Minute 180°
    fireEvent.pointerDown(svg, at(135, 35));
    fireEvent.pointerMove(svg, at(225, 35)); // (225 - 15) / 30 = 7
    fireEvent.pointerUp(svg, at(225, 35));
    expect(screen.getByTestId('value')).toHaveTextContent(/^7:30$/);
  });

  it('meldet keine Änderung, wenn sich nichts ändert', () => {
    const { svg, spy, at } = setup({ hour: 4, minute: 0 });
    fireEvent.pointerDown(svg, at(1, 75));
    fireEvent.pointerMove(svg, at(2, 75));
    expect(spy).not.toHaveBeenCalled();
  });

  it('reagiert ohne interactive nicht auf Pointer', () => {
    const onChange = vi.fn();
    const { container } = render(<AnalogClock hour={4} minute={0} onChange={onChange} />);
    fireEvent.pointerDown(container.querySelector('svg')!, { clientX: 200, clientY: 126 });
    expect(onChange).not.toHaveBeenCalled();
  });
});
