import type { HTMLAttributes } from 'react';
import { cn } from '../cn.js';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('tk-skeleton', className)} {...props} />;
}
