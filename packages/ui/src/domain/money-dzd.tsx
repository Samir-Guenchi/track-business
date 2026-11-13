import type { HTMLAttributes } from 'react';

export type UiLocale = 'ar' | 'fr' | 'en';

const numberLocale: Readonly<Record<UiLocale, string>> = {
  ar: 'ar-DZ',
  fr: 'fr-DZ',
  en: 'en-DZ',
};

export interface MoneyDZDProps extends HTMLAttributes<HTMLSpanElement> {
  readonly amount: number;
  readonly locale?: UiLocale;
}

export function MoneyDZD({ amount, locale = 'fr', ...props }: MoneyDZDProps) {
  const formattedAmount = new Intl.NumberFormat(numberLocale[locale], {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(amount);
  return (
    <span dir="auto" {...props}>
      {formattedAmount}
    </span>
  );
}
