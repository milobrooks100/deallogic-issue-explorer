# Missing IP Assignment: action perspectives

## Scope and completion

Intellectual Property / `missing-ip-assignment`, existing UK M&A issue. Preserve the six factual questions, progressive reveal, risk formula and six action profiles. Confirmed no gap or sufficient ownership/usage evidence completes with no active actions. Otherwise all six relevant responses are required; stale downstream answers cannot bypass an incomplete upstream question. Incomplete analysis uses the standard standby panel.

`missingIpVisibleIds` mirrors the existing progressive form and excludes irrelevant or still-hidden answers from reports. No questionnaire labels or storage values change, so no answer migration is needed. Existing factual summaries and two implications are reused through `missingIpAnalysis` for both UI and export.

Risk remains independent of perspective: initial/no gap/confirmed rights 1; unresolved evidence begins at 2; an established gap begins at 3, adjusted for importance, replacement difficulty, cooperation and an asserted claim, bounded 2–5 under the existing formula.

## Canonical perspective instructions

`dist/action-registry.js` now supplies all eleven actions' titles, instructions, phases, stable IDs and icons. Removed the duplicated live catalogue, including the misleading instruction to execute a “retroactive” deed. Use a valid assignment by completion, with a deed where appropriate and a completion condition for critical IP; no backdating or automatic retrospective cure is assumed.

Nine actions have separate Buyer, Seller and Balanced sentences. Two factual/technical reviews remain neutral. Instructions are one sentence and at most 32 words.

| ID | Buyer objective | Seller objective | Balanced objective |
| --- | --- | --- | --- |
| R01 | Require valid assignment by completion; condition for critical IP | Arrange assignment and agree any critical-IP condition | Agree assignment, appropriate form and critical-IP condition |
| R02 | Review chain of title and ownership/usage rights | Same factual review | Same factual review |
| R03 | Seek effective owner terms with justified payment | Negotiate workable terms and proportionate fees | Agree owner approach and proportionate terms |
| R04 | Specific indemnity with appropriate recovery support | Defined scope, caps, periods and proportionate security | Allocate identified losses with defined limits/security |
| R05 | Require specific disclosure before assessing warranties | Fair, specific disclosure against warranties | Agree specific disclosure of known gaps |
| R06 | Seek title warranties and capped unknown-defect indemnity | Qualified warranties and limited indemnity | Agree qualified warranties and clear indemnity scope |
| R07 | Assess independent replacement feasibility | Same technical/legal review | Same technical/legal review |
| R08 | Settlement, release and transfer conditions with buyer rights | Objective milestones and proportionate withdrawal rights | Objective settlement/transfer conditions and deadline |
| R09 | Seek substantiated price protection | Resist speculative discounts and overlapping protection | Agree substantiated value treatment without duplication |
| R10 | Limit assumed liabilities while securing necessary IP rights | Propose workable structure and retained liabilities | Assess structure without assuming it cures ownership |
| R11 | Renegotiate or assess withdrawal under available rights | Preserve deal through credible cure, timing or terms | Reassess terms and feasibility for material risk |

Actions by Issue reuses the existing visible Buyer/Seller/Balanced toggle group and displays the complete eleven-action catalogue. The live analysis, report and Hub capture use the same selected canonical instructions. No profile-specific second sentence is appended to R01; its one-sentence canonical wording covers a completion condition for critical IP.

## Existing profile matrix and limits

Existing priorities and selection remain unchanged:

| Profile | Buyer | Seller | Balanced |
| --- | --- | --- | --- |
| Cooperative owner, no asserted claim, routine importance/replacement | Required R01; Recommended R02 | Required R01; Recommended R03 | Required R01 |
| Cooperative owner, highly important and hard to replace, no asserted claim | Required R01; Recommended R02; conditional Consider R07 | Required R01; Recommended R03 | Required R01; Recommended R02 |
| Uncooperative/unreachable owner, no claim | Required R04; Recommended R02; conditional Consider R07 | Required R05; Recommended R02 | Required R04 and R05; Consider R07 |
| Unknown owner or claim position | Required R06; Recommended R02; conditional Consider R07 | Required R05; Recommended R02 | Required R05 and R06; Consider R07 |
| Active claim, material/unknown importance and hard/unknown replacement | Required R08 and R04; Recommended R09; conditional Consider R07, plus Consider R10 and R11 | Required R05 and R08; Recommended R09 | Required R08 and R04; Recommended R09 |
| Other active claim | Required R08 and R04; Recommended R09; conditional Consider R07 | Required R05 and R08; Recommended R09 | Required R08 and R04; Recommended R09 |

For Buyer, R07 appears as Consider when replacement is Easy, Manageable or Unknown, and is omitted when Hard, preserving the existing rule and order. Actual active-claim profiles take precedence over uncertainty, then uncooperative/unreachable status, then the critical cooperative case. Every triggered step is retained; at most six cards occur, below the nine-card maximum, so consolidation is unnecessary.

Required is a transaction recommendation under the recorded facts and selected perspective, not a statement that every protection is legally mandated.

## Integration and authority

Reports include current visible answers, risk, shared factual summary/implications and the selected-side action titles, priorities and instructions. Other issue reports continue through the existing export wrappers.

Missing IP participates in pending Hub selection refresh on side/answer changes and uses canonical action phases. Stable-ID duplicate prevention preserves existing manually edited saved actions; snapshots remain explicit captures, with the existing stale indication rather than automatic rewriting.

Checked 1 November 2026:

- [CDPA 1988, section 90(3)](https://www.legislation.gov.uk/ukpga/1988/48/section/90/data.html): assignment of existing copyright requires signed writing; a deed is not universally mandatory.
- [GOV.UK: using somebody else’s copyright](https://www.gov.uk/using-somebody-elses-intellectual-property/copyright): permission, acquisition and permitted exceptions depend on the rights and proposed use.

Existing copyright ownership and assignment notes remain unchanged. The instructions address transaction negotiations rather than asserting universal outcomes for all IP types; review the actual rights, governing agreements and execution requirements.

## Validation

Five focused tests pass. Exhaustive coverage of 5,184 answer/perspective combinations verifies all six profiles, existing priorities/rewrite selection, canonical copy, unique IDs and a maximum of six live actions. Additional checks cover incomplete/stale answers, early exits, all-profile report/UI parity, invalid-side fallback and Seller Hub saving with preserved manual edits and canonical phases.

Browser checks confirmed active-claim live analysis, all eleven catalogue actions, the three perspective controls and matching Seller instructions in the catalogue and live recommendations. Shared registry icons and styling remain in use.

Runtime and whitespace checks pass. Full suite: 150 pass; one pre-existing `core-action-colours.test.mjs` failure expects obsolete positional CSS.
