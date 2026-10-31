'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from './button.js';

export interface DataColumn<Row> {
  readonly id: string;
  readonly header: string;
  readonly cell: (row: Row) => ReactNode;
  readonly sortValue?: (row: Row) => string | number;
}

export interface DataTableProps<Row> {
  readonly rows: readonly Row[];
  readonly columns: readonly DataColumn<Row>[];
  readonly getRowId: (row: Row) => string;
  readonly ariaLabel: string;
  readonly selectAllLabel: string;
  readonly selectionLabel: (id: string) => string;
  readonly onSelectionChange?: (selectedIds: readonly string[]) => void;
}

type SortDirection = 'ascending' | 'descending';
interface SortState {
  readonly columnId: string;
  readonly direction: SortDirection;
}

function compareValues(left: string | number, right: string | number): number {
  return typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right));
}

function sortRows<Row>(
  rows: readonly Row[],
  column: DataColumn<Row>,
  direction: SortDirection,
): Row[] {
  const getValue = column.sortValue;
  if (!getValue) return [...rows];
  const multiplier = direction === 'ascending' ? 1 : -1;
  return rows.toSorted(
    (left, right) => multiplier * compareValues(getValue(left), getValue(right)),
  );
}

function useTableSort<Row>(rows: readonly Row[], columns: readonly DataColumn<Row>[]) {
  const [sort, setSort] = useState<SortState>();
  const activeColumn = columns.find((column) => column.id === sort?.columnId);
  const sortedRows = useMemo(
    () => (activeColumn && sort ? sortRows(rows, activeColumn, sort.direction) : [...rows]),
    [activeColumn, rows, sort],
  );
  const changeSort = (column: DataColumn<Row>) => {
    if (!column.sortValue) return;
    const direction =
      sort?.columnId === column.id && sort.direction === 'ascending' ? 'descending' : 'ascending';
    setSort({ columnId: column.id, direction });
  };
  return { sort, sortedRows, changeSort };
}

function useTableSelection<Row>(
  rows: readonly Row[],
  getRowId: (row: Row) => string,
  onSelectionChange?: (selectedIds: readonly string[]) => void,
) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(getRowId(row)));
  const update = (next: ReadonlySet<string>) => {
    setSelectedIds(next);
    onSelectionChange?.([...next]);
  };
  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update(next);
  };
  const toggleAll = () => update(allSelected ? new Set() : new Set(rows.map(getRowId)));
  return { selectedIds, allSelected, toggleRow, toggleAll };
}

function SortIcon({ direction }: { readonly direction?: SortDirection | undefined }) {
  if (direction === 'ascending') return <ArrowUp size={14} aria-hidden="true" />;
  if (direction === 'descending') return <ArrowDown size={14} aria-hidden="true" />;
  return <ArrowUpDown size={14} aria-hidden="true" />;
}

interface TableHeadProps<Row> {
  readonly columns: readonly DataColumn<Row>[];
  readonly sort?: SortState | undefined;
  readonly allSelected: boolean;
  readonly selectAllLabel: string;
  readonly onSort: (column: DataColumn<Row>) => void;
  readonly onToggleAll: () => void;
}

function TableHead<Row>({
  columns,
  sort,
  allSelected,
  selectAllLabel,
  onSort,
  onToggleAll,
}: TableHeadProps<Row>) {
  return (
    <thead>
      <tr>
        <th className="tk-table__check">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            aria-label={selectAllLabel}
          />
        </th>
        {columns.map((column) => (
          <th key={column.id} aria-sort={sort?.columnId === column.id ? sort.direction : 'none'}>
            {column.sortValue ? (
              <Button className="tk-table__sort" variant="ghost" onClick={() => onSort(column)}>
                {column.header}
                <SortIcon direction={sort?.columnId === column.id ? sort.direction : undefined} />
              </Button>
            ) : (
              column.header
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}

interface TableBodyProps<Row> {
  readonly rows: readonly Row[];
  readonly columns: readonly DataColumn<Row>[];
  readonly getRowId: (row: Row) => string;
  readonly selectedIds: ReadonlySet<string>;
  readonly selectionLabel: (id: string) => string;
  readonly onToggleRow: (id: string) => void;
}

function TableBody<Row>({
  rows,
  columns,
  getRowId,
  selectedIds,
  selectionLabel,
  onToggleRow,
}: TableBodyProps<Row>) {
  return (
    <tbody>
      {rows.map((row) => {
        const id = getRowId(row);
        return (
          <tr key={id} data-selected={selectedIds.has(id) || undefined}>
            <td className="tk-table__check">
              <input
                type="checkbox"
                checked={selectedIds.has(id)}
                onChange={() => onToggleRow(id)}
                aria-label={selectionLabel(id)}
              />
            </td>
            {columns.map((column) => (
              <td key={column.id}>{column.cell(row)}</td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
}

export function DataTable<Row>(props: DataTableProps<Row>) {
  const sorting = useTableSort(props.rows, props.columns);
  const selection = useTableSelection(props.rows, props.getRowId, props.onSelectionChange);
  return (
    <div className="tk-table__scroll">
      <table className="tk-table" aria-label={props.ariaLabel}>
        <TableHead
          columns={props.columns}
          sort={sorting.sort}
          allSelected={selection.allSelected}
          selectAllLabel={props.selectAllLabel}
          onSort={sorting.changeSort}
          onToggleAll={selection.toggleAll}
        />
        <TableBody
          rows={sorting.sortedRows}
          columns={props.columns}
          getRowId={props.getRowId}
          selectedIds={selection.selectedIds}
          selectionLabel={props.selectionLabel}
          onToggleRow={selection.toggleRow}
        />
      </table>
    </div>
  );
}
