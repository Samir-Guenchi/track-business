import { dashboardNav } from './dashboard';
import type { NavItem } from './nav-item';
import { ordersNav } from './orders';

/** Each feature registers its entry in its own file and adds one line here. */
const registered: readonly NavItem[] = [dashboardNav, ordersNav];

export const navItems: readonly NavItem[] = [...registered].sort((a, b) => a.order - b.order);

export type { NavItem, NavKey } from './nav-item';
