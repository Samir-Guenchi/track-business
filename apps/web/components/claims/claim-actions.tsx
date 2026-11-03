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
  const update = useUpdateClaim();
  const errorMessage = useErrorMessage();
  const [winning, setWinning] = useState(false);
  const move = (body: UpdateClaimRequest) => update.mutate({ id: claim.id, body });
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <ClaimLetterDialog claim={claim} />
        <NextStep
          claim={claim}
          winning={winning}
          busy={update.isPending}
          onWin={() => setWinning(true)}
          onMove={move}
        />
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

interface NextStepProps {
  readonly claim: Claim;
  readonly winning: boolean;
  readonly busy: boolean;
  readonly onWin: () => void;
  readonly onMove: (body: UpdateClaimRequest) => void;
}

/** "Marquer envoyée" on an open claim; "Gagnée" or "Refusée" on a sent one. */
function NextStep({ claim, winning, busy, onWin, onMove }: NextStepProps) {
  const t = useTranslations('claims.actions');
  if (claim.state === 'open')
    return (
      <Button size="sm" onClick={() => onMove({ state: 'submitted' })} disabled={busy}>
        {t('submitted')}
      </Button>
    );
  if (claim.state !== 'submitted' || winning) return null;
  return (
    <>
      <Button size="sm" onClick={onWin}>
        {t('won')}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onMove({ state: 'rejected' })}
        disabled={busy}
      >
        {t('rejected')}
      </Button>
    </>
  );
}
