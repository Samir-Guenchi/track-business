import type { ReactNode } from 'react';

export interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="tk-empty" aria-live="polite">
      <h2 className="tk-empty__title">{title}</h2>
      <p className="tk-empty__description">{description}</p>
      {action && <div className="tk-empty__action">{action}</div>}
    </section>
  );
}
