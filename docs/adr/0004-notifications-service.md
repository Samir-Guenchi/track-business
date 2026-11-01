# ADR-0004: A notifications service for customer SMS and WhatsApp

- Status: Proposed
- Date: 2026-11-01
- Issues: #46 (customer messages), #54 (reminders to unreachable customers), #37 (in-app, later)

## Context

Sellers want their customers to get a message when the parcel ships, when it is out for delivery and when a delivery fails (#46). The target is a message within 5 minutes of the carrier event. The SMS gateway and the WhatsApp Business account are not chosen yet. Messages cost money, so each store needs to see what it spends.

To send a message, the service needs the customer's phone and name. These are personal data and live in orders.

## Decision

- **New service `services/notifications`** (port 4005), built from the same template as payments: NestJS on Fastify, its own Prisma database, the store-access guard and Redis Streams.
- **It reacts to events only:**
  - `orders.order.status-changed.v1` (to `confirmed`);
  - `shipping.shipment.created.v1`, which gives the tracking link's public code;
  - `shipping.shipment.status-changed.v1` (out for delivery, failed attempt, delivered, returned).
- **Each trigger queues one message row.** The row is idempotent per event, and its send time is pushed past the store's quiet hours. A sender loop leases due messages (`FOR UPDATE SKIP LOCKED`), so replicas never share one, and sends them through a **`MessageProvider` port**.
  - The only provider today is `fake`, which logs and records. SMS and WhatsApp adapters are added once the provider is chosen.
  - Each adapter reports a cost and a provider id. Delivery receipts update the row through `POST /webhooks/messages/:provider`.
- **Phones do not travel in events.** At send time, the sender asks orders for the contact through a `ContactDirectory` port. This is an internal HTTP call, `GET /internal/orders/:id/contact`, protected by a service token. Only orders stores the phone. Notifications stores the opt-out list (phones the customer asked to stop) and nothing else personal: no message text, no phone on message rows.
- **Templates per store, trigger, channel and language.** They start from built-in Arabic, French and Darija texts, and only these placeholders are allowed: `{name}`, `{ref}`, `{tracking_link}`, `{carrier}`, `{store_name}`. WhatsApp business-initiated messages need Meta-approved templates. When WhatsApp is chosen, the approval id is stored next to the template.

## Alternatives considered

- **Phones in the events.** This is simpler: there would be no internal call. It was rejected for now because every consumer and the Redis stream would hold phone numbers. Samir can still choose it, and the `ContactDirectory` port would then read from the event.
- **Sending from orders and shipping directly.** That was rejected because quiet hours, opt-outs, cost and provider retries would be duplicated in two services. Slow provider calls belong in a queue (AGENTS.md rule 4).

## Consequences

- One more image, database, `NOTIFICATIONS_DATABASE_URL` and backup entry, plus a shared `INTERNAL_TOKEN` between orders and notifications.
- Until a provider is chosen, messages are "sent" by the fake provider. Stores see the queue and the statuses, but no customer receives anything. Notifications stay **off per store** until the store turns them on.
- The orders internal endpoint is a new synchronous dependency. If orders is down, the sender keeps the message queued and retries.
