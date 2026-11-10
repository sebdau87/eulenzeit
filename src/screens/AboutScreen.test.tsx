import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AboutScreen } from './AboutScreen';

describe('AboutScreen', () => {
  it('beschreibt das Projekt und nennt den Stand als Monat/Jahr', () => {
    render(<AboutScreen onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Über Eulenzeit' })).toHaveFocus();
    expect(screen.getByText(/lernen Kinder die Uhr zu lesen/)).toBeInTheDocument();
    expect(screen.getByText(/Lernprojekt von Sebastian/)).toHaveTextContent('von Claude Code erstellt');
    expect(screen.getByText(/^Stand: (0[1-9]|1[0-2])\/\d{4}$/)).toBeInTheDocument();
  });

  it('zeigt Tack mit blinzelnden Punktaugen, dekorativ', () => {
    render(<AboutScreen onBack={vi.fn()} />);
    const tack = screen.getByTestId('about-tack').querySelector('svg')!;
    expect(tack).toHaveAttribute('aria-hidden', 'true');
    expect(tack.querySelector('[data-eyes="punkt"]')).toHaveClass('blink');
  });

  it('führt zurück zur Levelauswahl', async () => {
    const onBack = vi.fn();
    render(<AboutScreen onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Zurück zu den Levels' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
