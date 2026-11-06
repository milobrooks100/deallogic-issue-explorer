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

## Profile rules and eight action limit

All unresolved gaps receive R02 chain-of-title diligence, R05 specific disclosure and R06 warranty review. R02 is Recommended throughout. R05 is Required for Sellers and Recommended otherwise unless the core profile already requires it. R06 is Required for Buyer/Balanced uncertainty profiles and otherwise Consider; unknown-defect indemnity is optional and must not duplicate protection for identified losses.

The original six profile core protections and their perspective priorities remain. Optional alternatives now follow the actual answers for all three perspectives:

- R03 owner engagement appears only where there is no asserted claim and the owner is reachable; Recommended if cooperative, Consider if uncooperative. It is omitted for unreachable/unknown owners and active claims, where settlement is addressed by R08.
- R01 assignment appears for cooperative owners without an asserted claim. Active claims use R08 settlement, release and transfer rather than a duplicate assignment card.
- Active claims receive R04 specific protection: Required for Buyer/Balanced and Consider for Seller. Existing profile core priorities take precedence.
- R07 replacement feasibility appears as Consider for Easy, Manageable or Unknown replacement, across all perspectives. Hard replacement is not presented as a ready fallback.
- R09 price treatment appears as Consider for material or unknown importance with hostile/unreachable owners or uncertain owner/claim position; active-claim profiles retain their existing Recommended label. The canonical instruction excludes duplicate economic protection.
- R11 reassessment appears as Consider only where importance is Medium, High or Unknown and replacement is Hard.
- R10 structure review appears as Consider only where an asserted claim, material/unknown importance, Hard replacement and an uncooperative/unreachable owner coincide.

Actions remain distinct, retain stable IDs and canonical perspective copy, and are deduplicated before display. No truncation, consolidation or arbitrary padding is used. Exhaustive enumeration yields a maximum of eight and a mean of 6.02 actions across unresolved answer/perspective combinations. Lower-risk scenarios can have fewer; confirmed no gap or sufficient ownership/usage evidence still yields no remediation actions. Incomplete answers remain gated. The eight-card limit overrides the general nine-card convention for this issue.

Required is a transaction recommendation under the recorded facts and selected perspective, not a statement that every protection is legally mandated. No risk formula, legal notes, questionnaire wording or saved-answer values change.

## Integration and authority

Reports include current visible answers, risk, shared factual summary/implications and the selected-side action titles, priorities and instructions. Other issue reports continue through the existing export wrappers.

Missing IP participates in pending Hub selection refresh on side/answer changes and uses canonical action phases. Stable-ID duplicate prevention preserves existing manually edited saved actions; snapshots remain explicit captures, with the existing stale indication rather than automatic rewriting.

Checked 1 November 2026:

- [CDPA 1988, section 90(3)](https://www.legislation.gov.uk/ukpga/1988/48/section/90/data.html): assignment of existing copyright requires signed writing; a deed is not universally mandatory.
- [GOV.UK: using somebody else’s copyright](https://www.gov.uk/using-somebody-elses-intellectual-property/copyright): permission, acquisition and permitted exceptions depend on the rights and proposed use.

Existing copyright ownership and assignment notes remain unchanged. The instructions address transaction negotiations rather than asserting universal outcomes for all IP types; review the actual rights, governing agreements and execution requirements.

## Validation

Exhaustive coverage of 5,184 answer/perspective combinations verifies all six profiles, original core priorities, replacement relevance, canonical copy, unique IDs, early exits, a maximum of eight actions and a 6.02 mean for unresolved gaps. Focused tests cover the supplied high-importance/manageable-replacement/uncooperative-owner/active-claim scenario, no unnecessary financial protection for routine cooperative cases, incomplete/stale answers, all-profile report/UI parity, invalid-side fallback and Seller Hub saving with preserved manual edits and canonical phases.
