'use client';

import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { FormAlert } from '../auth/form-alert';
import { CarrierSelect } from './carrier-select';
import { ScanInput } from './scan-input';
import { ScannedList } from './scanned-list';
import { useReceiveForm } from './use-receive-form';

/** Scan what a courier hands back (#133); saving opens the manifest to print and sign. */
export function ReceiveForm() {
  const t = useTranslations('returns.receive');
  const form = useReceiveForm();
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </header>
      <div className="flex flex-col gap-4 rounded-panel border border-border bg-surface p-5 shadow-panel">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="return-carrier" className="tk-field__label">
              {t('carrier')}
            </label>
            <CarrierSelect id="return-carrier" value={form.carrier} onChange={form.setCarrier} />
          </div>
          <Input
            label={t('courier')}
            maxLength={120}
            value={form.fields.courierName}
            onChange={(event) => form.patch({ courierName: event.currentTarget.value })}
          />
        </div>
        <ScanInput onScan={form.scan} />
        <ScannedList form={form} />
        <DeclaredField form={form} />
        <FormAlert message={form.error} />
        <Button className="self-start" loading={form.saving} onClick={form.submit}>
          {t('submit')}
        </Button>
      </div>
    </section>
  );
}

function DeclaredField({ form }: { readonly form: ReturnType<typeof useReceiveForm> }) {
  const t = useTranslations('returns.receive');
  return (
    <>
      <label className="tk-field">
        <span className="tk-field__label">{t('declared')}</span>
        <textarea
          className="tk-input min-h-20 py-2"
          dir="ltr"
          value={form.fields.declared}
          onChange={(event) => form.patch({ declared: event.currentTarget.value })}
        />
        <span className="text-xs text-muted">{t('declaredHint')}</span>
      </label>
      <label className="tk-field">
        <span className="tk-field__label">{t('note')}</span>
        <textarea
          className="tk-input min-h-16 py-2"
          maxLength={500}
          value={form.fields.note}
          onChange={(event) => form.patch({ note: event.currentTarget.value })}
        />
      </label>
    </>
  );
}
