import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhoneInput } from './phone-input.js';

afterEach(cleanup);

describe('PhoneInput', () => {
  it('normalizes an Algerian mobile number on blur', () => {
    const onValueChange = vi.fn<(value: string) => void>();

    render(<PhoneInput aria-label="Phone" value="0551 23 45 67" onValueChange={onValueChange} />);
    fireEvent.blur(screen.getByRole('textbox', { name: 'Phone' }));

    expect(onValueChange).toHaveBeenCalledWith('+213551234567');
  });

  it('keeps the phone field left-to-right in Arabic layouts', () => {
    render(<PhoneInput aria-label="Phone" value="" onValueChange={() => undefined} />);

    expect(screen.getByRole('textbox', { name: 'Phone' }).getAttribute('dir')).toBe('ltr');
  });
});
