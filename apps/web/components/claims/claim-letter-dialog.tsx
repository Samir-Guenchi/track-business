'use client';

import type { Claim } from '@trackecom/contracts';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Skeleton,
} from '@trackecom/ui';
import { Copy, FileText, Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useClaimLetter } from '../../lib/claims/claims-queries';
import { printLetter } from '../../lib/claims/print-letter';

const LANGS = ['fr', 'ar'] as const;

/** The claim letter in French or Arabic, to copy into an e-mail or print. */
export function ClaimLetterDialog({ claim }: { readonly claim: Claim }) {
  const t = useTranslations('claims.letter');
  const actions = useTranslations('claims.actions');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <FileText size={14} aria-hidden />
          {actions('letter')}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t('close')}>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>{t('description')}</DialogDescription>
        <LetterBody claimId={claim.id} />
      </DialogContent>
    </Dialog>
  );
}

type Lang = (typeof LANGS)[number];

function LetterBody({ claimId }: { readonly claimId: string }) {
  const [lang, setLang] = useState<Lang>('fr');
  const letter = useClaimLetter(claimId, lang);
  const t = useTranslations('claims.letter');
  const text = letter.data ? `${letter.data.subject}\n\n${letter.data.body}` : '';
  return (
    <div className="flex flex-col gap-3">
      <LangSwitch value={lang} onChange={setLang} />
      {letter.isPending && <Skeleton className="h-48" />}
      {letter.data && (
        <textarea
          readOnly
          aria-label={t('label')}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="h-64 w-full rounded-control border border-border bg-canvas p-2 text-sm"
          value={text}
        />
      )}
      <LetterButtons text={text} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
    </div>
  );
}

function LangSwitch({
  value,
  onChange,
}: {
  readonly value: Lang;
  readonly onChange: (lang: Lang) => void;
}) {
  const t = useTranslations('claims.letter');
  return (
    <div className="flex gap-2" role="group" aria-label={t('label')}>
      {LANGS.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={value === option ? 'primary' : 'secondary'}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {t(option)}
        </Button>
      ))}
    </div>
  );
}

function LetterButtons({ text, dir }: { readonly text: string; readonly dir: 'ltr' | 'rtl' }) {
  const t = useTranslations('claims.letter');
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" onClick={() => void copy()} disabled={!text}>
        <Copy size={14} aria-hidden />
        {copied ? t('copied') : t('copy')}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => printLetter(text, dir)} disabled={!text}>
        <Printer size={14} aria-hidden />
        {t('print')}
      </Button>
    </div>
  );
}
