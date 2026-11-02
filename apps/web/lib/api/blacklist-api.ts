import { ListBlacklistResponseSchema } from '@trackecom/contracts';
import { apiRequest } from './api-client';

export const blacklistApi = {
  findByPhone: (phone: string) =>
    apiRequest({
      path: `/blacklist?${new URLSearchParams({ phone, limit: '1' }).toString()}`,
      schema: ListBlacklistResponseSchema,
    }),
};
