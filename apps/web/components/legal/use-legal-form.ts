'use client';

import { type StoreLegalProfile, UpdateStoreLegalProfileRequestSchema } from '@trackecom/contracts';
import { useState } from 'react';
import { type LegalDraft, legalChange, legalDraftOf } from '../../lib/stores/legal-draft';
import { useUpdateLegalProfile } from '../../lib/stores/legal-queries';
import { useErrorMessage } from '../auth/use-error-message';

export interface LegalFormState {
  readonly draft: LegalDraft;
  readonly patch: (change: Partial<LegalDraft>) => void;
  /** Fields the schema refused, by name. */
  readonly invalid: ReadonlySet<string>;
  readonly apiError: string | null;
  readonly isPending: boolean;
  readonly save: () => Promise<boolean>;
}

/** Holds the legal draft and sends only what changed, checked by the shared schema first. */
export function useLegalForm(saved: StoreLegalProfile): LegalFormState {
  const [draft, setDraft] = useState(() => legalDraftOf(saved));
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(new Set());
  const mutation = useUpdateLegalProfile();
  const toMessage = useErrorMessage();

  const save = async (): Promise<boolean> => {
    const change = legalChange(draft, saved);
    if (change === null) return true;
    const parsed = UpdateStoreLegalProfileRequestSchema.safeParse(change);
    if (!parsed.success) {
      setInvalid(new Set(parsed.error.issues.map((issue) => String(issue.path[0]))));
      return false;
    }
    return (await mutation.mutateAsync(parsed.data).catch(() => null)) !== null;
  };

  return {
    draft,
    patch: (change) => {
      setDraft((current) => ({ ...current, ...change }));
      setInvalid(new Set());
    },
    invalid,
    apiError: mutation.error ? toMessage(mutation.error) : null,
    isPending: mutation.isPending,
    save,
  };
}
