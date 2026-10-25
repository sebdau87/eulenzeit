import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DigitalTime } from './DigitalTime';

describe('DigitalTime', () => {
  it.each([
    [4, 30, '4:30', '04:30'],
    [0, 0, '12:00', '00:00'],
    [12, 5, '12:05', '12:05'],
    [23, 59, '11:59', '23:59'],
  ])('%s:%s zeigt %s', (h, m, text, iso) => {
    const { container } = render(<DigitalTime hour={h} minute={m} />);
    const time = container.querySelector('time')!;
    expect(time).toHaveTextContent(text);
    expect(time).toHaveAttribute('datetime', iso);
  });

  it('kann 24-Stunden-Format', () => {
    render(<DigitalTime hour={16} minute={30} format="24h" />);
    expect(screen.getByText('16')).toHaveAttribute('data-part', 'hour');
  });

  it('kennzeichnet Stunde und Minute in Zeigerfarben, abschaltbar', () => {
    const { container, rerender } = render(<DigitalTime hour={4} minute={30} />);
    expect(container.querySelector('time')).toHaveClass('colorCoded');
    rerender(<DigitalTime hour={4} minute={30} colorCoded={false} />);
    expect(container.querySelector('time')).not.toHaveClass('colorCoded');
  });
});
