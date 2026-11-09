# Option Holders: action perspectives

## Scope and existing analysis

Shares / `option-holders`: existing UK M&A questionnaire covering outstanding rights, reconciliation, award treatment, implementation, dilution and tax/payroll. This revision preserves the six questions, compatible treatment selections and exclusive undecided answer, progressive reveal, risk formula, factual summary and implication rules.

The completion gate is shared by UI and reports: confirmed absence completes immediately; Yes or Possibly requires each remaining response and at least one treatment. Untouched and Not yet checked retain the existing standby behaviour. Confirmed absence has no active actions and omits hidden gateway follow-ups from the report.

Existing risk rules remain authoritative in `dist/index.html`: initial/confirmed absent 1; unchecked 2; actual awards start at 3, possible awards 2; material record, implementation, dilution and tax issues impose floors up to 4; blocked implementation with material or uncalculated dilution reaches 5. Perspective changes action advice and priority, not issue risk.

## Canonical copy and perspectives

`dist/action-registry.js` is the source of instructions, titles, phases, stable IDs and icons across Apply Deal Lens, Actions by Issue, reports and Deal Hub. Removed the duplicated local catalogue and three separate Seller overrides. The existing shared Actions by Issue toggle controls now resolve the Option Holders variants.

| ID | Buyer objective | Seller objective | Balanced objective |
| --- | --- | --- | --- |
| OH01 | Reconcile awards, exercises, cancellations and fully diluted cap table | Same factual review | Same factual review |
| OH03 | Require award treatment and steps delivering agreed capital structure | Prepare a feasible schedule within governing terms | Agree entitlement, responsibility and steps under governing terms |
| OH04 | Require approval and implementation evidence | Arrange outstanding steps and evidence existing approvals | Secure or verify corporate approvals and documents |
| OH05 | Require evidence of necessary holder participation | Arrange required documents without additional demands | Obtain necessary consents, elections, releases and powers |
| OH06 | Require verified final capital and proceeds reconciliation | Deliver final cap table and reconcile transfers/proceeds | Agree final cap table and reconcile transfers/proceeds |
| OH07 | Confirm tax, withholding, payroll and reporting consequences | Same factual specialist review | Same factual specialist review |
| OH08 | Objective conditions and clear buyer waiver/termination rights | Material unresolved steps and proportionate rights | Objective material conditions with a clear deadline |
| OH10 | Specific indemnity and proportionate financial support | Defined scope, caps, periods and no overlapping deductions | Defined protection and proportionate economic treatment |
| OH11 | Seek workable alternatives delivering agreed capital position and reassess value | Propose workable treatment/timing and agree value effects | Agree workable treatment, timetable/structure and value effects |

Seven actions have three distinct instructions; OH01 and OH07 remain neutral. All instructions are one sentence and at most 32 words. Required / Recommended / Consider retain their existing fact-specific meanings and modifiers; no priority is a statement that every action is legally mandatory.

## Triggers, priority and ordering

The existing `optionHolderActions` rules are retained before the former truncation:

- Open records trigger OH01; minor discrepancies are Required for Buyer, Recommended otherwise, and other open records Required for all.
- OH03 is Required for any substantive response; a decided treatment also triggers OH04 and OH06, normally Required, with secured approvals lowering OH04 to Recommended for Seller/Balanced.
- Outstanding or blocked implementation triggers Required OH05; unclear or unassessed implementation triggers Recommended OH05.
- Material tax issues, unreviewed tax-advantaged awards, unknown tax status or an unreviewed sensitive treatment trigger Required OH07; reviewed/manageable and other unreviewed cases retain their perspective modifiers.
- Material awards with open records, treatment or implementation trigger OH08; blocked material implementation gives Buyer/Seller/Balanced Required/Recommended/Required, otherwise Required/Consider/Recommended; smaller blocked awards retain Required/Consider/Recommended, and smaller probable implementation gives Buyer Recommended.
- Identified record, implementation or tax exposure triggers OH10 with Buyer/Seller/Balanced Required/Consider/Recommended.
- Blocked implementation with material or uncalculated dilution triggers OH11 with Buyer/Seller/Balanced Recommended/Required/Recommended.

Priority first, then existing trigger insertion order. All nine registered actions fit the shared maximum, so no consolidation is necessary. Removed the former seven-card truncation, which could hide recommended or optional steps in a blocked response. Stable IDs and icons are unchanged.

Pending Hub selections refresh their wording, priority and snapshot after perspective/answer changes. Incomplete analysis clears unavailable selections. Hub capture uses canonical phases and stable-ID duplicate prevention; existing manually edited actions remain intact.

## Reports and legal sources

Completed reports include summary, implications and the same selected-side instructions and priorities as the UI; incomplete reports retain standby. Gateway early exits exclude stale follow-up responses. Questionnaire wording and stored answers require no migration.

Checked on 1 November 2026:

- [HMRC EIM12300: PAYE and securities option gains](https://www.gov.uk/hmrc-internal-manuals/employment-income-manual/eim12300): transaction-specific treatment depends on the chargeable event and relevant rules.
- [HMRC: employment related securities](https://www.gov.uk/guidance/how-employment-related-securities-work-if-youre-an-employer): scheme-specific tax treatment and reporting require separate consideration.

The existing tax note now links EIM12300 rather than the historic EIM11875 page, which directs current option transactions to EIM12300. No universal tax outcome is assumed. Implementation depends on actual scheme rules, award terms, corporate powers and required consents.

## Validation

Five focused tests pass, including 138,240 substantive answer/perspective combinations covering every nonempty compatible treatment subset plus exclusive undecided treatment. Coverage includes all nine actions in blocked profiles, unchanged priority differences, concise canonical copy, invalid-side fallback, report/live parity, hidden gateway answers and incomplete output, and Seller Hub saving without overwriting edited advice.

Browser checks confirmed nine live recommendations for the blocked case, the full nine-action library, all three toggles, Seller catalogue wording and matching Seller live advice. Shared icon styling remains in use.

Runtime validation and whitespace checks pass. Full suite: 145 pass; the one pre-existing `core-action-colours.test.mjs` failure still expects obsolete positional colour CSS.

## Concise questionnaire wording

The approved short labels are canonical in `optionAnswerOptions` in `dist/index.html`; logic refers to their stable positions. Historical single and multiple selections migrate to their corresponding current labels. The percentage bands remain Up to 1%, Over 1% to 5%, Over 5% to 10%, Over 10%, and Not calculated, avoiding overlapping boundaries. Summaries cover all tax review states and implications include required withholding/reporting. Risk scores, recommendation triggers, priorities and registry copy are preserved: 276,480 answer/perspective comparisons match the previous runtime. The implementation and tax questions retain six choices to preserve all existing distinctions.
