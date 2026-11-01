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

Perspective-specific actions and conditional deal facts are implemented below; legal notes remain a separate authoring step. Apply deal logic stays in standby until every reachable answer is valid; selecting No at question 1 completes the early-exit branch. Completed questionnaires show Summary, Key deal implications, Additional deal facts (unless no dependence), and Recommended actions. All 12 employee actions are registered in the Action Library; users can select recommendations for Deal Hub. Reports reproduce the same summary, implications, conditional facts, perspective and displayed actions when complete and omit them when incomplete. Existing Buyer/Seller/Balanced settings remain available globally.

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

## Approved action matrix and additional facts

`chooseActions` implements the reviewed matrix, with canonical ER01–ER12 entries in `dist/action-registry.js`. Priorities below are Buyer / Seller / Balanced. Highest applicable priority wins, with one instance per action. Unanswered main questions show standby and no actions; confirmed no dependence shows an explicit no-active-actions message.

| ID | Trigger | Priority |
| --- | --- | --- |
| ER01 Retention agreements | Undecided/departing staff + unresolved arrangements | Required / Recommended / Required |
| ER01 | All staying + difficult replacement + unresolved arrangements | Recommended / Consider / Recommended |
| ER01 | Not needed despite departure/undecided staff or Partly/No handover time | Recommended / Recommended / Recommended; reassess need before documenting agreements |
| ER02 Employment terms | No time for replacement/handover | Required / Recommended / Required |
| ER02 | Partly adequate time | Recommended / Consider / Recommended |
| ER02 | Unknown terms | Recommended for all; review before changing terms |
| ER03 Completion condition | Difficult replacement + planned departures + unresolved arrangements | Required / Consider / Recommended |
| ER03 | Manageable replacement + all leaving + unresolved arrangements | Recommended / Consider / Recommended |
| ER04 Interim covenant | Confirmed signing gap | Recommended / Consider / Recommended |
| ER04 | Signing gap + difficult replacement + planned departures | Required / Consider / Recommended |
| ER05 Warranties | Completed assessment other than No dependence | Recommended / Consider / Recommended |
| ER06 Disclosure | Intentions other than All staying, terms other than Yes, payments other than No, or unresolved arrangements | Recommended / Required / Recommended |
| ER07 Payment allocation | Payments Yes | Required for all |
| ER07 | Payments Unclear | Required / Recommended / Required; establish and allocate exposure |
| ER08 Indemnity | Specific exposure confirmed | Recommended / Consider / Recommended |
| ER09 Seller limits | Broad buyer retention demand confirmed | Absent / Required / Recommended |
| ER10 Security | Specific exposure and recovery concern confirmed | Recommended / Consider / Consider |
| ER11 TUPE | Applicability and outstanding obligations/allocation both confirmed | Required for all |
| ER12 Renegotiate/exit | Risk 5 | Recommended / Consider / Recommended |
| ER12 | Risk 4 + difficult replacement + departures + unresolved arrangements | Consider for all |

All agreed suppresses requests to obtain the same agreements and the associated unresolved-arrangement completion/exit triggers. Unknown alone never establishes a specific exposure, recovery concern, signing gap, broad buyer demand or TUPE applicability. The independently confirmed facts can still support protections when the main assessment is uncertain. No guarantee that employees will remain is inferred.

The optional Additional deal facts panel has Yes/No/Unknown selectors for signing gap, established exposure, broad buyer demand and TUPE applicability; confirmed exposure reveals seller recovery, and confirmed TUPE applicability reveals outstanding obligations. These facts use the existing issue/deal answer key and do not affect the agreed risk matrix or the six-question completion gate. Unknown is the default. Invalid or inapplicable dependent facts are removed, and No dependence clears all additional facts. Reports and saved Hub snapshots retain applicable context.

Sort Required, Recommended, Consider; within a priority: completion condition, TUPE, retention, terms, payments, interim covenant, seller limits, disclosure, warranties, indemnity, security, exit. If more than nine cards are active, consolidate in order: ER08+ER10 indemnity/security; ER04+ER09 covenant/seller limits; ER03+ER12 completion/exit. Keep the highest constituent priority and both instructions. No slice truncation hides triggered protections. Each card uses the lead action's registered icon.

Hub selection reuses select-all, deselection, count, cancel, disabled empty confirmation and save feedback. On rerender, retained picks receive the current side, instructions and snapshot; no-longer-relevant picks are removed. Consolidated cards save their constituent actions under separate stable IDs so prior library additions cannot cause duplicates or overwrite user edits. Already-saved snapshots become stale after answer/fact changes until explicitly refreshed. Registry phases and plain Hub icons are preserved. All 12 entries remain individually available from the Action Library.

Verification includes 108,000 answer/perspective/fact-extreme combinations, all 64 applicability combinations on the severe case across three sides, the cap, priority preservation and exact coverage after consolidation, conditional gates, report/action parity, valid registry icons, and constituent-saving duplicate prevention. Browser verification covers Seller priorities, conditional TUPE activation, saving five actions to Hub and disabled library buttons for those saved identities. The full suite has one pre-existing core action colour test failure unrelated to this change.
