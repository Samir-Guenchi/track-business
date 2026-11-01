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
- Sending (event consumers, the sender loop and the provider port) arrives in the next PR. Until an SMS gateway and WhatsApp Business are chosen, the only provider is a fake one.
