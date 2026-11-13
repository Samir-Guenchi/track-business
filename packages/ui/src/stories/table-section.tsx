import { useState } from 'react';
import {
  DataTable,
  EmptyState,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../index.js';
import type { StoryCopy } from './copy.js';

interface ExampleRow {
  readonly id: string;
  readonly status: string;
}

function OrderTabs({ copy }: { readonly copy: StoryCopy }) {
  const [selected, setSelected] = useState<readonly string[]>([]);
  const rows: readonly ExampleRow[] = [
    { id: 'Order A', status: copy.inTransit },
    { id: 'Order B', status: copy.status },
  ];
  return (
    <Tabs defaultValue="details">
      <TabsList aria-label={copy.data}>
        <TabsTrigger value="details">{copy.details}</TabsTrigger>
        <TabsTrigger value="activity">{copy.activity}</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <DataTable
          rows={rows}
          getRowId={(row) => row.id}
          ariaLabel={copy.data}
          selectAllLabel={copy.selectAll}
          selectionLabel={(id) => `${copy.selectRow} ${id}`}
          onSelectionChange={setSelected}
          columns={[
            { id: 'id', header: copy.order, cell: (row) => row.id, sortValue: (row) => row.id },
            {
              id: 'status',
              header: copy.state,
              cell: (row) => row.status,
              sortValue: (row) => row.status,
            },
          ]}
        />
        <p className="tk-showcase__note">
          {copy.selectedRows}: {selected.length}
        </p>
      </TabsContent>
      <TabsContent value="activity">
        <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      </TabsContent>
    </Tabs>
  );
}

export function TableSection({ copy }: { readonly copy: StoryCopy }) {
  return (
    <section className="tk-showcase__section">
      <h2>{copy.data}</h2>
      <OrderTabs copy={copy} />
      <div className="tk-showcase__loading">
        <span>{copy.loading}</span>
        <Skeleton />
      </div>
    </section>
  );
}
