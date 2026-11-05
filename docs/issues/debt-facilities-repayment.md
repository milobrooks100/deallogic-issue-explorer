# Debt Facilities Requiring Repayment

## Scope and source of truth

Finance / `debt-facilities-repayment`, reviewed 1 November 2026. This update changes action wording and presentation/integration, retaining the existing questions, answer labels, visibility, summary, implications, risk rules and underlying priority/selection triggers. `dist/debt-facilities.js` owns the existing seven-question route and answer-based rules; `dist/issues.json` owns question text and the two legal notes. `dist/action-registry.js` is now the only catalogue source for titles, instructions, icons and phases; the duplicate action catalogue has been removed from the issue runtime.

The existing routes distinguish confirmed absence, not checked, uncertain records, no transaction effect, uncertain effect, repayment, consent and combined repayment/consent. Repayment reveals payoff, funding and releases; consent reveals consent status; both active routes require the completion sequence. The shared standby remains until all currently visible questions are answered. Confirmed absence produces no issue actions, while Not yet checked completes its short route with Required diligence. Hidden repayment/consent answers do not affect the route's outputs.

## Perspective wording

Nine actions (D02, D04, D05, D07, D08, D10, D11, D12 and D14) have canonical Buyer and Seller instructions alongside Balanced wording. Buyer advice seeks effective lender steps, defined protections and clear cost allocation; Seller advice limits commitments to agreed funding, deliverables and risk allocation while still addressing necessary lender requirements. Five practical checks retain common wording: D01 complete finance schedule/trigger review, D03 written payoff evidence, D06 alternative lender route, D09 completion funds flow, D13 register updates.

Interim covenants remain conditional on signing preceding completion; asset-sale allocation remains conditional on an asset sale. Completion conditions in a combined card are not made conditional on a signing/completion gap. Required consents and releases remain lender deliverables, not consequences of a private allocation between buyer and seller. Title/icon/phase/semantic IDs D01–D14 remain stable.

The shared Actions by Issue three-button Buyer/Seller/Balanced control applies to the full 14-entry Debt Facilities catalogue. It updates the active deal perspective and resolves the shared registry wording. Entries added manually to Deal Hub use that displayed instruction and the existing Consider label; questionnaire-generated recommendations carry their fact-specific priorities. Saved user edits are not rewritten when the side changes.

## Existing action triggers and priorities

Priorities below are Buyer / Seller / Balanced and describe the uncombined components; preserve these when saving a combined recommendation to Hub. Payoff/funding/consent/release/sequence “open” means not at its documented ready answer on the relevant route. “Hard block” means lender refusal/unmet terms, a repayment funding shortfall, or an expressly unresolved completion dependency.

| ID | Trigger | Priority |
| --- | --- | --- |
| D01 Finance schedule and trigger review | Every non-absent assessment | Required for unreviewed/incomplete records or uncertain effect; otherwise Recommended for all |
| D02 Repayment covenant | Repayment required | Required for all |
| D03 Payoff deliverable | Repayment required | Required for open payoff; otherwise Recommended for all |
| D04 Lender consent or waiver | Consent required and not effective | Required for all |
| D05 Pre-completion covenant | Any relevant lender step remains open | Recommended / Consider / Recommended; instruction conditional on a signing/completion gap |
| D06 Alternative lender route | Hard block | Required for all |
| D07 Funding and shortfall allocation | Repayment funding open | Buyer Required; Seller/Balanced Required for a shortfall, otherwise Recommended |
| D08 Security and guarantee releases | Repayment route without confirmation that no releases are needed | Required for open releases; otherwise Recommended for all |
| D09 Completion funds flow | Repayment required | Buyer Required if sequence open; Seller/Balanced Required for an expressly blocked sequence; otherwise Recommended |
| D10 Completion condition and longstop | Any relevant lender step remains open | Required / Consider / Recommended |
| D11 Debt and price mechanism | Confirmed obligations | Recommended for all, becoming Required for all where repayment is required |
| D12 Finance warranties and disclosure | Confirmed obligations | Recommended / Required / Recommended |
| D13 Charge-register update | Repayment required | Consider for all; only an appropriate update after actual repayment/release |
| D14 APA excluded liabilities | Obligations exist or may exist | Recommended / Consider / Recommended; instruction conditional on an asset sale |

## Nine-card limit and consolidation

The previous ten-action truncation is removed. Retain every triggered component, sort by Required / Recommended / Consider and the existing issue order, and combine related steps only while the result exceeds nine cards:

1. D01 + D12: Finance review, warranties and disclosure.
2. D02 + D03: Repayment and payoff deliverable.
3. D07 + D11: Funding, shortfalls and price treatment.
4. D08 + D09: Security releases and completion funds flow.
5. D05 + D10: Lender controls and completion conditions.

A combined card uses a dedicated one-sentence Buyer/Seller/Balanced instruction, the first component's registered identity/icon and the highest component priority. Its `data-constituent-ids` retains both identities. No slice removes lower-priority protections; the full blocked confirmed route has 14 components in nine cards. Alternative routes or ready answers normally need fewer cards.

## Reports, Deal Hub and persistence

Completed issue reports now include the same prose, implications, perspective, capped action cards, priority labels and legal notes as the live panel. Only visible questions appear; incomplete reports retain the standby instruction and omit generated analysis/actions. Existing export handlers remain delegated for other issues.

`window.DealLogicDebtActions(responses, side)` supplies uncombined, perspective-correct components to the shared Hub selection flow. Combined cards save these components separately with their individual priorities, canonical registry phases and stable IDs, as Employment and Data Protection already do. Existing saved components prevent duplicates and retain manual edits. Pending selections refresh wording and labels on side changes; upstream changes remove irrelevant candidates, including when the panel re-enters standby. The debt render event also refreshes Hub stale-snapshot feedback; refreshing a snapshot does not rewrite saved actions.

## Drafting authority and boundaries

Checked 1 November 2026. The lender steps and negotiated allocation depend on the actual finance documents and sale agreement; no action assumes that the seller must fund every shortfall or that an asset-sale allocation binds a lender. HMRC's [explanation of debt assignment and novation](https://www.gov.uk/hmrc-internal-manuals/corporate-finance-manual/cfm11170) describes transferring obligations through novation and the need for the parties' consent absent a relevant prior agreement. D14 therefore retains necessary creditor consents, releases or novations rather than treating assumed/excluded liabilities as a release by themselves.

The neutral register action follows the existing separation of actual discharge/release from recording the position: [Companies House MR04](https://www.gov.uk/government/publications/register-a-statement-of-satisfaction-mr04) records satisfaction, while [Companies House MR05 guidance](https://www.gov.uk/government/publications/register-a-statement-property-released-in-part-or-whole-mr05/how-to-complete-form-mr05-checklist) distinguishes a statement about released property. The catalogue does not assume that every repayment requires the same form. Existing live legal notes remain unchanged.

## Validation

Twenty-one focused Debt Facilities tests cover existing routes/risk/summary/implications plus canonical side wording, neutral exceptions, repayment versus consent components, live/report parity, hidden-answer exclusion and Hub component preservation. All 112,500 Cartesian answer combinations across three perspectives (337,500 evaluations) verify a maximum of nine cards, complete component coverage, priority retention and one-sentence copy of at most 32 words. Shared catalogue rendering tests exercise the three controls for every topic. Full suite: 136 pass; the existing unrelated core action-colour assertion still fails.

Browser checks cover the 14-entry Seller catalogue, nine cards for the blocked combined route, shared perspective selection and saving a combined finance-review/disclosure card to Hub with each component's own phase, priority and wording.
