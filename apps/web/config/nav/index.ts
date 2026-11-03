import { claimsNav } from './claims';
import { dashboardNav } from './dashboard';
import { deliveryRequestsNav } from './delivery-requests';
import { followupsNav } from './followups';
import { formsNav } from './forms';
import { liveNav } from './live';
import { resellersNav } from './resellers';
import type { NavItem } from './nav-item';
import { ordersNav } from './orders';
import { returnRequestsNav } from './return-requests';
import { returnsNav } from './returns';
import { settingsNav } from './settings';
import { stuckParcelsNav } from './stuck-parcels';

/** Each feature registers its entry in its own file and adds one line here. */
const registered: readonly NavItem[] = [
  dashboardNav,
  ordersNav,
  liveNav,
  resellersNav,
  followupsNav,
  stuckParcelsNav,
  returnsNav,
  returnRequestsNav,
  formsNav,
  deliveryRequestsNav,
  claimsNav,
  settingsNav,
];

export const navItems: readonly NavItem[] = [...registered].sort((a, b) => a.order - b.order);

export type { NavItem, NavKey } from './nav-item';
