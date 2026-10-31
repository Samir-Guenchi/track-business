import type { Commune, Wilaya } from '@trackecom/contracts';
import { useState } from 'react';
import { MoneyDZD, StatusBadge, WilayaCommuneSelect } from '../index.js';
import type { UiLocale } from '../domain/money-dzd.js';
import type { StoryCopy } from './copy.js';

const wilayas: readonly Wilaya[] = [{ code: 16, nameAr: 'الجزائر', nameFr: 'Alger' }];
const communes: readonly Commune[] = [
  {
    id: 1,
    wilayaCode: 16,
    nameAr: 'الجزائر الوسطى',
    nameFr: 'Alger-Centre',
    postalCode: '16000',
    hasStopDesk: false,
  },
];

export function DomainSection({
  copy,
  locale,
}: {
  readonly copy: StoryCopy;
  readonly locale: UiLocale;
}) {
  const [wilayaCode, setWilayaCode] = useState<number | undefined>(16);
  const [communeId, setCommuneId] = useState<number | undefined>(1);
  return (
    <section className="tk-showcase__section">
      <h2>{copy.data}</h2>
      <div className="tk-showcase__controls tk-showcase__controls--domain">
        <WilayaCommuneSelect
          wilayas={wilayas}
          communes={communes}
          locale={locale}
          wilayaCode={wilayaCode}
          communeId={communeId}
          wilayaLabel={copy.wilaya}
          communeLabel={copy.commune}
          wilayaPlaceholder={copy.wilayaPlaceholder}
          communePlaceholder={copy.communePlaceholder}
          searchLabel={copy.search}
          emptyLabel={copy.noResults}
          onWilayaChange={setWilayaCode}
          onCommuneChange={setCommuneId}
        />
        <div className="tk-showcase__inline">
          <span>{copy.exampleAmount}</span>
          <MoneyDZD amount={12500} locale={locale} />
        </div>
        <div className="tk-showcase__inline">
          <span>{copy.status}</span>
          <StatusBadge status="in_transit">{copy.inTransit}</StatusBadge>
        </div>
      </div>
    </section>
  );
}
