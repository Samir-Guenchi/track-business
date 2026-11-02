import { dashboardNav } from './dashboard';
import type { NavItem } from './nav-item';

/** Each feature registers its entry in its own file and adds one line here. */
const registered: readonly NavItem[] = [dashboardNav];

export const navItems: readonly NavItem[] = [...registered].sort((a, b) => a.order - b.order);

export type { NavItem, NavKey } from './nav-item';
