'use client';

import { FailedAttemptReasonSchema, FollowupStatusSchema } from '@trackecom/contracts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import type { FollowupFilters } from '../../lib/followups/followup-filters';

const ALL = 'all';

interface ToolbarProps {
  readonly filters: FollowupFilters;
  readonly onChange: (filters: FollowupFilters) => void;
}

export function FollowupsToolbar({ filters, onChange }: ToolbarProps) {
  const t = useTranslations('followups');
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={filters.status}
        onValueChange={(value) =>
          onChange({ ...filters, status: FollowupStatusSchema.parse(value) })
        }
      >
        <TabsList>
          {FollowupStatusSchema.options.map((status) => (
            <TabsTrigger key={status} value={status}>
              {t(`status.${status}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-center gap-3">
        <ReasonSelect filters={filters} onChange={onChange} />
        {filters.status === 'open' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.overdue}
              onChange={(event) => onChange({ ...filters, overdue: event.currentTarget.checked })}
            />
            {t('overdue')}
          </label>
        )}
      </div>
    </div>
  );
}

function ReasonSelect({ filters, onChange }: ToolbarProps) {
  const t = useTranslations('followups');
  const choose = (value: string) =>
    onChange({
      ...filters,
      reason: value === ALL ? undefined : FailedAttemptReasonSchema.parse(value),
    });
  return (
    <Select value={filters.reason ?? ALL} onValueChange={choose}>
      <SelectTrigger aria-label={t('columns.reason')} className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t('allReasons')}</SelectItem>
        {FailedAttemptReasonSchema.options.map((reason) => (
          <SelectItem key={reason} value={reason}>
            {t(`reason.${reason}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
