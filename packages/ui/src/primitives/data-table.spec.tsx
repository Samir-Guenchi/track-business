import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataTable, type DataColumn } from './data-table.js';

interface OrderRow {
  readonly id: string;
  readonly name: string;
}

const columns = [
  { id: 'name', header: 'Order', cell: (row: OrderRow) => row.name },
] satisfies readonly DataColumn<OrderRow>[];

const baseProps = {
  columns,
  getRowId: (row: OrderRow) => row.id,
  ariaLabel: 'Orders',
  selectAllLabel: 'Select all orders',
  selectionLabel: (id: string) => `Select ${id}`,
};

afterEach(cleanup);

describe('DataTable selection', () => {
  it('omits removed row IDs from later selection changes', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn<(selectedIds: readonly string[]) => void>();
    const orderA = { id: 'order-a', name: 'Order A' };
    const orderB = { id: 'order-b', name: 'Order B' };
    const initialRows = [orderA, orderB];
    const { rerender } = render(
      <DataTable {...baseProps} rows={initialRows} onSelectionChange={onSelectionChange} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select order-a' }));
    rerender(<DataTable {...baseProps} rows={[orderB]} onSelectionChange={onSelectionChange} />);
    await user.click(screen.getByRole('checkbox', { name: 'Select order-b' }));

    expect(onSelectionChange).toHaveBeenLastCalledWith(['order-b']);
  });
});
