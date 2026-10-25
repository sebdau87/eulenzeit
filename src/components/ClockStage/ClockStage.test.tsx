import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClockStage } from './ClockStage';

describe('ClockStage', () => {
  it('zeigt ohne tack nur die Uhr', () => {
    render(<ClockStage hour={4} minute={30} />);
    expect(screen.getByRole('img', { name: 'halb fünf' })).toBeInTheDocument();
    expect(screen.queryByTestId('tack-helper')).toBeNull();
  });

  it('zeigt Tack (gelb) mit Tipp-Blase', () => {
    const { container } = render(<ClockStage hour={4} minute={30} tack={{ plumage: 'sonne', message: 'Tipp!' }} />);
    expect(screen.getByText('Tipp!')).toHaveClass('tip');
    expect(container.querySelector('[data-plumage="sonne"]')).not.toBeNull();
  });

  it('zeigt Tack (grün) mit Lob-Blase und Bogenaugen', () => {
    const { container } = render(<ClockStage hour={4} minute={30} tack={{ plumage: 'minze', message: 'Super!' }} />);
    expect(screen.getByText('Super!')).toHaveClass('praise');
    expect(container.querySelector('[data-eyes="bogen"]')).not.toBeNull();
  });
});

describe('ClockStage – Anordnung', () => {
  it('stellt Tack hinter die Uhr, nicht darüber', () => {
    const { container } = render(<ClockStage hour={4} minute={30} tack={{ plumage: 'sonne', message: 'Tipp!' }} />);
    const stage = container.firstElementChild!;
    expect(stage.children[0]).toContainElement(screen.getByRole('img', { name: 'halb fünf' }));
    expect(stage.children[1]).toBe(screen.getByTestId('tack-helper'));
  });
});
