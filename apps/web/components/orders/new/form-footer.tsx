'use client';

import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { FormAlert } from '../../auth/form-alert';
import { useErrorMessage } from '../../auth/use-error-message';

interface FormFooterProps {
  readonly invalid: boolean;
  readonly mutation: {
    readonly isPending: boolean;
    readonly isError: boolean;
    readonly error: unknown;
  };
  readonly saved: string | null;
  readonly onSaveAndNew: () => void;
}

/** Validation, API and success messages, then "Save" (opens the order) and "Save and new". */
export function FormFooter({ invalid, mutation, saved, onSaveAndNew }: FormFooterProps) {
  const t = useTranslations('orders.new');
  const errorMessage = useErrorMessage();
  return (
    <>
      <FormAlert message={invalid ? t('invalid') : null} />
      <FormAlert message={mutation.isError ? errorMessage(mutation.error) : null} />
      <FormAlert tone="success" message={saved} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={mutation.isPending}>
          {t('save')}
        </Button>
        <Button variant="secondary" disabled={mutation.isPending} onClick={onSaveAndNew}>
          {t('saveAndNew')}
        </Button>
      </div>
    </>
  );
}
