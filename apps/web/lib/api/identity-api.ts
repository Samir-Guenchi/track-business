import {
  type AcceptInvitationRequest,
  type CreateStoreRequest,
  type ForgotPasswordRequest,
  type LoginRequest,
  MeResponseSchema,
  MyStoresResponseSchema,
  type RegisterRequest,
  type ResetPasswordRequest,
  SessionResponseSchema,
  StoreSchema,
  type VerifyEmailRequest,
} from '@trackecom/contracts';
import { z } from 'zod';
import { apiRequest } from './api-client';

const NoContent = z.unknown();
const AcceptedInvitationSchema = z.object({ storeId: z.string().min(1) });

const post = <T extends z.ZodType>(path: string, schema: T, body: unknown) =>
  apiRequest({ path, schema, method: 'POST', body });

/** Calls to identity through the gateway, one function per endpoint. */
export const identityApi = {
  register: (body: RegisterRequest) => post('/auth/register', SessionResponseSchema, body),
  login: (body: LoginRequest) => post('/auth/login', SessionResponseSchema, body),
  logout: () => post('/auth/logout', NoContent, {}),
  forgotPassword: (body: ForgotPasswordRequest) => post('/auth/forgot-password', NoContent, body),
  resetPassword: (body: ResetPasswordRequest) => post('/auth/reset-password', NoContent, body),
  verifyEmail: (body: VerifyEmailRequest) => post('/auth/verify-email', NoContent, body),
  me: () => apiRequest({ path: '/auth/me', schema: MeResponseSchema }),
  myStores: () => apiRequest({ path: '/stores', schema: MyStoresResponseSchema }),
  createStore: (body: CreateStoreRequest) => post('/stores', StoreSchema, body),
  acceptInvitation: (body: AcceptInvitationRequest) =>
    post('/invitations/accept', AcceptedInvitationSchema, body),
};
