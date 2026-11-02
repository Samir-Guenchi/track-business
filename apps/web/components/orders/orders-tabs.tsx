'use client';

import { Tabs, TabsList, TabsTrigger } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { isStatusTab, STATUS_TAB_KEYS, type StatusTab } from '../../lib/orders/status-tabs';

interface OrdersTabsProps {
  readonly value: StatusTab;
  readonly onChange: (tab: StatusTab) => void;
}

// TODO(#23): counters per tab need a `GET /orders/counts` endpoint in the orders service.
export function OrdersTabs({ value, onChange }: OrdersTabsProps) {
  const t = useTranslations('orders.tabs');
  return (
    <Tabs value={value} onValueChange={(next) => isStatusTab(next) && onChange(next)}>
      <TabsList className="overflow-x-auto">
        {STATUS_TAB_KEYS.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {t(tab)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
