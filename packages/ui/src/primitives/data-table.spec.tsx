import { cleanup, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataTable, type DataColumn } from './data-table.js';

interface OrderRow {
  readonly id: string;
  readonly name: string;
  readonly total: number;
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

describe('DataTable', () => {
  it('omits removed row IDs from later selection changes', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn<(selectedIds: readonly string[]) => void>();
    const orderA = { id: 'order-a', name: 'Order A', total: 20 };
    const orderB = { id: 'order-b', name: 'Order B', total: 10 };
    const initialRows = [orderA, orderB];
    const { rerender } = render(
      <DataTable {...baseProps} rows={initialRows} onSelectionChange={onSelectionChange} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select order-a' }));
    rerender(<DataTable {...baseProps} rows={[orderB]} onSelectionChange={onSelectionChange} />);
    await user.click(screen.getByRole('checkbox', { name: 'Select order-b' }));

    expect(onSelectionChange).toHaveBeenLastCalledWith(['order-b']);
  });

  it('reports an empty selection when selected rows are removed', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn<(selectedIds: readonly string[]) => void>();
    const orderA = { id: 'order-a', name: 'Order A', total: 20 };
    const orderB = { id: 'order-b', name: 'Order B', total: 10 };
    const { rerender } = render(
      <DataTable {...baseProps} rows={[orderA, orderB]} onSelectionChange={onSelectionChange} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select order-a' }));
    rerender(<DataTable {...baseProps} rows={[orderB]} onSelectionChange={onSelectionChange} />);

    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('does not reselect an ID after its row is removed and restored', async () => {
    const user = userEvent.setup();
    const orderA = { id: 'order-a', name: 'Order A', total: 20 };
    const orderB = { id: 'order-b', name: 'Order B', total: 10 };
    const { rerender } = render(<DataTable {...baseProps} rows={[orderA, orderB]} />);

    await user.click(screen.getByRole('checkbox', { name: 'Select order-a' }));
    rerender(<DataTable {...baseProps} rows={[orderB]} />);
    rerender(<DataTable {...baseProps} rows={[orderA, orderB]} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Select order-a' });
    expect(checkbox.matches(':checked')).toBe(false);
  });

  it('sorts number columns in both directions', async () => {
    const user = userEvent.setup();
    const sortableColumns = [
      {
        id: 'total',
        header: 'Total',
        cell: (row: OrderRow) => row.name,
        sortValue: (row: OrderRow) => row.total,
      },
    ] satisfies readonly DataColumn<OrderRow>[];
    const table = render(
      <DataTable
        {...baseProps}
        columns={sortableColumns}
        rows={[
          { id: 'order-a', name: 'Order A', total: 20 },
          { id: 'order-b', name: 'Order B', total: 10 },
        ]}
      />,
    );
    const getOrderNames = () =>
      within(table.getByRole('table'))
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.children[1]?.textContent?.trim());

    await user.click(screen.getByRole('button', { name: 'Total' }));
    expect(getOrderNames()).toEqual(['Order B', 'Order A']);
    await user.click(screen.getByRole('button', { name: 'Total' }));
    expect(getOrderNames()).toEqual(['Order A', 'Order B']);
  });
});
