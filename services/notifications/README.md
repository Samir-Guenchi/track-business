# notifications service

Sends customers SMS and WhatsApp messages when their order or parcel moves (ADR-0004, issue #46). Port 4005.

```bash
cp .env.example .env
pnpm --filter @trackecom/notifications db:migrate
pnpm --filter @trackecom/notifications dev     # http://localhost:4005/docs/openapi.json
```

- **Off per store** until the owner turns it on in `PUT /notifications/settings`. That call also sets the channel (SMS or WhatsApp), the language (ar, fr or darija), which triggers send, the quiet hours (21:00 to 08:00 by default) and the store name used in texts.
- **Templates:**
  - `GET /notifications/templates` lists all 36 texts (6 triggers × 2 channels × 3 languages), either the store's own or the built-in one.
  - `PUT` saves a store's text, and `DELETE` goes back to the built-in one.
  - Only `{name}`, `{ref}`, `{tracking_link}`, `{carrier}` and `{store_name}` are accepted.
- **Opt-outs:** an agent records a customer who wants no more messages with `POST /notifications/opt-outs`. These phones are the only personal data the service stores.
- **What was sent:** `GET /notifications/messages` shows each message's status and cost, with no phone and no text. `GET /notifications/usage?month=` (`money.read`) gives the month's cost.
- **Sending:**
  - The consumer group `notifications.delivery` reads `orders.order.status-changed.v1` (confirmed), `shipping.shipment.created.v1` (shipped, with the tracking link) and `shipping.shipment.status-changed.v1` (out for delivery, failed attempt, delivered, returned).
  - Each event queues at most one message per trigger, and only when the store has that trigger on. The message waits for the end of the quiet hours.
  - The sender loop leases due messages (`FOR UPDATE SKIP LOCKED`), reads the customer's name and phone from orders (`/internal/...contact`, `INTERNAL_TOKEN`), skips opted-out phones, renders the template and calls the `MessageProvider`.
  - Failures are retried after 1, 5 and 30 minutes, then the message is marked `failed`.
- **Provider:** only `fake` exists until an SMS gateway and WhatsApp Business are chosen. It sends nothing and logs no phone or text. A real provider is one class implementing `MessageProvider` (`send`, `parseReceipt`).
- **Receipts:** register `POST /webhooks/messages/<provider>?token=<MESSAGE_WEBHOOK_TOKEN>` with the provider. Each receipt sets the message to `delivered` or `failed`.
