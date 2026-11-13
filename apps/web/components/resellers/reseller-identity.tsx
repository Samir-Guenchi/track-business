'use client';

import type { Reseller } from '@trackecom/contracts';
import { Badge } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { looksRisky } from '../../lib/resellers/reseller-view';

const initial = (name: string): string => name.trim().charAt(0).toUpperCase() || '·';

/** Monogram, name, phone and the two state badges. */
export function ResellerIdentity({ reseller }: { readonly reseller: Reseller }) {
  const t = useTranslations('resellers');
  return (
    <div className="studio-reseller__head">
      <div className="studio-reseller__id">
        <span className="studio-reseller__monogram" aria-hidden="true">
          {initial(reseller.name)}
        </span>
        <div>
          <h3 className="studio-reseller__name">{reseller.name}</h3>
          <p className="studio-reseller__meta">
            <span dir="ltr">{reseller.phone}</span>
          </p>
        </div>
      </div>
      <div className="studio-reseller__badges">
        {looksRisky(reseller.stats) && <Badge variant="warning">{t('risky')}</Badge>}
        <Badge variant={reseller.active ? 'success' : 'neutral'}>
          {t(reseller.active ? 'active' : 'paused')}
        </Badge>
      </div>
    </div>
  );
}
