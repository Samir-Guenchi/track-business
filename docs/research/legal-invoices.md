# Legal invoices for Algerian online sellers (#140)

Status: **draft, to be checked with a lawyer or accountant before invoices go live.** This note collects what we know and lists the open questions. It is not legal advice.

## Texts that apply

| Text | What it covers for us |
|---|---|
| Executive decree 05-468 of 10 December 2005 | Conditions for issuing an invoice, a delivery note and a summary invoice. Article 3 lists the mandatory mentions. |
| Law 04-02 of 23 June 2004 (commercial practices), as amended | Sales between professionals must be invoiced; sales to consumers must give a receipt or an invoice on request. |
| Law 18-05 of 10 May 2018 (e-commerce) | The e-supplier must be registered (RC or equivalent), present its offer in a visible, readable and understandable way (article 11, which lists the seller identity, price and delivery terms to show; to confirm on the official text) and keep records of its transactions (article 25). |
| Law 22-23 of 18 December 2022 (auto-entrepreneur status) | Registration by card number instead of the commercial register; taxed under the IFU at a reduced rate. |

## Mentions we plan to print

Seller (from the store legal profile, captured in this PR):

- Legal name, or the seller's name for a natural person
- Address
- Regime: merchant, company or auto-entrepreneur
- NIF (tax id), NIS (statistics id) when known
- RC number, or the auto-entrepreneur card number
- Article d'imposition when known
- Tax regime: IFU (no VAT shown) or real regime (VAT shown per line)

Invoice (from orders, next PR):

- Number, sequential per store, with no gaps, never reused
- Date of issue (the delivery date)
- Customer name, phone and delivery address (a consumer has no NIF)
- Lines: description, quantity, unit price, total; shipping as its own line
- Totals before tax, VAT rate and amount (real regime only), total to pay
- Payment method: cash on delivery

## Rules we will enforce in the product

1. An invoice can only be issued when `missingForInvoice(profile)` is empty.
2. The legal profile is copied onto the invoice when it is issued. Changing the profile later does not change issued invoices.
3. Numbering: one counter per store and per year (`2026-000001`), incremented in the same transaction that writes the invoice, so a failed write never burns a number.
4. An issued invoice is never edited or deleted. A return produces a credit note that points to the invoice and has its own sequence.

## Open questions for the lawyer

- Is the NIS mandatory on the invoice, or only the NIF and RC? Sources disagree.
- Must invoices to consumers be issued at every delivery, or only when the customer asks? We plan to issue them always.
- Does an IFU or auto-entrepreneur seller have to print a specific sentence such as "TVA non applicable"?
- Is a yearly reset of the numbering allowed, or must the sequence run forever?
- Is a PDF kept in our storage enough as the seller's copy, and for how many years (10 years under the commercial code?)?
- What does Law 18-05 require on the order form and the tracking page (sale terms, legal notice), and in which language?

## Not covered yet

- The monthly sales summary for the tax declaration.
- Template sale terms (conditions générales) and the legal notice.
- The French e-invoicing mandate (2026-2027) is our model for structured, immutable invoices, but Algeria has no e-invoicing platform requirement for small sellers today.
