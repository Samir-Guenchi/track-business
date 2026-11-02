# Seller and carrier pains, and features borrowed from other markets (Nov 2026)

A brainstorm of what still hurts Algerian online sellers and delivery companies after the original backlog (#8-#63), and which proven features from France, Canada, the US, India and the Gulf answer each pain. Each idea became an issue (#132-#155). Validate them with the beta seller interviews ([seller-interviews.md](seller-interviews.md)) before building the P1/P2 ones.

Figures below are indicative: most public numbers on Algerian COD come from vendor blogs, not official statistics. Commonly quoted ranges: COD is 85-95 % of online orders, and 15-35 % of COD parcels come back (worse in remote wilayas), against roughly 8-15 % for well-run stores.

## Where the money leaks in a COD order

```
Ad click -> order form -> confirmation call -> packing -> carrier hub -> courier -> customer door -> COD payout
   |             |               |                |            |            |              |              |
 wasted ad   fake / typo     agent cost,      "box was     parcel lost   absent,        refused,      paid late,
 on refused  orders, spam    slow follow-up   empty"       between hubs  no address     wrong size    paid short
 orders                                                                                  returns lost
```

## Sellers

| Pain | Borrowed from | Issue |
|---|---|---|
| Typos, fake and sabotage orders from free-text landing-page forms | COD form apps and Shopify checkout | #134 Embeddable COD order form |
| Visitors leave the form after typing their phone | Shopify / Klaviyo abandoned checkout | #147 Abandoned form recovery |
| Addresses without street numbers ("near the mosque") | Gulf apps: WhatsApp location pin, Plus Codes | #135 Location pin and landmarks |
| Risky COD orders come back and cost two fees | India: GoKwik COD-to-prepaid, token deposits | #141 Deposit and prepaid conversion |
| Failed attempts are discovered too late | India NDR workflow (Shiprocket), AfterShip exceptions | #132 Failed-delivery action centre |
| Courier comes on the wrong day; customer would prefer a stop-desk | DPD Predict (France), UPS My Choice (US/Canada) | #136 Delivery choices on the tracking page |
| Nobody knows where stop-desks are or when they open | Mondial Relay / Relais Colis checkout widget | #137 Stop-desk locator and picker |
| Whole parcel refused for one wrong item | India open-box, Zalando / Amazon try-before-you-buy | #142 Open-box and partial delivery |
| Wrong size = two unrelated parcels | Loop Returns exchanges, carriers' "échange" service | #138 Exchanges |
| Returns never come back | Colissimo/Chronopost return manifests, ShipBob receiving | #133 Return-to-seller chain |
| "The box was empty" disputes | ShipStation scan-to-verify, carrier photo POD | #148 Packing proof and proof of delivery |
| Lost/damaged parcels and late COD never claimed | US shipping audit and claims, carrier scorecards | #139 Claims and carrier scorecard |
| No invoices, fear of tax checks, Law 18-05 | France e-invoicing mandate, Shopify/Stripe invoices | #140 Legal invoices and compliance pack |
| Ads judged on orders, not on delivered cash | TrueProfit / BeProfit / Triple Whale (US) | #143 Ad spend and true profit |
| Agents paid per "confirmed" order that is then refused | Sales commission tools (Spiff, CaptivateIQ) | #144 Agent pay per delivered order |
| Confirmation calls are the biggest cost and overflow after campaigns | IVR and WhatsApp confirmation (India, Morocco, Gulf) | #145 Automated confirmation in Darja/AR/FR |
| The only human contact sells nothing more | Post-purchase upsells (ReConvert, Zipify) | #146 Upsell during confirmation |
| Customers who paid are never contacted again | Klaviyo / Postscript flows, WhatsApp marketing | #149 Customer CRM and repeat orders |
| Call centres serve many stores with shared passwords | Shopify Partners / agency workspaces | #150 Confirmation agencies |
| Working capital stuck in COD on the road | Shopify Capital, early-COD remittance in India | #151 Research: COD cash advance |

## Delivery companies

| Pain | Borrowed from | Issue |
|---|---|---|
| Paper run sheets, vague failure reasons, cash counted at night | Onfleet, Tookan, Circuit for Teams | #152 Courier app |
| Dispatch by memory, overlapping routes | Routific, Onfleet route optimisation | #153 Dispatch and route planning |
| Parcels and cash lost between hubs and drivers | UPS/FedEx/Canada Post hub scans, Indian COD remittance controls | #154 Hub operations and cash handover |
| Regional carriers cannot cover the whole country | Interline / partner last mile (USPS for FedEx/UPS economy) | #155 Carrier-to-carrier hand-off |

These build on the carrier portal (#59): a delivery company that runs its drivers, hubs and cash in TrackEcom also feeds sellers live, trustworthy tracking, which is our edge over carrier-only dashboards.

## Suggested order

1. Phase 2 (P0): #132 failed-delivery centre, #133 return chain, #134 order form. They attack the three biggest leaks: refusals, lost returns, fake orders.
2. Phase 2 (P1): #135 location pin, #136 delivery choices, #137 stop-desk picker, #138 exchanges, #139 claims, #140 invoices.
3. Phase 3: #141-#148, measured against the delivery rate.
4. Phase 4: #149-#155 and the delivery-company suite.

## Sources

- [DZBuild: reduce COD return rate in Algeria](https://dzbuild.com/blog/reduce-cod-return-rate-algeria) (vendor blog)
- [Algeria Tech News: social commerce in Algeria](https://algeriatech.news/algeria-social-commerce-instagram-tiktok-dinar-monetization-2026/)
- [Sendcloud: Relais Colis returns and pickup points](https://www.sendcloud.com/carriers/relais-colis/)
- [Shine: e-commerce and pickup points in France](https://www.shine.fr/blog/e-commerce-point-relais/)
- [AfterShip post-purchase setup for Shopify](https://sherocommerce.com/pages/shopify-aftership-integration)
- [ParcelWILL: tracking, returns and shipping protection](https://www.cwill.com/parcelwill)
