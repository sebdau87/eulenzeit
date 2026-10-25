import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createRng } from '../domain/random';
import { checkAnswer, initialProgress, selectOption, startSession } from '../domain/session';
import { timeToGermanWords } from '../domain/words';
import { QuestionScreen } from './QuestionScreen';

const handlers = () => ({
  onSelect: vi.fn(),
  onDial: vi.fn(),
  onHint: vi.fn(),
  onCheck: vi.fn(),
  onNext: vi.fn(),
  onBack: vi.fn(),
});

describe('QuestionScreen', () => {
  const session = startSession(2, createRng(3));
  const progress = initialProgress();
  const correctWords = timeToGermanWords(session.question.time);

  it('zeigt Frage, Uhr ohne Lösung im Label, vier Antworten und keinen Tack', () => {
    render(<QuestionScreen session={session} progress={progress} {...handlers()} />);
    expect(screen.getByRole('heading', { name: 'Wie spät ist es?' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Stundenzeiger/ })).not.toHaveAccessibleName(correctWords);
    expect(screen.getByRole('group', { name: 'Wie spät ist es?' }).querySelectorAll('button')).toHaveLength(4);
    expect(screen.queryByTestId('tack-helper')).toBeNull();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tipp' })).toBeInTheDocument();
  });

  it('meldet Auswahl, Tipp und Zurück', async () => {
    const h = handlers();
    render(<QuestionScreen session={session} progress={progress} {...h} />);
    await userEvent.click(screen.getByRole('button', { name: correctWords }));
    await userEvent.click(screen.getByRole('button', { name: 'Tipp' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zur Levelauswahl' }));
    expect(h.onSelect).toHaveBeenCalledWith(session.question.correctIndex);
    expect(h.onHint).toHaveBeenCalledOnce();
    expect(h.onBack).toHaveBeenCalledOnce();
  });

  it('nach falscher Antwort: Tack gelb, Option markiert und gesperrt, Ansage im Live-Bereich', () => {
    const wrong = session.question.correctIndex === 0 ? 1 : 0;
    const { session: retry } = checkAnswer(selectOption(session, wrong), progress);
    render(<QuestionScreen session={retry} progress={progress} {...handlers()} />);
    expect(screen.getByTestId('tack-helper')).toHaveAttribute('data-mood', 'sonne');
    const marked = screen.getByRole('button', { name: /nicht ganz, nochmal/ });
    expect(marked).toBeDisabled();
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(/^Nicht ganz\./);
    expect(screen.getByTestId('tack-helper')).toHaveTextContent(retry.tack!.detail!);
  });

  it('nach richtiger Antwort: Tack grün, Haken, Weiter', async () => {
    const h = handlers();
    const { session: done, progress: p } = checkAnswer(selectOption(session, session.question.correctIndex), progress);
    render(<QuestionScreen session={done} progress={p} {...h} />);
    expect(screen.getByTestId('tack-helper')).toHaveAttribute('data-mood', 'minze');
    expect(screen.getByRole('button', { name: new RegExp(`richtig.*${correctWords}`) })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(h.onNext).toHaveBeenCalledOnce();
  });
});

describe('QuestionScreen – neue Aufgabenarten', () => {
  it('Level 6: Antworten digital', () => {
    const s = startSession(6, createRng(61));
    render(<QuestionScreen session={s} progress={initialProgress()} {...handlers()} />);
    const buttons = screen.getByRole('group', { name: 'Wie spät ist es?' }).querySelectorAll('button');
    for (const b of buttons) expect(b.textContent).toMatch(/^\d{1,2}:\d{2}$/);
  });

  it('Level 7: Zeiger stellen mit Zielzeit, Slidern und aktivem Prüfen', async () => {
    const h = handlers();
    const s = startSession(7, createRng(71));
    render(<QuestionScreen session={s} progress={initialProgress()} {...h} />);
    const target = `${s.question.time.hour}:${String(s.question.time.minute).padStart(2, '0')}`;
    expect(screen.getByRole('heading', { name: `Stell die Uhr auf ${target}` })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /Stell die Uhr/ })).toBeNull();
    const minute = screen.getByRole('slider', { name: 'Minutenzeiger' });
    minute.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(h.onDial).toHaveBeenCalledWith({ hour: s.dialed!.hour, minute: 5 });
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeEnabled();
  });

  it('Level 7 nach zwei Fehlern: Uhr fest auf der Lösung, nicht mehr stellbar', () => {
    let s = startSession(7, createRng(72));
    let p = initialProgress();
    ({ session: s, progress: p } = checkAnswer(s, p));
    ({ session: s, progress: p } = checkAnswer(s, p));
    render(<QuestionScreen session={s} progress={p} {...handlers()} />);
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
    expect(screen.getByRole('list', { name: 'So geht es' })).toBeInTheDocument();
  });

  it('Level 8: Zeit in Worten als Frage, vier kleine Uhren ohne Zahlen als Antworten', () => {
    const s = startSession(8, createRng(81));
    const { container } = render(<QuestionScreen session={s} progress={initialProgress()} {...handlers()} />);
    expect(screen.getByRole('heading', { name: `Welche Uhr zeigt „${timeToGermanWords(s.question.time)}“?` })).toBeInTheDocument();
    const group = screen.getByRole('group', { name: /Welche Uhr zeigt/ });
    expect(group.querySelectorAll('button svg[role="img"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-hour-number]')).toHaveLength(0);
  });
});
