import { Settings } from 'lucide-react';
import type { NavItem } from './nav-item';

export const settingsNav: NavItem = {
  key: 'settings',
  href: '/settings/store',
  icon: Settings,
  order: 90,
};
