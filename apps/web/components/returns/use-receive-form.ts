'use client';

import type { CreateReturnBatchInput, ReturnCondition } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '../../i18n/navigation';
import { useReceiveReturns } from '../../lib/returns/returns-queries';
import { type ScanRow, addScan, parseDeclared } from '../../lib/returns/scan-list';
import { useErrorMessage } from '../auth/use-error-message';

interface ExtraFields {
  readonly courierName: string;
  readonly declared: string;
  readonly note: string;
}

const NO_EXTRAS: ExtraFields = { courierName: '', declared: '', note: '' };

/** The request body; blank optional fields are left out. */
function batchBody(carrier: string, rows: ScanRow[], fields: ExtraFields): CreateReturnBatchInput {
  const declared = parseDeclared(fields.declared);
  const courierName = fields.courierName.trim();
  const note = fields.note.trim();
  return {
    carrier,
    scanned: rows,
    ...(declared.length > 0 ? { declared } : {}),
    ...(courierName ? { courierName } : {}),
    ...(note ? { note } : {}),
  };
}

/** State of a hand-over: the carrier, the scanned parcels, the courier's list, and saving. */
export function useReceiveForm() {
  const t = useTranslations('returns.receive');
  const router = useRouter();
  const receive = useReceiveReturns();
  const errorMessage = useErrorMessage();
  const [carrier, setCarrier] = useState<string | undefined>();
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [fields, setFields] = useState<ExtraFields>(NO_EXTRAS);
  const [problem, setProblem] = useState<string | null>(null);

  const setCondition = (trackingNumber: string, condition: ReturnCondition) =>
    setRows(
      rows.map((row) => (row.trackingNumber === trackingNumber ? { ...row, condition } : row)),
    );

  const submit = () => {
    if (!carrier) return setProblem(t('noCarrier'));
    if (rows.length === 0) return setProblem(t('noScan'));
    setProblem(null);
    receive.mutate(batchBody(carrier, rows, fields), {
      onSuccess: (batch) => router.push(`/returns/batches/${batch.id}`),
    });
  };

  return {
    carrier,
    setCarrier,
    rows,
    scan: (raw: string) => setRows(addScan(rows, raw)),
    remove: (trackingNumber: string) =>
      setRows(rows.filter((row) => row.trackingNumber !== trackingNumber)),
    setCondition,
    fields,
    patch: (patch: Partial<ExtraFields>) => setFields({ ...fields, ...patch }),
    submit,
    saving: receive.isPending,
    error: problem ?? (receive.error ? errorMessage(receive.error) : null),
  };
}

export type ReceiveForm = ReturnType<typeof useReceiveForm>;
