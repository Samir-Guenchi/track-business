'use client';

import { useTranslations } from 'next-intl';
import type { DraftControls } from './use-order-draft';

export function NotesField({ controls }: { readonly controls: DraftControls }) {
  const t = useTranslations('orders.new');
  return (
    <label className="tk-field">
      <span className="tk-field__label">{t('notes')}</span>
      <textarea
        className="tk-input min-h-20 py-2"
        maxLength={1000}
        value={controls.draft.notes}
        onChange={(event) => controls.patch({ notes: event.currentTarget.value })}
      />
    </label>
  );
}
