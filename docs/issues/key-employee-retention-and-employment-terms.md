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

Employee risk scoring, recommended actions, side differences and legal notes are deferred to the next authoring stage. Apply deal logic stays in standby until every reachable answer is valid; selecting No at question 1 completes the early-exit branch. Completed questionnaires show Summary followed by Key deal implications. No registered employee actions or Hub selection are supplied at this stage. Reports reproduce the same summary and implications when complete and omit them when incomplete. Existing Buyer/Seller/Balanced settings remain available globally.

The shared risk assessment bar is displayed, as requested, with the initial 1/5 No risk state. Employee-specific scoring remains pending; the current score stays at its initial value and is omitted from the questionnaire report. Do not reuse litigation risk rules. Full issue authoring must complete the risk table, actions, sources and Hub integration before this issue is treated as complete.

## Verification

Automated checks cover progressive visibility, partial/unknown responses and migration of legacy uncertainty selections, confirmed-absence exit, invalid responses, hidden-answer removal, export labels, standby and delegation to other issue renderers. All 18,000 combinations of current options and unanswered states are checked for completion, exact summary composition, stable implication membership, uniqueness and the three-point cap. Scenario tests cover adverse, uncertain, clear and inconsistent positions, clearing answers, and report parity. Verify question selection, reload, reset, tooltips and the new Employment navigation in the browser. Material/remediated scores, action sides, Hub snapshots and legal-note verification are inapplicable to this questionnaire-only stage and remain future work.

## Summary and implication rules

Question 2 uses “business”: “How difficult would it be to replace those employees without disrupting the business?” This is an explicit wording exception to the target terminology used elsewhere.

`buildAnalysis` composes one sentence for each reachable answer from `summaryCopy`. It covers every current answer, including partial dependence, uncertainty, intention rather than guaranteed retention, and agreement rather than completed implementation. A No-dependence early exit ignores all downstream responses and expressly avoids conclusions about wider employment liabilities or payments.

`implicationCopy` supplies a fixed set of consequence statements. Select at most one per theme, in this order:

1. Continuity: unknown dependence takes priority; otherwise difficult replacement or undecided staff or some/all planned departures indicates disruption/value exposure; otherwise unknown replacement or intentions leaves readiness uncertain.
2. Terms and arrangements: Not needed alongside continuity concerns, unknown dependence/replacement/intentions or inadequate/unknown terms prompts reassessment. Otherwise inadequate/unknown terms or outstanding/unknown arrangements create a transaction dependency. Fully agreed arrangements with adequate terms require implementation without guaranteeing retention.
3. Payments: confirmed payments require quantification/allocation; unclear payments leave unresolved cost exposure.

If no theme applies, use one qualified clear-position statement. No dependence uses a separate single early-exit implication. The maximum of three follows from these three themes, without truncating a longer list. Changing or clearing upstream answers removes unreachable summary content and implications. This stage does not determine risk scores, suggest legal remedies or introduce actions.
