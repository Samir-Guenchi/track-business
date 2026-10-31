import type { RiskFlag } from '@trackecom/contracts';

/** Orders from one phone within this window count towards a burst. */
export const BURST_WINDOW_MS = 10 * 60_000;
/** This many earlier orders in the window (so the new one is the third) is a burst. */
export const BURST_THRESHOLD = 2;

const isRun = (digits: string, step: 1 | -1): boolean =>
  [...digits].every(
    (digit, i) => i === 0 || Number(digit) === (Number(digits[i - 1]) + step + 10) % 10,
  );

/**
 * True for subscriber numbers nobody really has: all one digit (0555 555555), or a straight
 * run (0555 123456, 0666 987654). Takes an E.164 Algerian mobile, e.g. +213555123456.
 */
export function isSuspiciousPhone(phone: string): boolean {
  const subscriber = phone.slice(-6);
  if (new Set(subscriber).size === 1) return true;
  return isRun(subscriber, 1) || isRun(subscriber, -1);
}

const LATIN_VOWEL = /[aeiouyàâäéèêëîïôöùûü]/i;
const LATIN = /[a-z]/i;
const DIGIT = /\d/;
const REPEAT = /(.)\1{3,}/u;

/**
 * True for names typed to get past the form: digits, a letter repeated four times, or Latin
 * words of four letters or more without a vowel ("xzkq"). Arabic script is never judged on
 * vowels, since short vowels are not written.
 */
export function isGibberishName(name: string): boolean {
  if (DIGIT.test(name) || REPEAT.test(name)) return true;
  return name
    .split(/\s+/)
    .some((word) => word.length >= 4 && LATIN.test(word) && !LATIN_VOWEL.test(word));
}

/** What blacklist names are compared on: lowercase, no accents, single spaces. */
export const nameKey = (name: string): string =>
  name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

export interface RiskFacts {
  readonly phone: string;
  readonly name: string;
  readonly blacklisted: boolean;
  /** Orders already placed from this phone within BURST_WINDOW_MS. */
  readonly recentOrders: number;
}

/** The flags an incoming order gets (#52); an empty list means nothing looked wrong. */
export function assessRisk(facts: RiskFacts): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (facts.blacklisted) flags.push('blacklisted');
  if (isSuspiciousPhone(facts.phone)) flags.push('suspicious_phone');
  if (facts.recentOrders >= BURST_THRESHOLD) flags.push('order_burst');
  if (isGibberishName(facts.name)) flags.push('gibberish_name');
  return flags;
}
