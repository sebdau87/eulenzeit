import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { initialProgress } from '../domain/session';
import { ParentsScreen } from './ParentsScreen';

const setup = () => {
  const props = {
    progress: { unlocked: 3 as const, levels: { 1: { streak: 0, stars: 6, completed: true } } },
    settings: { wordVariant: 'standard' as const },
    challenge: () => ({ a: 7, b: 8 }),
    onWordVariant: vi.fn(),
    onReset: vi.fn(),
    onBack: vi.fn(),
  };
  render(<ParentsScreen {...props} />);
  return props;
};

async function passGate() {
  await userEvent.type(screen.getByLabelText('Wie viel ist 7 × 8?'), '56');
  await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));
}

describe('ParentsScreen', () => {
  it('zeigt die Einstellungen erst nach der Eltern-Aufgabe', async () => {
    setup();
    expect(screen.queryByRole('radio')).toBeNull();
    await passGate();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('stellt bei falscher Antwort eine neue Aufgabe und meldet den Fehler', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Wie viel ist 7 × 8?'), '54{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('Das stimmt nicht');
    expect(screen.getByLabelText('Wie viel ist 7 × 8?')).toHaveValue('');
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('wechselt die Wortvariante mit Beispiel', async () => {
    const props = setup();
    await passGate();
    expect(screen.getByRole('radio', { name: /Viertel vor elf/ })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: /dreiviertel elf/ }));
    expect(props.onWordVariant).toHaveBeenCalledWith('ost');
  });

  it('setzt den Fortschritt erst nach Bestätigung zurück', async () => {
    const props = setup();
    await passGate();
    expect(screen.getByText(/6 Sterne gesammelt, freigeschaltet bis Level 3/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Fortschritt zurücksetzen' }));
    expect(props.onReset).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fortschritt zurücksetzen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ja, zurücksetzen' }));
    expect(props.onReset).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('zurückgesetzt');
  });

  it('nennt den Datenschutz', async () => {
    setup();
    await passGate();
    expect(screen.getByText(/nur auf diesem Gerät/)).toBeInTheDocument();
  });

  it('funktioniert mit leerem Fortschritt', async () => {
    render(
      <ParentsScreen
        progress={initialProgress()}
        settings={{ wordVariant: 'ost' }}
        challenge={() => ({ a: 6, b: 6 })}
        onWordVariant={vi.fn()}
        onReset={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    await userEvent.type(screen.getByLabelText('Wie viel ist 6 × 6?'), '36{Enter}');
    expect(screen.getByText(/0 Sterne gesammelt/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /dreiviertel/ })).toBeChecked();
  });
});
