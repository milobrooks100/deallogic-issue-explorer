# Termination Rights and Material Breaches

## Scope and current delivery

Material Contracts (`commercial-contracts`), issue `termination-rights-and-material-breaches`. England and Wales. Questionnaire, risk-assessment and prose-analysis delivery using the existing Change-of-Control issue header, introduction, risk bar, facts card, question/info/select styling, reset and standby panel. Change-of-Control remains unchanged. The introduction gives examples of important contracts. Change-of-control triggers remain in their separate issue.

## Questionnaire

`dist/issues.json` owns the agreed title, introduction and five question texts. `dist/termination-rights.js` owns canonical stable answer values, visible labels and tooltips. All controls are single-select; no Other input or conditional half-question is needed.

1. Identified breach or termination risk: Yes / Suspected / No / Unknown.
2. Issue type: Breach / Termination right / Both / Unknown.
3. Stage: No formal notice / Breach notice received / Termination notice received / Contract ended / Unknown.
4. Impact: Minimal / Manageable / Significant / Fundamental / Unknown.
5. Resolution before completion: Already addressed / Yes / Partly / No / Unknown.

Start with Q1 only, with Unanswered as an empty placeholder. No at Q1 ends the route; every other valid answer, including Unknown, reveals the next question. Completion means Q1 No or valid answers to all five reachable questions. Changing an answer clears every later answer. Invalid and hidden saved answers are removed before rendering and export. Reset, per-deal storage and account sync use the existing shared controls and storage adapter. No migration is required for this new issue.

## Outputs and deferred work

Completed routes show Summary followed by Key deal implications using the shared Change-of-Control section styling. Incomplete routes retain the shared standby text. Reports export visible questions, current answer labels, the live risk score and the same summary and implications when complete. Recommendations follow the matrix below and can be selected for Deal Hub. Legal notes remain deferred. Buyer/Seller/Balanced does not change factual analysis or risk.

## Summary and implication rules

`buildAnalysis` returns null until Q1 No or every reachable answer is valid. Q1 No produces a scoped negative finding, expressly leaving wider contract compliance unconfirmed, plus one implication. Hidden downstream answers never contribute.

For other completed routes, canonical `summaryCopy` provides one sentence per answer: existence, issue type, stage, impact and resolution. Suspected concerns remain unconfirmed; Unknown stays explicit. A reported notice is not treated as proof of an enforceable termination right. Planned resolution is an expectation rather than an achieved cure. Already addressed is qualified as a reported position; it does not erase the recorded stage or impact.

Canonical `implicationCopy` is selected by three themes without truncating an overlong list:

1. **Deal impact:** Fundamental takes precedence, then Significant, then uncertainty if existence is not confirmed or type/impact is Unknown. Otherwise omit this theme.
2. **Contract continuity:** Select one fixed statement for Contract ended, Termination notice, Breach notice or Unknown stage. No formal notice has no separate continuity implication.
3. **Completion readiness:** Partly/No resolution selects responsibility and costs for unresolved matters; Yes selects delivery dependency; Unknown selects timetable clarification. Already addressed with Significant/Fundamental impact selects reconciliation of the reported resolution and continuing impact; other addressed cases select effectiveness and remaining exposure checks.

Each completed route therefore produces one to three concise, unique implications. Severe impact, loss of continuity and unresolved post-completion matters can all appear together. Uncertainty and answer-level detail remain in the prose even when a more material implication takes precedence.

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

## Action matrix

The eleven families are registered with Buyer, Seller and Balanced copy. The library shows all thirteen cards, including explicit TR12 pause and TR13 first-day-test choices; completed assessments select at most seven. No at Q1 or incomplete routes generate no actions. Required ranks ahead of Recommended, then Consider. Ties use TR02, TR11, TR01, TR03, TR04, TR08, TR07, TR06, TR05, TR09, TR10. Omitted lower-priority options remain available in the library. An identified exposure means Q1 Yes or a breach notice, termination notice or ended contract; unresolved means Q5 is not Already addressed. Serious means Significant or Fundamental impact.

| ID | Trigger and priority |
|---|---|
| TR01 | Always Recommended on active routes; Required for suspected/unknown existence or unknown type, stage or impact. |
| TR02 | Required for unresolved notices or ended contracts; after termination review surviving obligations and claim deadlines. |
| TR03 | Recommended for identified unresolved exposure; Required for serious impact, termination notice or ended contract. |
| TR04 | Already addressed: Buyer Required, otherwise Recommended; Required for all if serious or type, stage or impact is unknown. |
| TR05 | Recommended for any impact except Minimal. |
| TR06 | Identified: Buyer Recommended, Seller/Balanced Required; otherwise Buyer Consider, Seller/Balanced Recommended. |
| TR07 | Recommended for identified unresolved exposure. |
| TR08 | Serious unresolved impact: Buyer Required, Seller Consider, Balanced Recommended. Otherwise unresolved termination notice/ended with Manageable or Unknown impact: Buyer Recommended, others Consider. |
| TR09 | Identified serious unresolved exposure: Buyer/Balanced Recommended, Seller Consider. Identified Manageable exposure with Partly/No/Unknown resolution: all Consider. |
| TR10 | Identified serious impact: Recommended; identified Manageable impact with Partly/No resolution: Consider. |
| TR11 | Fundamental impact: Required, including reported resolution. |

The following variants replace the wording of an existing recommendation, keeping its identity, priority and place in the selection.

| Family / variant | Perspective and trigger (all conditions must hold) | Card instruction |
| --- | --- | --- |
| TR03 — Agree a pause with the counterparty | Seller or Balanced; breach notice or termination notice received; impact Significant or Fundamental; resolution Partly or No | If the contract is still live, seek written agreement on which steps the counterparty will pause, until when, and what each party must do meanwhile. |
| TR01 — Test the first day without the contract | Buyer or Balanced; issue identified (Yes), type known, termination notice received or contract ended; impact Unknown or resolution Unknown | Ask the business owner what would stop on day one, which customers or operations would be affected, and whether the fallback would work in time. |
| TR01 — same variant after the contract has ended | Same rule, with Contract ended | Ask the business owner what actually stopped, who was affected and how the fallback performed; identify any remaining gaps. |

Both techniques are recommended tactics. Preserve the higher priority of the underlying diligence or continuity action when the matrix requires it; asking for a pause does not require obtaining one. A request alone does not suspend deadlines: retain TR02 for any live notice response. Do not recommend a pause for an ended contract. Where existence or type is unclear, retain the ordinary contractual diligence wording. Q5 Unknown is a prompt to test readiness, not evidence that a replacement has failed. The other perspectives keep their original instruction.

## Verification

The completed summary and implications are included in branch preview deployments alongside the questionnaire and live risk assessment.

Build and runtime checks cover the script and storage boundary. Focused tests cover the agreed examples, starting scores, adjustments, protected minimums, conditional remediation reductions, live/report score parity and delegation to other issues. All 12,348 combinations of current answers, unanswered and invalid values verify integer bounds, the exclusive 5 trigger, floors and hidden-answer exclusion. Existing questionnaire tests cover progressive reveal, early exit and normalization. Shared reset and persistence use the established implementation; browser interaction was not rechecked for this scoring-only change. Analysis checks also exercise all 12,348 combinations for completion gates, exact canonical prose coverage, hidden-answer exclusion, fixed implication membership, uniqueness, severity precedence and the three-bullet cap. Focused tests cover all-Unknown/suspected responses, reported resolution with Fundamental impact, completed/incomplete rendering and live/report parity. Action checks cover completed answer combinations on all three sides, retention of every Required action, priority order, reachability, the seven-card cap, conditional wording and live/report parity.

TR12 and TR13 are neutral practical instructions available in all three catalogue perspectives. They are manual catalogue choices; the questionnaire continues to select the existing TR03 and TR01 variants, so no extra automatic cards are introduced.
