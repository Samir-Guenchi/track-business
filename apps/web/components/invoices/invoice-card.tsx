'use client';

import type { Invoice, Order } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { ApiClientError } from '../../lib/api/api-client-error';
import { printPage } from '../../lib/claims/print-letter';
import { invoiceHtml } from '../../lib/invoices/invoice-html';
import { useIssueInvoice, useOrderInvoices } from '../../lib/invoices/invoice-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { DetailCard } from '../orders/detail/detail-card';
import { useInvoiceText } from './use-invoice-text';

const LEGAL_INCOMPLETE = 'invoices.legal_profile_incomplete';

/** The invoice of a delivered order (#140): issue it, print it, cancel it with a credit note. */
export function InvoiceCard({ order }: { readonly order: Order }) {
  const t = useTranslations('invoices');
  const invoices = useOrderInvoices(order.id);
  const issue = useIssueInvoice(order.id);
  if (order.status !== 'delivered' || invoices.isError) return null;
  const items = invoices.data?.items ?? [];
  const invoice = items.find((item) => item.kind === 'invoice');
  const credit = items.find((item) => item.kind === 'credit_note');
  return (
    <DetailCard title={t('title')}>
      <IssueError error={issue.invoice.error ?? issue.creditNote.error} />
      {invoice ? (
        <DocumentRow document={invoice} />
      ) : (
        <Action pending={issue.invoice.isPending} onClick={() => issue.invoice.mutate()}>
          {t('issue')}
        </Action>
      )}
      {invoice && !credit && (
        <Action
          pending={issue.creditNote.isPending}
          onClick={() => issue.creditNote.mutate(invoice.id)}
        >
          {t('creditNote')}
        </Action>
      )}
      {credit && <DocumentRow document={credit} />}
    </DetailCard>
  );
}

interface ActionProps {
  readonly pending: boolean;
  readonly onClick: () => void;
  readonly children: string;
}

const Action = ({ pending, onClick, children }: ActionProps) => (
  <Button variant="secondary" className="self-start" loading={pending} onClick={onClick}>
    {children}
  </Button>
);

/** The API's reason, with a way to fix the legal profile when that is what is missing. */
function IssueError({ error }: { readonly error: Error | null }) {
  const t = useTranslations('invoices');
  const errorMessage = useErrorMessage();
  if (!error) return null;
  const legal = error instanceof ApiClientError && error.code === LEGAL_INCOMPLETE;
  return (
    <>
      <FormAlert message={errorMessage(error)} />
      {legal && (
        <Link href="/settings/legal" className="text-sm text-tape underline">
          {t('openLegal')}
        </Link>
      )}
    </>
  );
}

function DocumentRow({ document }: { readonly document: Invoice }) {
  const t = useTranslations('invoices');
  const textOf = useInvoiceText();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span>
        {t(`kind.${document.kind}`)} <span dir="ltr">{document.number}</span>
      </span>
      <Button variant="secondary" onClick={() => printPage(invoiceHtml(textOf(document)))}>
        {t('print.action')}
      </Button>
    </div>
  );
}
