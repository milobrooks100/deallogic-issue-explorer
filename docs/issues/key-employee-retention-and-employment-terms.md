# Key Employee Retention and Employment Terms

## Scope and current delivery

Employment (`employees`) contains `key-employee-retention-and-employment-terms`. This branch implements the agreed questionnaire and introduction only, using Threatened Litigation's shared header, facts card, single-select controls, information tooltips, progressive reveal, reset and standby layout. Jurisdiction metadata follows that template. It does not duplicate litigation scoring, legal notes or recommended actions.

The introduction is maintained in `dist/issues.json`: “The target may depend on employees whose departure would affect its operations or value. Review their plans, employment terms and transaction payments to identify any retention or handover arrangements needed for continuity.”

Included: key staff dependence, replacement, intentions, continuity terms, transaction payments and retention/handover readiness. General employment liabilities, TUPE and pensions remain outside this issue; option treatment belongs in Option Holders.

## Canonical questionnaire

Question text lives in `dist/issues.json`; stable answer values, labels and the agreed tooltips live in `dist/employees.js`.

| ID | Question focus | Stable values → labels |
| --- | --- | --- |
| employee-dependence | Dependence on particular employees | yes → Yes; no → No; unknown → Unknown; not-assessed → Not assessed |
| employee-replacement | Replacement difficulty | easy → Easy; manageable → Manageable; difficult → Difficult; unknown → Unknown |
| employee-intentions | Intention to remain | all-staying → All intend to stay; some-undecided → Some undecided; some-leaving → Some plan to leave; unknown → Unknown; not-assessed → Not assessed |
| employee-terms | Time for replacement and handover | yes → Yes; partly → Partly; no → No; unknown → Unknown; not-assessed → Not assessed |
| employee-payments | Transaction-triggered payments | yes → Yes; no → No; unclear → Unclear; not-assessed → Not assessed |
| employee-arrangements | Retention/handover arrangements | all-agreed → All agreed; some-outstanding → Some still outstanding; none-agreed → None agreed; not-needed → Not needed; not-assessed → Not assessed |

Every control is single-select with an empty Unanswered placeholder. Each valid answer reveals the next question. No dependence ends this focused key-employee flow; this does not establish that no payments arise elsewhere in the workforce. Unknown and Not assessed remain explicit valid responses and permit continued fact collection. An upstream change clears all later answers, as in Threatened Litigation. Hidden or invalid answers are removed on rendering and excluded from export. No Other field or migration is needed for these new IDs. Slightly longer agreed labels retain precision.

## Outputs and integration

Answers use existing issue/deal-scoped DealLogicStorage, reset and account sync. Reports contain only reachable questions and current answer labels, plus the introduction. The shared alphabetical area map also populates the landing cards.

Employee assessment, summaries, implications, action priorities, side differences and legal notes are deferred to the next authoring stage. Apply deal logic remains in the existing standby state, even after all questions are answered. No registered employee actions or Hub selection are supplied at this stage. Existing Buyer/Seller/Balanced settings remain available globally.

The shared risk assessment bar is displayed, as requested, with the initial 1/5 No risk state. Employee-specific scoring remains pending; the current score stays at its initial value and is omitted from the questionnaire report. Do not reuse litigation risk rules. Full issue authoring must complete the risk table, actions, sources and Hub integration before this issue is treated as complete.

## Verification

Automated checks cover progressive visibility, unknown/not-assessed responses, confirmed-absence exit, invalid responses, hidden-answer removal, export labels, standby and delegation to other issue renderers. Verify question selection, reload, reset, tooltips and the new Employment navigation in the browser. Material/remediated scores, action sides, Hub snapshots and legal-note verification are inapplicable to this questionnaire-only stage and remain future work.
