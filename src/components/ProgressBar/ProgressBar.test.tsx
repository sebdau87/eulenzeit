import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { clampProgress, ProgressBar } from './ProgressBar';

describe('clampProgress', () => {
  it.each([
    [3, 5, 3],
    [-1, 5, 0],
    [7, 5, 5],
    [2.6, 5, 3],
    [Number.NaN, 5, 0],
    [3, 0, 0],
  ])('clampProgress(%s, %s) = %s', (value, max, expected) => {
    expect(clampProgress(value, max)).toBe(expected);
  });
});

describe('ProgressBar', () => {
  it('stellt den Fortschritt als progressbar mit Text bereit', () => {
    render(<ProgressBar value={3} max={5} label="Level 2" />);
    const bar = screen.getByRole('progressbar', { name: 'Level 2' });
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
    expect(bar).toHaveAttribute('aria-valuetext', '3 von 5');
    expect(screen.getByText('3 von 5')).toBeInTheDocument();
  });

  it('füllt anteilig und begrenzt auf max', () => {
    const { container } = render(<ProgressBar value={9} max={5} label="Level 1" />);
    expect(container.querySelector('.fill')).toHaveStyle({ width: '100%' });
  });

  it('kann den Zähler ausblenden', () => {
    render(<ProgressBar value={1} max={5} label="Level 1" showCount={false} />);
    expect(screen.queryByText('1 von 5')).toBeNull();
  });
});
