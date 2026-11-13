'use client';

import type { BenchmarkLine, DeliveryFigures } from '@trackecom/contracts';
import { Badge } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { percent } from '../../lib/claims/scorecard-view';
import { verdict } from '../../lib/claims/benchmark-view';
import { cell, ClaimsTable } from './claims-table';

const VARIANT = { below: 'danger', close: 'neutral', above: 'success' } as const;

interface Props {
  readonly title: string;
  readonly lines: readonly BenchmarkLine[];
  readonly label: (line: BenchmarkLine) => string;
}

function Figures({ figures }: { readonly figures: DeliveryFigures | null }) {
  const t = useTranslations('claims.market');
  const locale = useLocale();
  if (!figures) return <span className="text-muted">{t('hidden')}</span>;
  return (
    <>
      <span className="me-2 font-medium">{percent(figures.deliveryRate, locale)}</span>
      <span className="text-muted">{t('parcels', { count: figures.parcels })}</span>
    </>
  );
}

function Row({ line, label }: { readonly line: BenchmarkLine; readonly label: string }) {
  const t = useTranslations('claims.market');
  const result = verdict(line);
  return (
    <tr className="border-t border-border">
      <td className={cell}>{label}</td>
      <td className={cell}>{line.own ? <Figures figures={line.own} /> : '-'}</td>
      <td className={cell}>
        <Figures figures={line.market} />
      </td>
      <td className={cell}>
        {result && <Badge variant={VARIANT[result]}>{t(`verdict.${result}`)}</Badge>}
      </td>
    </tr>
  );
}

/** Own delivery rate next to the market's, one row per wilaya or carrier. */
export function MarketTable({ title, lines, label }: Props) {
  const t = useTranslations('claims.market');
  const headers = ['place', 'own', 'market', 'verdict'].map((key) => t(`columns.${key}`));
  return (
    <section aria-label={title}>
      <h3 className="font-medium">{title}</h3>
      <ClaimsTable label={title} headers={headers}>
        {lines.map((line) => (
          <Row
            key={`${line.carrier ?? '*'}-${line.wilayaCode ?? 'none'}`}
            line={line}
            label={label(line)}
          />
        ))}
      </ClaimsTable>
    </section>
  );
}
