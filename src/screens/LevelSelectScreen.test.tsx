import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { initialProgress, type Progress } from '../domain/session';
import { LevelSelectScreen } from './LevelSelectScreen';

describe('LevelSelectScreen', () => {
  it('zeigt alle 8 Level, nur Level 1 ist anfangs frei', async () => {
    const onStart = vi.fn();
    render(<LevelSelectScreen progress={initialProgress()} onStart={onStart} onParents={vi.fn()} />);
    const cards = screen.getAllByRole('listitem').map((li) => li.querySelector('button')!);
    expect(cards).toHaveLength(8);
    expect(cards[0]).toHaveAttribute('aria-disabled', 'false');
    expect(cards[1]).toHaveAttribute('aria-disabled', 'true');
    expect(cards[1]).toHaveAccessibleDescription('Noch gesperrt');
    expect(cards[7]).toHaveAccessibleDescription('Noch gesperrt');

    await userEvent.click(cards[1]!);
    expect(onStart).not.toHaveBeenCalled();
    await userEvent.click(cards[0]!);
    expect(onStart).toHaveBeenCalledWith(1);
  });

  it('zeigt geschaffte Level und die Sternsumme', () => {
    const progress: Progress = {
      unlocked: 2,
      levels: { 1: { streak: 0, stars: 6, completed: true }, 2: { streak: 2, stars: 3, completed: false } },
    };
    render(<LevelSelectScreen progress={progress} onStart={vi.fn()} onParents={vi.fn()} />);
    expect(screen.getByLabelText('9 Sterne gesammelt')).toBeInTheDocument();
    expect(screen.getByText('Geschafft · 6 Sterne')).toBeInTheDocument();
    expect(screen.getByText('2 von 5 in Folge')).toBeInTheDocument();
  });
});
