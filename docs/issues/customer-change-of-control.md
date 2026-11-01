# Change of Control: action perspectives

## Scope and existing analysis

Material Contracts / `customer-change-of-control`, the existing UK M&A contract issue. Preserve questions, answer values, progressive visibility, the three importance bands, risk formula and the established recommendation matrix. No answer migration is required.

The existing completion gate remains: confirmed no provision or a non-triggered provision completes immediately with no active actions; other routes require a provision answer, trigger answer, consequence (including nonempty Other text) and recorded importance. Reasonableness and consent-outlook details remain optional to initial analysis. Untouched/incomplete routes retain standby.

Existing risk remains independent of perspective: no clause/no trigger returns 1; recorded provision begins at 2; Yes or unclear trigger establishes 3; consent, high importance and adverse consent factors increase risk, capped at 5. This revision does not change scoring.

## Canonical wording

`dist/action-registry.js` supplies the nine stable action identities, titles, one-sentence instructions, icons and phases. Seven have Buyer/Seller/Balanced variants; trigger review and service of the contractual notice remain neutral. Every instruction is at most 32 words.

The matrix now stores stable IDs and priorities rather than duplicated instruction strings and generic display titles. This distinguishes the communication plan from the consent covenant reliably. Existing aliases remain for historic saved actions. The shared Actions by Issue toggle group resolves the selected variant across its full nine-action catalogue.

| Action ID | Buyer objective | Seller objective | Balanced objective |
| --- | --- | --- | --- |
| coc-trigger-review | Review clause, structure and exceptions | Same factual review | Same factual review |
| coc-serve-notice | Serve in accordance with contractual timing/formalities | Same practical compliance step | Same practical compliance step |
| coc-agree-communication | Approval of material communications and coordinated timetable | Practical communications and control of relationship | Agree communication, timing and responsibility |
| coc-seek-consent-covenant | Enforceable pursuit, progress reports and approval of concessions | Achievable endeavours, cooperation and cost/concession limits | Proportionate endeavours and allocated responsibility |
| coc-warranty-disclosure | Seek warranties and specific disclosure | Accurate qualified warranties and fair disclosure | Agree qualified warranty and disclosure |
| coc-specific-indemnity | Identified losses, suitable periods and recovery support | Defined scope, caps, periods and recovery credits | Defined losses and limits, no double recovery |
| coc-consent-cp | Objective material consent condition and buyer rights | Resist unnecessary conditions and limit agreed ones | Objective material consent conditions and deadline |
| coc-longstop-rights | Clear rights where continuity is threatened | Material unresolved risks and realistic longstop | Proportionate termination/renegotiation rights |
| coc-tailored-response | Steps and protection preserving continuity/value | Workable steps with limited seller duties | Agreed responsibility, timing and protection |

The notice instruction respects the actual contractual timetable rather than assuming every notice is due after completion. The existing registry phase remains Post-completion as workflow metadata; contract terms determine the real deadline.

## Preserved recommendation matrix

Abbreviations: N notice; C communications; E consent endeavours; W warranty/disclosure; I indemnity; P consent condition; L longstop/termination. The order below is retained.

| Importance / consequence | Buyer | Seller | Balanced |
| --- | --- | --- | --- |
| Low / notification | Recommended W; Consider C | Required N; Recommended W | Required N; Recommended W |
| Low / consent | Recommended W, E | Recommended W, E; Consider P | Recommended W, E |
| Moderate / notification | Recommended C, W | Required N; Recommended C, W | Required N; Recommended C, W |
| Moderate / consent | Recommended E, I; Consider P | Recommended E, W; Consider P | Recommended E, I, W |
| High / notification | Recommended C, W; Consider L | Required N; Recommended C, W | Required N; Recommended C, W |
| High / consent | Required P; Recommended I; Consider L | Recommended E; Consider L, C | Required P; Recommended E; Consider L |

Other consequences give one Recommended tailored response on every side, with the corresponding perspective instruction. Trigger review remains in the full catalogue; incomplete trigger analysis remains standby under the existing gate. Every live profile has at most three actions, so there is no truncation or consolidation. Required describes the transaction recommendation under the chosen perspective, not universal legal necessity.

## Shared analysis, reports and Hub

`buildCocAnalysis` supplies readiness, factual summary, implications and canonical selected actions to both live rendering and report export. Custom text is escaped at UI rendering, preserving readable unescaped text in reports. Hidden consent-outlook text cannot leak into a notification-only implication.

Exports now read current active-deal `answers`, replacing the retired `deallogic:customer-change-of-control` key. They include only relevant visible branches, current risk, shared summary/implications and the selected action titles, priorities and instructions. No-clause/no-trigger reports exclude stale downstream answers. Incomplete reports include standby rather than generated recommendations.

The new `change-of-control-logic-rendered` event refreshes pending Hub selections after side/answer changes and removes unavailable picks. Hub saving uses canonical action phases and stable-ID duplicate prevention; manually edited saved advice is preserved. Existing issue snapshots and stale indication remain explicit rather than silently rewriting captured advice.

## Legal basis

Reviewed the existing [Porton Capital v 3M judgment](https://caselaw.nationalarchives.gov.uk/ewhc/comm/2011/2895), paragraphs 223 and 228, on 1 November 2026. The existing reasonableness note remains unchanged: the contractual standard and commercial context matter; a restriction on unreasonable refusal does not guarantee consent. The action instructions set negotiation objectives and depend on the actual clause, SPA and transaction facts rather than prescribing a universal level of endeavours or automatic withdrawal right.

## Validation

Five focused tests pass: all eighteen existing importance/requirement/side matrix entries retain IDs, priorities and order; 1,728 clause/trigger/consequence/importance/outlook/side combinations use canonical copy and never exceed three recommendations. Tests cover incomplete and Other-text gates, early exits, all matrix rows in UI/reports, active answers without legacy storage, custom-text escaping, hidden stale outlooks, invalid-side fallback and Seller Hub capture with preserved manual edits and canonical phases.

Browser checks confirmed a completed high-importance consent case, all nine catalogue actions, all three toggle controls and matching Seller catalogue/live wording. Shared registry icons remain in use.

Runtime and whitespace checks pass. Full suite: 155 pass; one pre-existing `core-action-colours.test.mjs` failure expects obsolete positional CSS.
