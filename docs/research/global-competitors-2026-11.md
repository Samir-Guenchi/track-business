# Features from China, India, Morocco and France (Nov 2026)

A second brainstorm after [pains-and-features-2026-11.md](pains-and-features-2026-11.md) (#132-#155). This round looks at what COD and logistics tools in other markets do that Algerian tools, EcoTrack DZ first, do not. Each idea became an issue (#193-#202).

## Where EcoTrack stops

EcoTrack is above all a **carrier engine**: one shared API and dashboard that about 60 Algerian delivery companies run under their own name (Packagist connectors list them). A seller sees one carrier at a time, the carrier's prices and the carrier's statuses. That gives TrackEcom three angles no carrier dashboard can take:

1. **We see every carrier for every store**, so we can compare carriers, spot stuck hubs and publish market benchmarks (#197, #200).
2. **We are on the seller's side**, so we can check the carrier's work: fake failed attempts, wrong fees, lost parcels (#195, #196, #139).
3. **We own the order before the carrier exists**: the DM, the live, the reseller, the pricing policy (#193, #194, #198, #199).

## What other markets do

| Market | Product | Feature worth taking | Issue |
|---|---|---|---|
| China | Taobao, Pinduoduo, JD, courier apps | Smart address recognition: paste one text block, get name, phone and address | #193 Smart paste |
| China | Pinduoduo / Taobao free-shipping templates | Free delivery above an amount, remote provinces excluded or charged | #194 Delivery fee rules |
| China | Douyin, Taobao Live | Orders captured during live selling | #199 Live selling |
| China | Cainiao Post, Duoduo stations | Paid pickup points in village shops | #202 Partner pickup points |
| China | 1688 distribution, Taobao affiliates | Resellers selling a supplier's stock | #198 Resellers |
| India | Shiprocket / Delhivery NDR verification, delivery OTP | Ask the buyer whether the courier really attempted delivery | #195 Fake failed-attempt check |
| India | Shiprocket weight discrepancy panel | Accept or dispute every extra carrier charge | #196 Carrier fee audit |
| India | Meesho | Resellers set their own margin, paid after delivery | #198 Resellers |
| India | Shiprocket courier performance by pincode | Delivery rate per area across sellers | #200 Market benchmarks |
| Morocco | eGrow, YouCan COD apps | WhatsApp "reply 1 to confirm" (already #145), 60-carrier dispatch, reconciliation | covered by #41, #42, #145 |
| France | Sendcloud, Colissimo return portals, Zalando | Customer starts the return or exchange online | #201 Return requests |
| France | Boxtal, Sendcloud | Comparator and parcel insurance | covered by #41; insurance left for later |
| Global | AfterShip, Parcel Panel | "No update for X days" exception alerts | #197 Stuck parcel alerts |

## Algerian pains behind each issue

| Pain | Issue | Priority |
|---|---|---|
| Couriers mark "client absent" without calling; seller pays the return | #195 | P0 |
| Orders arrive as free text in DMs and are retyped with typos | #193 | P1 |
| Same far or risky wilayas lose money; no way to set a commercial delivery policy | #194 | P1 |
| Fees deducted from payouts are never checked | #196 | P1 |
| Parcels sit in a hub for days and nobody notices | #197 | P1 |
| Local dropshipping runs on WhatsApp groups and Excel | #198 | P2 |
| Live-selling reservations lost on paper | #199 | P2 |
| A seller cannot tell a bad wilaya from a bad product | #200 | P2 |
| After-sale requests flood the seller's phone | #201 | P2 |
| No stop-desk within reach in many communes | #202 | P2 |

## Build order

1. #193, #194, #195, #196, #197: small, use existing services (orders, shipping, payments), no new service.
2. #200, #201: need analytics (#53) and the tracking page.
3. #198, #199, #202: new flows, validate with beta sellers (#38) first.

## Sources

Figures and claims come from vendor pages and are indicative.

- [Packagist: Algerian courier connectors on the EcoTrack engine](https://packagist.org/packages/piteurstudio/courierdz)
- [DZBuild: e-commerce platforms in Algeria](https://dzbuild.com/blog/best-ecommerce-platform-algeria-2026)
- [Shiprocket: terms (weight discrepancy, NDR)](https://support.shiprocket.in/support/solutions/articles/43000662858-important-terms-all-shiprocket-users-should-know)
- [Shiprocket Techsphere (NDR address and RTO scores, claims)](https://www.shiprocket.in/techsphere/)
- [YourStory: Shiprocket RTO predictor case](https://YourStory.com/2024/02/shiprockets-formula-revolutionising-ecommerce-logistics)
- [eGrow: COD management tool, Morocco](https://www.egrow.com/en/cod-management-tool)
- [eGrow: automating YouCan COD confirmation](https://www.egrow.com/en/blog/how-to-automate-youcan-cod-2026)
- [Cainiao Post stations and lockers](https://www.cainiao.com/en/technology-cainiao-post.html)
- [Pinduoduo last-mile stations](https://thelowdown.momentum.asia/pinduoduo-builds-last-mile-parcel-delivery-stations-in-china/)
- [Sendcloud Shipping Protection](https://releaselog.sendcloud.com/changelog/introducing-our-enhanced-shipping-insurance-sendcloud-shipping-protection)
