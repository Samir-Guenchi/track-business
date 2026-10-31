import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Commune, Wilaya } from '@trackecom/contracts';
import { WilayaCommuneSelect } from './wilaya-commune-select.js';

const wilayas: readonly Wilaya[] = [
  { code: 16, nameAr: 'الجزائر', nameFr: 'Alger' },
  { code: 31, nameAr: 'وهران', nameFr: 'Oran' },
];

const communes: readonly Commune[] = [
  {
    id: 1601,
    wilayaCode: 16,
    nameAr: 'الجزائر الوسطى',
    nameFr: 'Alger Centre',
    postalCode: '16000',
    hasStopDesk: true,
  },
  {
    id: 3101,
    wilayaCode: 31,
    nameAr: 'السانية',
    nameFr: 'Es Senia',
    postalCode: '31000',
    hasStopDesk: false,
  },
];

const labels = {
  wilayaLabel: 'Wilaya',
  communeLabel: 'Commune',
  wilayaPlaceholder: 'Choose a wilaya',
  communePlaceholder: 'Choose a commune',
  searchLabel: 'Search communes',
  emptyLabel: 'No communes found',
};

afterEach(cleanup);

describe('WilayaCommuneSelect', () => {
  it('clears the selected commune when the wilaya changes', async () => {
    const user = userEvent.setup();
    const onWilayaChange = vi.fn<(code: number | undefined) => void>();
    const onCommuneChange = vi.fn<(id: number | undefined) => void>();

    render(
      <WilayaCommuneSelect
        {...labels}
        wilayas={wilayas}
        communes={communes}
        wilayaCode={16}
        communeId={1601}
        locale="fr"
        onWilayaChange={onWilayaChange}
        onCommuneChange={onCommuneChange}
      />,
    );
    await user.click(screen.getByRole('combobox', { name: 'Wilaya' }));
    await user.click(await screen.findByRole('option', { name: '31 · Oran' }));

    expect(onWilayaChange).toHaveBeenCalledWith(31);
    expect(onCommuneChange).toHaveBeenCalledWith(undefined);
  });

  it('shows communes from the selected wilaya only', async () => {
    const user = userEvent.setup();

    render(
      <WilayaCommuneSelect
        {...labels}
        wilayas={wilayas}
        communes={communes}
        wilayaCode={16}
        locale="fr"
        onWilayaChange={() => undefined}
        onCommuneChange={() => undefined}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Commune' }));

    expect(await screen.findByRole('option', { name: 'Alger Centre' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Es Senia' })).toBeNull();
  });
});
