import { AttemptChecksReportSchema } from '@trackecom/contracts';
import { apiRequest } from './api-client';

/** Failed attempts customers say never happened (#195), served by the shipping service. */
export const attemptChecksApi = {
  report: (days: number) =>
    apiRequest({ path: `/attempt-checks?days=${days}`, schema: AttemptChecksReportSchema }),
};
