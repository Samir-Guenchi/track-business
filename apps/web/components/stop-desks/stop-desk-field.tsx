'use client';

import { StopDeskPicker } from '@trackecom/ui';
import { LocateFixed } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { osmEmbedUrl, toDeskOption } from '../../lib/stop-desks/desk-options';
import { useStopDesks } from './use-stop-desks';

interface StopDeskFieldProps {
  readonly wilayaCode: number | undefined;
  readonly communeId: number | undefined;
  readonly value: string;
  readonly onChange: (stopDeskId: string) => void;
  /** Shown instead of the picker when no desk is known here (e.g. a typed carrier code). */
  readonly fallback?: ReactNode;
}

/** Stop-desk picker for the order forms (#137), with "near me" and a small map of the pick. */
export function StopDeskField(props: StopDeskFieldProps) {
  const { wilayaCode, communeId, value, onChange, fallback } = props;
  const t = useTranslations('stopDesks');
  const locale = useLocale();
  const { desks, locate, locating } = useStopDesks(wilayaCode, communeId);
  if (desks.length === 0 && fallback) return fallback;
  const chosen = desks.find((desk) => desk.id === value);
  const located = chosen && chosen.lat !== null && chosen.lng !== null;
  return (
    <StopDeskPicker
      options={desks.map((desk) => toDeskOption(desk, locale))}
      value={value || null}
      onChange={onChange}
      required={desks.length > 0}
      labels={{ legend: t('legend'), empty: t('empty'), openMap: t('openMap') }}
      action={
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="flex items-center gap-1 text-sm text-tape underline"
        >
          <LocateFixed size={14} aria-hidden />
          {locating ? t('locating') : t('nearMe')}
        </button>
      }
      preview={
        located ? (
          <iframe
            title={t('mapTitle', { name: chosen.name })}
            src={osmEmbedUrl({ lat: chosen.lat ?? 0, lng: chosen.lng ?? 0 })}
            className="h-40 w-full rounded-panel border border-border"
            loading="lazy"
          />
        ) : null
      }
    />
  );
}
