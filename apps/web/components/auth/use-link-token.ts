'use client';

import { useSearchParams } from 'next/navigation';

/** The one-time token of an emailed or shared link (`?token=`), or null when it is missing. */
export function useLinkToken(): string | null {
  const token = useSearchParams().get('token');
  return token && token.length >= 20 ? token : null;
}
