# Public launch checklist (#49)

Every line needs a ✅ and Samir's sign-off before the launch announcement. "Exists" lists what the codebase already does; "To do" is what is left. Legal items need a lawyer; this file is a working list, not legal advice.

## 1. Security

| Item | Exists | To do | Owner |
|---|---|---|---|
| OWASP Top 10 review | zod validation at every boundary, `storeId` from auth context only, rate limits, Helmet/CORS in service-kit, signed webhooks (Shopify HMAC, carriers), envelope-encrypted carrier and shop credentials, hashed self-confirmation tokens | Walk the Top 10 per service and record findings in `docs/security-review.md`; check SSRF on every outbound URL a seller can influence (shop URLs, sheet links) | Samir |
| Dependency audit | `pnpm audit --audit-level high --prod` in CI | Dependabot or Renovate, weekly | Samir |
| Secret scanning | `.gitignore` for `.env` | Turn on GitHub secret scanning and push protection; add gitleaks to CI | Samir |
| Pen test of auth and tenant isolation | Tenant tests in every int spec (rival store gets 404/empty) | External pen test of identity (login, refresh, reset), store switching, `/internal` routes and public tracking/confirmation links | External |
| Key management | `CARRIER_KEK`, `SHOP_KEK`, `INTERNAL_TOKEN` from env | Secret manager in production; written rotation steps in `docs/runbook.md` | Samir |
| Backups | Per-service databases | Daily backups for every database (identity, shipping, orders, payments, notifications, integrations), a restore drill, retention | Samir |

## 2. Personal data (Law 18-07, amended by Law 25-11 of 2025)

Algeria's Law 18-07 requires a **prior declaration to the ANPDP** (national personal data authority) before processing personal data, and **prior authorisation** for transfers abroad. The 2025 amendment (Law 25-11) changed parts of the regime, so a lawyer must check the current text. The online-sales rules are in Law 18-05 on e-commerce.

- [ ] Declaration (or authorisation) filed with the ANPDP for TrackEcom as processor and, where needed, help sellers with theirs. Ask the lawyer whether we are controller, processor or both for customer data.
- [ ] Hosting location decided. Servers outside Algeria may need ANPDP authorisation for the transfer.
- [ ] Privacy policy in Arabic and French: what we collect (seller accounts, end-customer name, phone, address), why, how long, who receives it (carriers, SMS/WhatsApp providers), rights and contact.
- [ ] Retention: end-customer data deleted or anonymised N months after delivery (proposal: 24 months; payments ledger keeps amounts without names). Held shop orders (`imported_orders.pending`) are already cleared on fix or skip.
- [ ] Customer messages: opt-out exists (#46); add the opt-out text to every template.
- [ ] Cross-store network signals (#52) stay **off** until the lawyer confirms the legal basis.
- [ ] Data subject requests: a runbook to export or delete one customer's data across services.

## 3. Legal documents

- [ ] Terms of service and seller agreement in Arabic and French (liability for carrier losses, COD money flow, suspension).
- [ ] Company registration and invoicing (VAT) for paid plans.
- [ ] Software license chosen (README says "all rights reserved for now"). Recommendation: keep it proprietary unless there is a reason to open-source.

## 4. Support

- [ ] Help centre: ten first articles (connect a carrier, import from Shopify or Google Sheets, confirmation workflow, reconcile a payout, fix a held shop order...).
- [ ] WhatsApp Business support line with opening hours.
- [ ] Status page (public) fed by health checks of every service.
- [ ] Incident process in `docs/runbook.md`: who is on call, how sellers are told.

## 5. Pricing

- [ ] Free tier and paid plans decided (proposal: free up to 100 orders a month; paid tiers by monthly orders; SMS at cost plus margin).
- [ ] Shown on the website and in the app; limits enforced (rate limits per plan are part of #57).

## 6. Load test

- [ ] Scenario: 100 stores, 20,000 orders a day (about 14 a minute, peaks of 10x at evening ad times), 60% confirmed, 50% shipped, tracking polls for every open parcel.
- [ ] Tool: k6 against staging, with the fake carrier and the fake shop.
- [ ] Pass: p95 under 300 ms on order screens, no queue backlog after 10 minutes, no database CPU above 70%.

## Sign-off

| Section | Done | Signed off by Samir |
|---|---|---|
| Security | | |
| Personal data | | |
| Legal documents | | |
| Support | | |
| Pricing | | |
| Load test | | |

Sources: [GIDE on the ANPDP](https://gide.com/en/?p=75681), [CMS guide, Algeria](https://cms.law/en/int/expert-guides/cms-expert-guide-to-data-protection-and-cyber-security-laws/algeria2), [DataGuidance, Algeria](https://www.DataGuidance.com/jurisdiction/algeria).
