import type { LucideIcon } from 'lucide-react';

/** Keys of `shell.nav` in messages/{locale}/shell.json. */
export type NavKey = 'dashboard' | 'orders' | 'confirmation' | 'shipments' | 'money' | 'settings';

export interface NavItem {
  readonly key: NavKey;
  /** Path without the locale prefix, e.g. `/orders`. */
  readonly href: string;
  readonly icon: LucideIcon;
  /** Lower comes first in the sidebar. */
  readonly order: number;
}
