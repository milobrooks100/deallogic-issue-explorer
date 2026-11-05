# Termination Rights and Material Breaches

## Scope and current delivery

Material Contracts (`commercial-contracts`), issue `termination-rights-and-material-breaches`. England and Wales. Questionnaire-only delivery using the existing Change-of-Control issue header, introduction, risk bar, facts card, question/info/select styling, reset and standby panel. Change-of-Control remains unchanged. The introduction defines material contracts and gives examples. Change-of-control triggers remain in their separate issue.

## Questionnaire

`dist/issues.json` owns the agreed title, introduction and five question texts. `dist/termination-rights.js` owns canonical stable answer values, visible labels and tooltips. All controls are single-select; no Other input or conditional half-question is needed.

1. Identified breach or termination risk: Yes / Suspected / No / Unknown.
2. Issue type: Breach / Termination right / Both / Unknown.
3. Stage: No formal notice / Breach notice received / Termination notice received / Contract ended / Unknown.
4. Impact: Minimal / Manageable / Significant / Fundamental / Unknown.
5. Resolution before completion: Already addressed / Yes / Partly / No / Unknown.

Start with Q1 only, with Unanswered as an empty placeholder. No at Q1 ends the route; every other valid answer, including Unknown, reveals the next question. Completion means Q1 No or valid answers to all five reachable questions. Changing an answer clears every later answer. Invalid and hidden saved answers are removed before rendering and export. Reset, per-deal storage and account sync use the existing shared controls and storage adapter. No migration is required for this new issue.

## Outputs and deferred work

This pass does not implement summary, implications, risk decision rules, recommendations, legal notes, action registry entries or Hub capture. The risk indicator retains the standard initial 1/5 No risk value without applying Change-of-Control scoring; Apply deal logic retains the shared standby text. Reports export only visible questions and current labels, with an explicit questionnaire-only note and no calculated risk or advice. Transaction-side selection remains shared; the factual questionnaire is neutral.

## Verification

Build and runtime checks cover the new script and storage boundary. Focused tests cover Unknown progression, confirmed-absence early exit, invalid/hidden saved-answer cleanup, report labels, omission of borrowed advice, fixed initial risk and delegation to other issue logic. Shared reset and persistence use the established implementation. Full risk/action, Hub and snapshot scenarios are inapplicable until that functionality is separately authored.
