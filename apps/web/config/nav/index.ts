import { dashboardNav } from './dashboard';
import { followupsNav } from './followups';
import { formsNav } from './forms';
import type { NavItem } from './nav-item';
import { ordersNav } from './orders';
import { returnsNav } from './returns';

/** Each feature registers its entry in its own file and adds one line here. */
const registered: readonly NavItem[] = [
  dashboardNav,
  ordersNav,
  followupsNav,
  returnsNav,
  formsNav,
];

export const navItems: readonly NavItem[] = [...registered].sort((a, b) => a.order - b.order);

export type { NavItem, NavKey } from './nav-item';
