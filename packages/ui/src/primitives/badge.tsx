import type { HTMLAttributes } from 'react';
import { cn } from '../cn.js';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return <span className={cn('tk-badge', className)} data-variant={variant} {...props} />;
}
