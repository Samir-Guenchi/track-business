import {
  type AttemptAnswer,
  type PublicAttemptCheck,
  PublicAttemptCheckSchema,
} from '@trackecom/contracts';
import { apiBaseUrl } from '../api/api-base-url';

const url = (code: string) =>
  `${apiBaseUrl}/public/tracking/${encodeURIComponent(code)}/attempt-check`;

/** The open question about the last failed attempt (#195); null when there is none. */
export async function fetchAttemptCheck(code: string): Promise<PublicAttemptCheck['check']> {
  const response = await fetch(url(code), { cache: 'no-store' });
  if (!response.ok) return null;
  return PublicAttemptCheckSchema.parse(await response.json()).check;
}

/** The saved question with its answer, or null when it could not be saved. */
export async function answerAttemptCheck(
  code: string,
  answer: { eventId: string; answer: AttemptAnswer },
): Promise<PublicAttemptCheck['check']> {
  const response = await fetch(url(code), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(answer),
  });
  if (!response.ok) return null;
  return PublicAttemptCheckSchema.parse(await response.json()).check;
}
