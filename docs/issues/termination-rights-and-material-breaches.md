# Termination Rights and Material Breaches

## Scope and current delivery

Material Contracts (`commercial-contracts`), issue `termination-rights-and-material-breaches`. England and Wales. Questionnaire and risk-assessment delivery using the existing Change-of-Control issue header, introduction, risk bar, facts card, question/info/select styling, reset and standby panel. Change-of-Control remains unchanged. The introduction gives examples of important contracts. Change-of-control triggers remain in their separate issue.

## Questionnaire

`dist/issues.json` owns the agreed title, introduction and five question texts. `dist/termination-rights.js` owns canonical stable answer values, visible labels and tooltips. All controls are single-select; no Other input or conditional half-question is needed.

1. Identified breach or termination risk: Yes / Suspected / No / Unknown.
2. Issue type: Breach / Termination right / Both / Unknown.
3. Stage: No formal notice / Breach notice received / Termination notice received / Contract ended / Unknown.
4. Impact: Minimal / Manageable / Significant / Fundamental / Unknown.
5. Resolution before completion: Already addressed / Yes / Partly / No / Unknown.

Start with Q1 only, with Unanswered as an empty placeholder. No at Q1 ends the route; every other valid answer, including Unknown, reveals the next question. Completion means Q1 No or valid answers to all five reachable questions. Changing an answer clears every later answer. Invalid and hidden saved answers are removed before rendering and export. Reset, per-deal storage and account sync use the existing shared controls and storage adapter. No migration is required for this new issue.

## Outputs and deferred work

Summary, implications, recommendations, legal notes, action registry entries and Hub capture remain deferred. Apply deal logic retains the shared standby text. Reports export visible questions, current answer labels and the same calculated risk score and label as the live indicator, with a note explaining that deal analysis and actions are not yet configured. Buyer/Seller/Balanced does not change risk.

## Agreed risk decision table

Recompute from reachable, valid answers on every render. Untouched or Q1 No returns 1 and ignores downstream answers. Unknown and Unanswered add no points or minimums, except that valid Unknown permits progression. All Unknown returns 1; this is not confirmation of contract safety.

| Order | Answer | Adjustment / minimum |
| --- | --- | --- |
| 1 | Q1 Yes / Suspected / Unknown | Start 3 / 2 / 1; minimum 2 / 2 / 1 |
| 2 | Q2 any type | Neutral; Both does not double-count a breach and its termination right |
| 3 | Q3 No formal notice / Unknown | Neutral |
| 3 | Q3 Breach notice received | +1; minimum 3 |
| 3 | Q3 Termination notice received / Contract ended | +1; minimum 4 |
| 4 | Q4 Minimal / Manageable / Unknown | −1 / neutral / neutral |
| 4 | Q4 Significant / Fundamental | Minimum 4 / 5 |
| 5 | Q5 Already addressed | Minimum 2; −1 only when Q2, Q3 and Q4 each have a valid non-Unknown answer |
| 5 | Q5 Yes / Unknown | Neutral; a forecast is not a completed remedy |
| 5 | Q5 Partly / No | Minimum 3 / +1 and minimum 3 |
| 6 | Final | Clamp adjusted score to 1–4, then apply highest protected minimum |

Only Fundamental impact reaches 5. Reductions never erase a protected minimum, including historical termination stages. No formal notice earns no reduction. Already addressed with an unknown type, stage or impact earns no reduction. Existing answers need no migration.

Worked examples: suspected breach, no notice, minimal impact, Yes resolution = 2; confirmed breach, breach notice, manageable impact, Yes = 4; confirmed breach, no notice, manageable impact, Already addressed = 2; termination notice or ended contract, minimal impact, Already addressed = 4; Fundamental impact with any resolution = 5.

## Verification

Build and runtime checks cover the script and storage boundary. Focused tests cover the agreed examples, starting scores, adjustments, protected minimums, conditional remediation reductions, live/report score parity and delegation to other issues. All 12,348 combinations of current answers, unanswered and invalid values verify integer bounds, the exclusive 5 trigger, floors and hidden-answer exclusion. Existing questionnaire tests cover progressive reveal, early exit and normalization. Shared reset and persistence use the established implementation; browser interaction was not rechecked for this scoring-only change. Action, Hub and snapshot scenarios remain deferred with that functionality.
