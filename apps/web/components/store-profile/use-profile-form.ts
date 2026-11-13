'use client';

import { type StoreProfile, UpdateStoreProfileRequestSchema } from '@trackecom/contracts';
import { useState } from 'react';
import { type ProfileDraft, draftOf, profileChange } from '../../lib/stores/profile-draft';
import { useUpdateStoreProfile } from '../../lib/stores/store-profile-queries';
import { useErrorMessage } from '../auth/use-error-message';

export type ProfileField = 'origin' | 'contactPhone';

export interface ProfileFormState {
  readonly draft: ProfileDraft;
  readonly patch: (change: Partial<ProfileDraft>) => void;
  readonly errors: ReadonlySet<ProfileField>;
  readonly apiError: string | null;
  readonly isPending: boolean;
  readonly save: () => Promise<boolean>;
}

const fieldOf = (path: PropertyKey | undefined): ProfileField =>
  path === 'contactPhone' ? 'contactPhone' : 'origin';

/** Holds the draft, sends only what changed and says which field the API refused. */
export function useProfileForm(saved: StoreProfile): ProfileFormState {
  const [draft, setDraft] = useState(() => draftOf(saved));
  const [errors, setErrors] = useState<ReadonlySet<ProfileField>>(new Set());
  const mutation = useUpdateStoreProfile();
  const toMessage = useErrorMessage();

  const save = async (): Promise<boolean> => {
    const change = profileChange(draft, saved);
    if (change === null) return true;
    const parsed = UpdateStoreProfileRequestSchema.safeParse(change);
    if (!parsed.success) {
      setErrors(new Set(parsed.error.issues.map((issue) => fieldOf(issue.path[0]))));
      return false;
    }
    setErrors(new Set());
    const result = await mutation.mutateAsync(parsed.data).catch(() => null);
    return result !== null;
  };

  return {
    draft,
    patch: (change) => {
      setDraft((current) => ({ ...current, ...change }));
      setErrors(new Set());
    },
    errors,
    apiError: mutation.error ? toMessage(mutation.error) : null,
    isPending: mutation.isPending,
    save,
  };
}
