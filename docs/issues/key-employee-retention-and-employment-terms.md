# Key Employee Retention and Employment Terms

## Scope and current delivery

Employment (`employees`) contains `key-employee-retention-and-employment-terms`. This branch implements the agreed questionnaire, introduction, prose summary and key deal implications, using Threatened Litigation's shared header, facts card, single-select controls, information tooltips, progressive reveal, reset and standby layout. Jurisdiction metadata follows that template. It does not duplicate litigation scoring, legal notes or recommended actions.

The introduction is maintained in `dist/issues.json`: “The target may depend on employees whose departure would affect its operations or value. Review their plans, employment terms and transaction payments to identify any retention or handover arrangements needed for continuity.”

Included: key staff dependence, replacement, intentions, continuity terms, transaction payments and retention/handover readiness. General employment liabilities, TUPE and pensions remain outside this issue; option treatment belongs in Option Holders.

## Canonical questionnaire

Question text lives in `dist/issues.json`; stable answer values, labels and the agreed tooltips live in `dist/employees.js`.

| ID | Question focus | Stable values → labels |
| --- | --- | --- |
| employee-dependence | Dependence on particular employees | yes → Yes; no → No; partly → Partly; unknown → Unknown |
| employee-replacement | Replacement difficulty | easy → Easy; manageable → Manageable; difficult → Difficult; unknown → Unknown |
| employee-intentions | Intention to remain | all-staying → All intend to stay; some-undecided → Some undecided; some-leaving → Some plan to leave; all-leaving → All plan to leave; unknown → Unknown |
| employee-terms | Time for replacement and handover | yes → Yes; partly → Partly; no → No; unknown → Unknown |
| employee-payments | Transaction-triggered payments | yes → Yes; no → No; unclear → Unclear |
| employee-arrangements | Retention/handover arrangements | all-agreed → All agreed; some-outstanding → Some still outstanding; none-agreed → None agreed; not-needed → Not needed; unknown → Unknown |

Every control is single-select with an empty Unanswered placeholder. Each valid answer reveals the next question. No dependence ends this focused key-employee flow; this does not establish that no payments arise elsewhere in the workforce. Partly and Unknown permit continued fact collection. Unknown (Unclear for transaction payments) covers both an unreviewed and an uncertain position; Not assessed is no longer offered. An upstream change clears all later answers, as in Threatened Litigation. Hidden or invalid answers are removed on rendering and excluded from export. No Other field is needed. Existing not-assessed answers migrate to unknown, or unclear for transaction payments, before visibility is evaluated and are saved through the existing adapter. Later valid answers are preserved. Slightly longer agreed labels retain precision.

## Outputs and integration

Answers use existing issue/deal-scoped DealLogicStorage, reset and account sync. Reports contain only reachable questions and current answer labels, plus the introduction. The shared alphabetical area map also populates the landing cards.

Perspective-specific actions and conditional wording are implemented below; legal notes remain a separate authoring step. Apply deal logic stays in standby until every reachable answer is valid; selecting No at question 1 completes the early-exit branch. Completed questionnaires show Summary, Key deal implications, and Recommended actions. All 12 employee actions are registered in the Action Library; users can select recommendations for Deal Hub. Reports reproduce the same summary, implications, perspective and displayed actions when complete and omit them when incomplete. Existing Buyer/Seller/Balanced settings remain available globally.

The shared risk assessment bar is displayed, as requested, with the initial 1/5 No risk state. Employee-specific scoring updates from active answers and the calculated score and risk level are included in the report. Do not reuse litigation risk rules. The action registry, shared icons, selection controls and Hub integration are implemented. Legal notes and their authorities remain a separate authoring step.

## Verification

Automated checks cover progressive visibility, partial/unknown responses and migration of legacy uncertainty selections, confirmed-absence exit, invalid responses, hidden-answer removal, export labels, standby and delegation to other issue renderers. All 18,000 combinations of current options and unanswered states are checked for completion, exact summary composition, stable implication membership, uniqueness and the three-point cap. Scenario tests cover adverse, uncertain, clear and inconsistent positions, clearing answers, and report parity. Verify question selection, reload, reset, tooltips and the new Employment navigation in the browser. Material/remediated scores and report parity are tested. Action sides, Hub snapshots and duplicate prevention are implemented; legal-note verification remains future work.

## Summary and implication rules

Question 2 uses “business”: “How difficult would it be to replace those employees without disrupting the business?” This is an explicit wording exception to the target terminology used elsewhere.

`buildAnalysis` composes one sentence for each reachable answer from `summaryCopy`. It covers every current answer, including partial dependence, uncertainty, intention rather than guaranteed retention, and agreement rather than completed implementation. A No-dependence early exit ignores all downstream responses and expressly avoids conclusions about wider employment liabilities or payments.

`implicationCopy` supplies a fixed set of consequence statements. Select at most one per theme, in this order:

1. Continuity: unknown dependence takes priority; otherwise difficult replacement or undecided staff or some/all planned departures indicates disruption/value exposure; otherwise unknown replacement or intentions leaves readiness uncertain.
2. Terms and arrangements: Not needed alongside continuity concerns, unknown dependence/replacement/intentions or inadequate/unknown terms prompts reassessment. Otherwise inadequate/unknown terms or outstanding/unknown arrangements create a transaction dependency. Fully agreed arrangements with adequate terms require implementation without guaranteeing retention.
3. Payments: confirmed payments require quantification/allocation; unclear payments leave unresolved cost exposure.

If no theme applies, use one qualified clear-position statement. No dependence uses a separate single early-exit implication. The maximum of three follows from these three themes, without truncating a longer list. Changing or clearing upstream answers removes unreachable summary content and implications. Risk scoring is defined below. The approved contractual protections are implemented below.

## Agreed risk decision table

`assessRisk` computes from reachable, valid answers only; no accumulated state or transaction-side adjustment is used. Unanswered fields supply neither adjustments nor favourable assumptions. No selection or No dependence returns 1; otherwise the minimum overall score is 2. The completed prose gate remains separate from the live score.

| Order | Answer | Adjustment / protected minimum |
| --- | --- | --- |
| 1 | Dependence Yes / Partly / Unknown | Start 3 / 2 / 2; overall minimum 2 |
| 2 | Replacement Easy / Manageable | −1 / none |
| 2 | Replacement Difficult / Unknown | +1 and minimum 3 / minimum 3 |
| 3 | All staying / Some undecided / Unknown intentions | −1 / minimum 3 / minimum 3 |
| 3 | Some leaving | +1; minimum 4 if replacement difficult, otherwise 3 |
| 3 | All leaving | +2; minimum 3 if replacement easy, otherwise 4 |
| 4 | Terms Yes / Partly / No / Unknown | None / minimum 3 / +1 and minimum 3 / minimum 3 |
| 5 | Payments Yes / No / Unclear | Minimum 2 / none / minimum 3 |
| 6 | All arrangements agreed | −1 only when dependence is Yes/Partly, replacement is known and intentions are known |
| 6 | Some outstanding / None agreed / Unknown arrangements | Minimum 3 |
| 6 | None agreed with undecided or leaving employees, or Partly/No handover time | Additional +1 |
| 6 | Not needed | No adjustment or reduction |
| 7 | All adjustments applied | Apply protected minimums after reductions; cap ordinary result at 4 |
| 8 | Dependence Yes + replacement Difficult + All leaving + terms No + an answered arrangement other than All agreed | Override to 5 |

The 5 override requires an actual valid arrangement answer: an unanswered final question does not establish an absence of agreed arrangements. Explicit Unknown or Not needed qualifies in this severe combination because no agreed mitigation is established. All agreed reduces that severe case to 4. Uncertainty alone normally holds at 3, without additive escalation to 5. Hidden and stale answers never affect the score.

Worked outcomes: No dependence → 1; Yes/Easy/All staying/Yes/No/All agreed → 2; same with Unclear payments → 3; Yes/Difficult/Some leaving/Yes/No/All agreed → 4; Yes/Easy/All leaving/Yes/No/All agreed → 3; Yes/Difficult/All leaving/No/Yes/None agreed → 5; changing only None agreed to All agreed → 4; all explicit uncertainties → 3.

Risk checks cover all 18,000 combinations of current choices and unanswered states, integer bounds, hidden-answer exclusion, uncertainty and departure floors, the exclusive 5 trigger and non-increasing risk when outstanding arrangements become agreed. Focused scenarios verify each agreed example, remediation, export score parity and delegation to other issues.

Question 1 Unknown starts at 2/5 Low risk, as requested. Later answered questions can independently impose higher floors; unknown dependence alone does not impose a minimum of 3.

## Current 12-action matrix

The revised set replaces the earlier Employment catalog in place. `chooseActions` uses only the six main answers; no supplementary questionnaire is rendered. Conditional actions explain their applicability in one sentence and remain Consider rather than assuming unrecorded facts. Priorities below are Buyer / Seller / Balanced. No dependence gives no actions; incomplete questionnaires stay in standby.

| ID / action | Trigger | Priorities |
| --- | --- | --- |
| ER13 Review employment contracts | Dependence, intentions or terms Unknown | Required / Recommended / Required |
| ER13 | Terms Partly/No | Required / Recommended / Recommended |
| ER13 | Other completed assessments | Recommended / Consider / Recommended |
| ER14 Review pay and incentives | Undecided/departing employees + unresolved arrangements | Consider for all; conditional on remuneration contributing to departure risk |
| ER01 Binding retention arrangements | Undecided/departing + unresolved arrangements | Required / Recommended / Required |
| ER01 | All staying + difficult replacement + unresolved arrangements | Recommended / Consider / Recommended |
| ER01 | Not needed despite undecided/departing staff or inadequate handover time | Recommended for all; reassess need |
| ER15 Review good/bad leaver terms | Undecided/departing employees | Consider for all; only if shares, options or continuing equity incentives exist, linked to Option Holders |
| ER02 Strengthen employment terms | Terms No | Required / Recommended / Required |
| ER02 | Terms Partly | Recommended / Consider / Recommended |
| ER03 Key employee completion protections | Difficult replacement + departures + unresolved arrangements | Required / Consider / Recommended |
| ER03 | Manageable replacement + all leaving + unresolved arrangements | Recommended / Consider / Recommended |
| ER04 Pre-completion employment covenant | Any completed dependent assessment | Consider for all; if signing precedes completion |
| ER05 Employment warranties and disclosure | Any completed dependent assessment | Recommended for all |
| ER05 | Intentions not All staying, terms not Yes, payments not No, or unresolved arrangements | Recommended / Required / Recommended |
| ER07 Allocate employee payments | Payments Yes | Required for all |
| ER07 | Payments Unclear | Required / Recommended / Required; establish and allocate exposure |
| ER08 Specific indemnity and security | Payments Yes/Unclear, terms Partly/No, or departures | Consider for all; protection requires identified liability, with security if recovery is a concern |
| ER09 Limit seller retention obligations | Undecided/departing employees, difficult replacement or unresolved arrangements | Absent / Consider / Consider; if broad buyer guarantees are sought |
| ER11 TUPE protections | Any completed dependent assessment | Consider for all; if TUPE applies to a business transfer |

Unresolved means Some outstanding, None agreed or Unknown. All agreed suppresses renewed requests for the same agreements and unresolved-arrangement completion conditions. Unknown terms trigger diligence, not assumed amendments. Indemnity wording does not treat departure itself as a seller liability. Pay review assesses the package; retention arrangements document commitments. Leaver review does not assume equity exists or that resignation automatically means bad-leaver status, and points to Option Holders rather than duplicating award implementation.

Canonical registry order/icons follow the reviewed list: contracts/search; pay/wrench; retention/handshake; leaver/search; terms/wrench; completion/circle-check; covenant/file-pen-line; warranties/shield-check; payments/calendar-check; indemnity/banknote; seller limits/file-pen-line; TUPE/file-pen-line.

Sort Required, Recommended, Consider, then completion, payments, contracts, retention, terms, warranties, covenant, seller limits, indemnity, leaver, pay, TUPE. When over nine cards, merge ER13+ER02 (Review and strengthen employment terms), then ER01+ER14 (Review pay and agree retention), then ER04+ER09 (Agree interim controls and seller limits). Use a dedicated concise sentence preserving both protections rather than concatenating the standalone descriptions, and retain the higher priority. The primary action supplies the approved icon. No truncation discards protections.

Existing semantic IDs remain stable. New diligence/pay/leaver actions use ER13–ER15; retired disclosure ER06, standalone security ER10 and exit ER12 resolve to merged successors ER05, ER08 and ER03 only for this issue. Legacy saved titles receive the same narrow mapping. Saved user content is not rewritten. Duplicate checks resolve both new and legacy identities; existing saved items retain their user edits. Consolidated cards save component actions separately with registered IDs and phases. Shared Hub selection, stale snapshots, role changes and registry icons continue to apply.

Tests cover all 54,000 answer/perspective combinations, nine-card enforcement, full protection coverage and priority retention after consolidation, every approved icon, current catalog order, representative matrix branches, retired-identity resolution, existing edited-action preservation and export/render parity. Risk scoring and prose logic are unchanged. The repository retains one unrelated pre-existing core action colour test failure.
