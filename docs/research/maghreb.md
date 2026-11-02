# Expansion study: Tunisia and Morocco (#63)

Status: desk research on 2026-11-01 from public pages. Many figures come from vendors selling COD software, so they are **estimates to check with sellers and carriers**, not facts.

## The markets

| | Algeria (today) | Morocco | Tunisia |
|---|---|---|---|
| COD share of online orders | Dominant | 70–80% (vendor estimate) | 56% to over 80% (ministry figure cited by the US trade guide: over 80%) |
| Return rate | High | 25–35% reported (vendor) | Not found |
| Main carriers named | Yalidine, Ecotrack companies, ZR Express, Maystro, NOEST | Amana (Barid Al-Maghrib), Cathedis, Sendit, Ozon Express, Ameex, Coliix, Aramex | Aramex, First Delivery, local companies |
| Currency | DZD | MAD | TND (3 decimals) |
| Languages | Arabic, French | Arabic, French (Darija in messages) | Arabic, French |
| Shop platforms | YouCan, Shopify, Facebook pages | YouCan (Moroccan), Shopify, Storeino | Shopify, Facebook pages |

The pain we solve (confirmation calls, many carriers, returns, COD money) is the same in both countries. Morocco is the closest copy of Algeria: COD-heavy, many small carriers, YouCan and Facebook sellers, and existing local tools (for example eGrow), which means **competition already exists there**.

## What would have to change in TrackEcom

1. **Country as a store setting.** Today wilaya and commune codes are Algerian. The geo service needs a country dimension: Moroccan regions/provinces/communes, Tunisian governorates/delegations. The address matcher in integrations and the commune-in-wilaya check are already data-driven, so this is new reference data plus a `country` column, not new logic.
2. **Money.** Amounts are whole dinars (`DinarsSchema`). Tunisia uses millimes (3 decimals). Store amounts in minor units with a currency on every order, ledger entry and payout.
3. **Phones.** `AlgerianPhoneSchema` becomes one rule per country (+212, +216).
4. **Carriers.** New adapters per country through the carrier contract suite (#40). Nothing in orders changes.
5. **Legal.** Morocco's Law 09-08 (CNDP) and Tunisia's data protection law (INPDP) each need their own declaration; hosting and transfer rules differ.
6. **Payments.** Payouts and bank details per country; e-payment (#61) is a separate project per country.
7. **Calendars.** The ETA calendar (#55) has Algerian holidays and a Friday weekend; Morocco and Tunisia rest on Sunday.

Rough effort once Algeria is stable: 2 to 3 months for one country (geo data, money, phones, two carriers, legal), mostly data and adapters.

## Recommendation

**No-go for now; revisit after Algeria reaches product-market fit** (the beta in #38 and the launch checklist in #49 done, 100 paying stores). Then:

- **Morocco first**: closest market shape, YouCan is already a planned connector (#48), larger e-commerce volume. Enter with a partner carrier rather than alone, because local competitors exist.
- **Tunisia second**: smaller market, Aramex-centred, millimes force the money change first.

Do now, at almost no cost, so the door stays open: keep `country` in mind in new schemas (no new code that assumes "Algeria" outside the geo, phone and money modules).

Decision: _to be recorded by Samir here and in ROADMAP.md._

Sources: [US trade.gov, Tunisia e-commerce](https://trade.gov/country-commercial-guides/tunisia-ecommerce), [Bank of Scotland Trade, Tunisia](https://www.bankofscotlandtrade.co.uk/en/market-potential/tunisia/ecommerce), [Tunisie Numérique, e-commerce barometer](https://www.tunisienumerique.com/?p=432713), [eGrow, Morocco COD statistics](https://www.egrow.com/en/blog/morocco-ecommerce-statistics-trends-2026), [eGrow, Morocco delivery companies](https://www.egrow.com/en/blog/best-delivery-companies-morocco-2026), [eGrow, Tunisia delivery companies](https://www.egrow.com/en/blog/best-delivery-companies-tunisia-2026), [EasySell, Morocco COD](https://easysellapp.com/blogs/wiki/morocco-ecommerce-cod-market-entry-shopify-2026).
