import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tack } from './Tack';

describe('Tack', () => {
  it('ist ohne label dekorativ', () => {
    const { container } = render(<Tack />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('hat mit label einen zugänglichen Namen', () => {
    render(<Tack label="Tack, die Eule" />);
    expect(screen.getByRole('img', { name: 'Tack, die Eule' })).toBeInTheDocument();
  });

  it.each(['lavendel', 'sonne'] as const)('hat im Gefieder %s Punktaugen, die blinzeln', (plumage) => {
    const { container } = render(<Tack plumage={plumage} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-plumage', plumage);
    expect(svg).toHaveClass(plumage);
    expect(container.querySelector('[data-eyes="punkt"]')).toHaveClass('blink');
  });

  it('lacht im Gefieder minze mit Bogenaugen', () => {
    const { container } = render(<Tack plumage="minze" />);
    expect(container.querySelector('[data-eyes="bogen"]')).not.toBeNull();
    expect(container.querySelector('[data-eyes="punkt"]')).toBeNull();
  });

  it('kann das Blinzeln abschalten', () => {
    const { container } = render(<Tack blink={false} />);
    expect(container.querySelector('[data-eyes="punkt"]')).not.toHaveClass('blink');
  });
});
