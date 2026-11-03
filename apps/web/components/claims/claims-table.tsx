import type { ReactNode } from 'react';

interface Props {
  readonly label: string;
  readonly headers: readonly string[];
  readonly children: ReactNode;
}

/** The panel-and-table frame the three tabs share. */
export function ClaimsTable({ label, headers, children }: Props) {
  return (
    <div className="mt-3 overflow-x-auto rounded-panel border border-border bg-surface p-3 shadow-panel">
      <table className="w-full text-sm" aria-label={label}>
        <thead className="text-muted">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-2 py-1 text-start font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const cell = 'px-2 py-2';
