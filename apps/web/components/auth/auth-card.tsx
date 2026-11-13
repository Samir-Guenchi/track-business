import type { ReactNode } from 'react';
import { BrandMark } from '../shell/brand-mark';

interface AuthCardProps {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <BrandMark />
      <section className="flex flex-col gap-5 rounded-panel border border-border bg-surface p-6 shadow-panel">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{title}</h1>
          {description && <p className="text-sm text-muted">{description}</p>}
        </header>
        {children}
      </section>
      {footer && <div className="text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}
