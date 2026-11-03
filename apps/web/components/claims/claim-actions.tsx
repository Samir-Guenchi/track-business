'use client';

import type { Claim, UpdateClaimRequest } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { useUpdateClaim } from '../../lib/claims/claims-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { ClaimLetterDialog } from './claim-letter-dialog';

/** The next step of a claim: send it, then record the carrier's answer. Always the letter. */
export function ClaimActions({ claim }: { readonly claim: Claim }) {
  const t = useTranslations('claims.actions');
  const update = useUpdateClaim();
  const errorMessage = useErrorMessage();
  const [winning, setWinning] = useState(false);
  const move = (body: UpdateClaimRequest) => update.mutate({ id: claim.id, body });
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <ClaimLetterDialog claim={claim} />
        {claim.state === 'open' && (
          <Button
            size="sm"
            onClick={() => move({ state: 'submitted' })}
            disabled={update.isPending}
          >
            {t('submitted')}
          </Button>
        )}
        {claim.state === 'submitted' && !winning && (
          <>
            <Button size="sm" onClick={() => setWinning(true)}>
              {t('won')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => move({ state: 'rejected' })}>
              {t('rejected')}
            </Button>
          </>
        )}
      </div>
      {winning && claim.state === 'submitted' && (
        <WonForm
          initial={claim.declaredValue}
          busy={update.isPending}
          onSave={(recovered) => move({ state: 'won', recovered })}
        />
      )}
      <FormAlert message={update.isError ? errorMessage(update.error) : null} />
    </div>
  );
}

interface WonFormProps {
  readonly initial: number;
  readonly busy: boolean;
  readonly onSave: (recovered: number) => void;
}

/** What the carrier paid back, the declared value by default. */
function WonForm({ initial, busy, onSave }: WonFormProps) {
  const t = useTranslations('claims.actions');
  const [amount, setAmount] = useState(initial);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(amount);
  };
  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <Input
        type="number"
        min={0}
        label={t('recovered')}
        value={amount}
        onChange={(event) =>
          setAmount(Math.max(0, Math.floor(Number(event.currentTarget.value) || 0)))
        }
      />
      <Button type="submit" size="sm" disabled={busy}>
        {t('confirmWon')}
      </Button>
    </form>
  );
}
