import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('ist standardmäßig primär und vom Typ button', () => {
    render(<Button>Prüfen</Button>);
    const btn = screen.getByRole('button', { name: 'Prüfen' });
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn).toHaveAttribute('data-variant', 'primary');
    expect(btn).toHaveClass('primary');
  });

  it.each(['primary', 'secondary', 'tip'] as const)('setzt die Variante %s', (variant) => {
    render(<Button variant={variant}>X</Button>);
    expect(screen.getByRole('button')).toHaveClass(variant);
  });

  it('lässt sich per Klick, Enter und Leertaste auslösen', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Weiter</Button>);
    await user.click(screen.getByRole('button'));
    await user.tab();
    await user.tab({ shift: true });
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('löst deaktiviert nicht aus', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Prüfen
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('rendert ein Icon nur dekorativ, der Name bleibt der Text', () => {
    const { container } = render(<Button icon="hint">Tipp</Button>);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Tipp' })).toBeInTheDocument();
  });
});

describe('Button iconOnly', () => {
  it('behält den Text als zugänglichen Namen', () => {
    render(
      <Button icon="back" iconOnly>
        Zur Levelauswahl
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Zur Levelauswahl' });
    expect(btn).toHaveClass('iconOnly');
    expect(screen.getByText('Zur Levelauswahl')).toHaveClass('visually-hidden');
  });
});
