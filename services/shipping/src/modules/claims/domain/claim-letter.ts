import type { ClaimLetter, ClaimReason } from '@trackecom/contracts';
import { LETTER_TEXTS } from './claim-letter.texts.js';

export interface LetterEvent {
  readonly at: Date;
  readonly label: string;
  readonly location: string | null;
}

export interface LetterInput {
  readonly lang: 'fr' | 'ar';
  readonly reason: ClaimReason;
  readonly carrier: string;
  readonly trackingNumber: string;
  readonly reference: string;
  readonly shippedAt: Date;
  readonly declaredValue: number;
  readonly note: string | null;
  readonly events: readonly LetterEvent[];
}

/** Dates as the carrier's agents read them: Algiers time, day first. */
const formatDate = (at: Date, withTime: boolean): string =>
  new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Algiers',
    dateStyle: 'short',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(at);

const eventLine = (event: LetterEvent): string =>
  `- ${formatDate(event.at, true)} : ${event.label}${event.location ? ` (${event.location})` : ''}`;

/** The claim letter (#139): the facts the carrier asks for, in French or Arabic. */
export function claimLetter(input: LetterInput): ClaimLetter {
  const t = LETTER_TEXTS[input.lang];
  const facts = {
    tracking: input.trackingNumber,
    reference: input.reference,
    carrier: input.carrier,
    date: formatDate(input.shippedAt, false),
    value: new Intl.NumberFormat('fr-FR').format(input.declaredValue),
  };
  const timeline = input.events.length > 0 ? input.events.map(eventLine) : [t.noEvents];
  const body = [
    t.greeting,
    '',
    t.intro(facts),
    `${t.reasonLabel} ${t.reasons[input.reason]}`,
    t.value(facts),
    '',
    t.timeline,
    ...timeline,
    '',
    ...(input.note ? [`${t.noteLabel} ${input.note}`, ''] : []),
    t.ask,
    '',
    t.closing,
  ].join('\n');
  return { subject: t.subject(facts, t.reasons[input.reason]), body };
}
