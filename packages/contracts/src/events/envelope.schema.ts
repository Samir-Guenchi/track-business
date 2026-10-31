import { z } from 'zod';

/** `<service>.<entity>.<past-tense-verb>.v<N>`, e.g. `orders.order.confirmed.v1`. */
export const EVENT_TYPE_PATTERN = /^[a-z]+\.[a-z-]+\.[a-z-]+\.v\d+$/;

export const EventTypeSchema = z.string().regex(EVENT_TYPE_PATTERN);

/** Wraps every domain event; `data` is validated by the event's own schema. */
export const eventEnvelope = <T extends z.ZodType>(data: T) =>
  z.strictObject({
    id: z.string().min(1),
    type: EventTypeSchema,
    occurredAt: z.iso.datetime(),
    storeId: z.string().min(1),
    correlationId: z.string().min(1),
    data,
  });

export type EventEnvelope<T = unknown> = {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: string;
  readonly storeId: string;
  readonly correlationId: string;
  readonly data: T;
};
