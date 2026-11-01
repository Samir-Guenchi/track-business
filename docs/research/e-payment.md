# Electronic payment: CIB and Edahabia (#61)

Status: desk research on 2026-11-01. Fees and timings are **not public**: ask two acquiring banks for their tariff before deciding.

## How it works in Algeria

- **Cards:** CIB (interbank debit cards) and Edahabia (Algérie Poste). Since the interoperability between Algérie Poste and the interbank network, one e-payment acceptance can take both.
- **Platform:** SATIM runs the interbank e-payment platform. GIE Monétique authorises merchants. SATIM does pre-certification and technical tests of the merchant's payment module.
- **Path for a merchant (reported):**
  1. Eligibility for e-commerce (commercial register with an e-commerce activity, Law 18-05).
  2. Request on the CIBWEB portal (admissibility answered in under 24 hours, per the portal).
  3. Authorisation by GIE Monétique.
  4. Contract with an **acquiring bank**, which holds the merchant relationship.
  5. Certified payment module and SATIM tests, then go-live.
- **Gateways:** local payment companies (for example Chargily Pay, Guiddini) wrap SATIM with a developer API and handle certification; they take a fee on top.

## The key question for TrackEcom

TrackEcom is not the seller. Two models:

| | A. Each seller is the merchant | B. TrackEcom is the merchant (marketplace) |
|---|---|---|
| Who signs with the bank | Each seller (most small sellers cannot today) | TrackEcom once |
| Money flow | Customer to seller's account | Customer to TrackEcom, then paid out to sellers |
| Regulation | Simple for us | Collecting money for others may be a regulated payment activity; needs a lawyer and the bank |
| Effort | A connector per gateway, seller keys in settings | Ledger, payouts, refunds, KYC |

**Recommendation:** start with **model A through a gateway** (the seller brings their own gateway account, connected like a carrier: credentials encrypted, checked on connect). It fits the existing patterns: a `PaymentGateway` port with a fake adapter, like carriers and shops. Model B only after legal advice.

## What the product needs (later PRs)

1. **Payment link per order** (seller sends it by WhatsApp or SMS, #46): full amount, or a deposit for risky orders (risk score, #50).
2. **Paid orders ship with COD = 0**: `ShipRequestedEvent.codAmount` already comes from orders, so orders sets it to the amount still due.
3. **Refunds** when a paid order is cancelled or returned.
4. **Ledger** (payments, ADR-0002): online payments as their own account, reconciled against the gateway's settlement report like carrier payouts.

Next step: Samir asks one acquiring bank and one gateway for fees, settlement delay and whether model B is allowed; then an ADR.

Sources: [Zoom Algérie, procédure SATIM](https://zoomalgerie.com/paiement-cib-ecommerce-algerie/), [Guiddini, what is SATIM](https://guiddini.dz/docs/api/satim), [NTIC Web, interopérabilité Algérie Poste](https://nticweb.com/mobile/10133-lancement-de-l-e-payment-au-titre-de-l-interoperabilite-entre-algerie-poste-et-le-reseau-interbancaire.html), [DZBuild, accept online payment in Algeria](https://dzbuild.com/blog/accept-online-payment-algeria), [Algeria Tech News, gateways](https://algeriatech.news/?p=22359).
