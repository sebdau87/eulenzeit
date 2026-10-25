import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnswerOption } from './AnswerOption';

describe('AnswerOption', () => {
  it('ist normal nicht gedrückt und ohne Status-Icon', () => {
    render(<AnswerOption>4:30</AnswerOption>);
    const btn = screen.getByRole('button', { name: '4:30' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn.querySelector('svg')).toBeNull();
  });

  it('meldet „ausgewählt“ über aria-pressed', () => {
    render(<AnswerOption state="selected">4:30</AnswerOption>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('zeigt „richtig“ mit Haken-Icon und Textlabel', () => {
    render(<AnswerOption state="correct">10:25</AnswerOption>);
    const btn = screen.getByRole('button', { name: /richtig.*10:25/ });
    expect(btn).toHaveClass('correct');
    expect(btn.querySelector('[data-icon="check"]')).toHaveAttribute('aria-label', 'richtig');
  });

  it('zeigt „falsch“ mit Nochmal-Icon statt nur Farbe', () => {
    render(<AnswerOption state="wrong">5:50</AnswerOption>);
    const btn = screen.getByRole('button', { name: /nochmal.*5:50/ });
    expect(btn).toHaveClass('wrong');
    expect(btn.querySelector('[data-icon="retry"]')).not.toBeNull();
  });

  it('meldet Klicks', async () => {
    const onClick = vi.fn();
    render(<AnswerOption onClick={onClick}>4:30</AnswerOption>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('AnswerOption size', () => {
  it('nutzt für Worte die Text-Variante', () => {
    render(<AnswerOption size="words">fünf vor halb elf</AnswerOption>);
    expect(screen.getByRole('button')).toHaveClass('words');
  });
});
