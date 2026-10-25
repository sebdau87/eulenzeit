import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SpeechBubble } from './SpeechBubble';

describe('SpeechBubble', () => {
  it('zeigt den Inhalt', () => {
    render(<SpeechBubble>Schau auf den kurzen Zeiger.</SpeechBubble>);
    expect(screen.getByText('Schau auf den kurzen Zeiger.')).toBeInTheDocument();
  });

  it.each(['neutral', 'tip', 'praise'] as const)('setzt den Ton %s', (tone) => {
    render(<SpeechBubble tone={tone}>Hallo</SpeechBubble>);
    expect(screen.getByText('Hallo')).toHaveClass(tone);
  });

  it('hat standardmäßig den Zipfel rechts (zu Tack) und kann ihn weglassen', () => {
    const { rerender } = render(<SpeechBubble>Hallo</SpeechBubble>);
    expect(screen.getByText('Hallo')).toHaveClass('tailRight');
    rerender(<SpeechBubble tail="none">Hallo</SpeechBubble>);
    expect(screen.getByText('Hallo')).not.toHaveClass('tailRight');
  });
});
