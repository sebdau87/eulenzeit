import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RewardScreen } from './RewardScreen';

describe('RewardScreen', () => {
  it('lobt, zeigt 5 Sterne und führt zum freigeschalteten Level', async () => {
    const onNextLevel = vi.fn();
    render(<RewardScreen level={1} unlockedLevel={2} onNextLevel={onNextLevel} onPracticeMore={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Level 1 geschafft!' })).toHaveFocus();
    expect(screen.getByRole('img', { name: '5 von 5 Sternen' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Weiter zu Level 2' }));
    expect(onNextLevel).toHaveBeenCalledWith(2);
  });

  it('nach dem letzten Level gibt es kein „Weiter zu Level“', () => {
    render(<RewardScreen level={8} unlockedLevel={null} onNextLevel={vi.fn()} onPracticeMore={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText(/Noch eine Runde geschafft/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Weiter zu Level/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Weiter üben' })).toBeInTheDocument();
  });
});
