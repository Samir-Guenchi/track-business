import { z } from 'zod';
import { EmailSchema } from '../auth/credentials.schema.js';
import { AlgerianPhoneSchema } from '../common/phone.schema.js';
import { StoreRoleSchema } from './permissions.js';
export const CreateStoreRequestSchema = z.strictObject({ name: z.string().trim().min(2).max(80) });
export const StoreSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string(),
  createdAt: z.iso.datetime(),
});
/** `GET /stores`: every store the user belongs to, with their role in it. */
export const MyStoresResponseSchema = z.strictObject({
  items: z.array(z.strictObject({ store: StoreSchema, role: StoreRoleSchema })),
});
export const MemberSchema = z.strictObject({
  membershipId: z.string().min(1),
  userId: z.string().min(1),
  name: z.string(),
  email: z.string(),
  role: StoreRoleSchema,
  joinedAt: z.iso.datetime(),
});
export const ListMembersResponseSchema = z.strictObject({ items: z.array(MemberSchema) });
/** Any role except owner; ownership moves only through a transfer. */
export const AssignableRoleSchema = StoreRoleSchema.exclude(['owner']);
/** Invite by email or by Algerian mobile (the link is then shared by the manager, e.g. WhatsApp). */
export const CreateInvitationRequestSchema = z
  .strictObject({
    email: EmailSchema.optional(),
    phone: AlgerianPhoneSchema.optional(),
    role: AssignableRoleSchema,
  })
  .refine((body) => (body.email === undefined) !== (body.phone === undefined), {
    message: 'Give exactly one of email or phone',
  });
export const InvitationCreatedResponseSchema = z.strictObject({
  invitationId: z.string().min(1),
  inviteUrl: z.url(),
  expiresAt: z.iso.datetime(),
});
export const AcceptInvitationRequestSchema = z.strictObject({ token: z.string().min(20).max(200) });
export const ChangeRoleRequestSchema = z.strictObject({ role: AssignableRoleSchema });
export const TransferOwnershipRequestSchema = z.strictObject({ membershipId: z.string().min(1) });
/** Header that selects the store for a request; membership is always checked server-side. */
export const STORE_HEADER = 'x-store-id';
