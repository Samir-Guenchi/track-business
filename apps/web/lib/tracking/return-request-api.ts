import {
  type CreateReturnRequest,
  type PublicReturnStatus,
  PublicReturnStatusSchema,
} from '@trackecom/contracts';
import { apiBaseUrl } from '../api/api-base-url';

const url = (code: string) =>
  `${apiBaseUrl}/public/tracking/${encodeURIComponent(code)}/return-request`;

/** Whether the customer can ask for a return or exchange (#201), and their request. */
export async function fetchReturnStatus(code: string): Promise<PublicReturnStatus | null> {
  const response = await fetch(url(code), { cache: 'no-store' });
  if (!response.ok) return null;
  return PublicReturnStatusSchema.parse(await response.json());
}

/** The new status, or null when the request could not be saved. */
export async function sendReturnRequest(
  code: string,
  body: CreateReturnRequest,
): Promise<PublicReturnStatus | null> {
  const response = await fetch(url(code), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) return null;
  return PublicReturnStatusSchema.parse(await response.json());
}
