import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type StopDeskOption, StopDeskPicker } from './stop-desk-picker.js';

afterEach(cleanup);

const labels = { legend: 'Stop-desk', empty: 'No desk here', openMap: 'Map' };
const desk = (id: string, name: string): StopDeskOption => ({
  id,
  name,
  address: 'Rue 1',
  place: 'Bab Ezzouar · Yalidine',
  hours: 'sat-thu 08:00-17:00',
  distance: '1.2 km',
  mapUrl: 'https://www.google.com/maps?q=36.7,3.1',
});

describe('StopDeskPicker', () => {
  it('lets the customer pick a desk and previews the chosen one', () => {
    const onChange = vi.fn<(id: string) => void>();
    render(
      <StopDeskPicker
        options={[desk('a', 'Agence A'), desk('b', 'Agence B')]}
        value="a"
        onChange={onChange}
        labels={labels}
        preview={<p>preview</p>}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: /Agence B/ }));

    expect(onChange).toHaveBeenCalledWith('b');
    expect(screen.getAllByText('preview')).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Map' })).toHaveLength(2);
  });

  it('says so when no desk serves the place', () => {
    render(<StopDeskPicker options={[]} value={null} onChange={() => undefined} labels={labels} />);
    expect(screen.getByText('No desk here')).toBeTruthy();
  });
});
