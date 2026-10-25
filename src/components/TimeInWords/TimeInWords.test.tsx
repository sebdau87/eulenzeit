import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TimeInWords } from './TimeInWords';

describe('TimeInWords', () => {
  it('zeigt die Zeit in Worten', () => {
    render(<TimeInWords hour={10} minute={25} />);
    expect(screen.getByText('fünf vor halb elf')).toBeInTheDocument();
  });

  it('unterstützt regionale Varianten', () => {
    render(<TimeInWords hour={10} minute={45} variant="ost" />);
    expect(screen.getByText('dreiviertel elf')).toBeInTheDocument();
  });
});
