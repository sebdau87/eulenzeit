import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StarRow } from './StarRow';

describe('StarRow', () => {
  it('beschreibt die Sterne textlich', () => {
    render(<StarRow earned={3} total={5} />);
    expect(screen.getByRole('img', { name: '3 von 5 Sternen' })).toBeInTheDocument();
  });

  it('füllt genau earned Sterne', () => {
    const { container } = render(<StarRow earned={2} />);
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-filled="false"]')).toHaveLength(3);
  });

  it('begrenzt Werte außerhalb des Bereichs', () => {
    render(<StarRow earned={8} total={5} />);
    expect(screen.getByRole('img', { name: '5 von 5 Sternen' })).toBeInTheDocument();
  });

  it('nutzt die Einzahl bei einem Stern', () => {
    render(<StarRow earned={-2} total={1} />);
    expect(screen.getByRole('img', { name: '0 von 1 Stern' })).toBeInTheDocument();
  });
});
