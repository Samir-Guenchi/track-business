import { useTranslations } from 'next-intl';
import { ApiClientError } from '../../lib/api/api-client-error';
import { useErrorMessage } from '../auth/use-error-message';

const PREFIX = 'pickup_points.';

/** A clear sentence for drop and release refusals; the generic message otherwise. */
export function usePickupError(): (error: unknown) => string | null {
  const t = useTranslations('pickupPoints.errors');
  const generic = useErrorMessage();
  return (error) => {
    if (!error) return null;
    const code = error instanceof ApiClientError ? error.code : '';
    const key = code.startsWith(PREFIX) ? code.slice(PREFIX.length) : '';
    return key && t.has(key) ? t(key) : generic(error);
  };
}
