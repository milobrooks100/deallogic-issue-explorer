# Compliance Gaps and Personal Data Breaches

## Identity and scope

Area: Data Protection (`data-protection`). Issue: `compliance-gaps-and-personal-data-breaches`. Jurisdiction: England and Wales; UK target diligence in share or business acquisitions.

The target may have compliance gaps or personal data breaches affecting how it collects, uses or protects personal data. Review the issues, potential exposure and remedial steps to identify any effect on the transaction and work needed before completion.

This delivery includes the questionnaire and agreed risk assessment. Reuse Threatened Litigation’s shared issue header, facts card, question/top/info/select markup, progressive reveal, reset control and standby card. Do not copy its litigation risk, legal notes, actions or analysis. Full compliance audits and transaction-specific data-transfer planning are outside this focused issue.

## Canonical questionnaire

Question wording lives in `dist/issues.json`. Stable answer values, labels and approved tooltips live in `dist/data-protection.js`.

| No. / ID | Question | Choices | Tooltip |
| --- | --- | --- | --- |
| 1 / `dp-issue` | Has a data protection issue been identified? | `yes` → Yes; `suspected` → Suspected; `no` → No; `unknown` → Unknown | Examples include data leaks, unlawful marketing, excessive retention, unanswered access requests or missing supplier terms. Check diligence findings, incident logs and compliance reviews. |
| 2 / `dp-type` | What does the issue concern? | `compliance-gap` → Compliance gap; `personal-data-breach` → Personal data breach; `both` → Both; `unknown` → Unknown | A compliance gap concerns how data is managed; a personal data breach involves its loss, destruction, alteration, unauthorised disclosure or access. Check the findings and incident records. |
| 3 / `dp-ongoing` | Is the issue still ongoing? | `yes` → Yes; `partly` → Partly; `no` → No; `unknown` → Unknown | Check whether the affected processing has stopped and any exposed or unavailable data has been secured or restored. Confirm the position with those managing the response. |
| 3b / `dp-notifications` | Have required breach notifications been made? | `all-made` → All made; `some-outstanding` → Some outstanding; `none-made` → None made; `none-required` → None required; `unknown` → Unknown | Check the notification assessment and records of notices to the Information Commissioner’s Office (ICO), affected individuals or relevant controllers, including dates. Select None required only following an assessment. |
| 4 / `dp-proceedings` | Are there related complaints, claims or regulatory enquiries? (select all that apply) | `complaints` → Complaints; `claims` → Claims; `regulatory-enquiries` → Regulatory enquiries; `none` → None; `unknown` → Unknown | Review complaints logs, legal correspondence and communications with the Information Commissioner’s Office (ICO) or other regulators. Include resolved matters with outstanding obligations or exposure. |
| 5 / `dp-impact` | What is the likely impact on the target or deal? | `minimal` → Minimal; `manageable` → Manageable; `significant` → Significant; `fundamental` → Fundamental; `unknown` → Unknown | Review estimated costs, potential liabilities, business disruption and restrictions on using data. Assess their effect on the target’s operations, value and the completion timetable. |
| 6 / `dp-remediation` | Can all necessary remedial steps be completed before completion? | `completed` → Already completed; `yes` → Yes; `partly` → Partly; `no` → No; `unknown` → Unknown | Review the remediation plan, outstanding tasks, responsible owners and deadlines. Check that the necessary resources and any third-party cooperation are available. |

## Visibility, completion and persistence

All selects start Unanswered. Reveal one question at a time. Only Q1 No ends the focused route. Yes, Suspected and Unknown continue. Every Unknown selection is a valid answer and reveals the next relevant question, including Q4’s exclusive Unknown checkbox. Q3b appears after Q3 is answered when Q3 is Yes or Partly, for any issue type. It also appears for Q2 Personal data breach, Both or Unknown even if Q3 is No or Unknown, since notifications may remain relevant after an incident stops. Only a compliance-gap-only route with Q3 No or Unknown skips Q3b. Q4 uses the same question-top/label/info row as other questions, with a labelled group of checkboxes and “(select all that apply)” in the main question; no separate helper paragraph is shown. Q4 uses compatible multiple selection; None and Unknown are each exclusive, and no choices means Unanswered. Six main questions plus one conditional follow-up meet the agreed scope.

Completion requires valid answers to all visible questions. Changing an answer clears all later answers, including previously hidden notification selections. Normalize invalid/hidden saved answers before render and export. Reset uses the shared control; per-deal persistence uses DealLogicStorage and the existing deal-project-change flow. No migration is needed for this new issue.

## Outputs, risk and actions

The risk indicator updates live using `assessRisk` in `dist/data-protection.js`, and report exports use the same function. The initial display remains 1/5 No risk. The questionnaire-only message beneath the risk bar is removed. Incomplete forms retain the shared standby message; completed forms confirm answers are recorded while analysis/recommendations remain unconfigured. Summary, implications, action recommendations, legal notes and Deal Hub action integration remain a separate authoring stage. Buyer/Seller/Balanced does not affect the score.

## Agreed risk decision table

Only reachable valid answers contribute. Unanswered and Unknown give no adjustments or minimums. Unknown continues the questionnaire; all Unknown returns 1. Each calculation starts afresh, with no accumulated score.

| Order | Condition | Operation |
| --- | --- | --- |
| 1 | First answer absent or No | Return 1; ignore later answers |
| 2 | First answer Yes / Suspected / Unknown | Start 3 / 2 / 1; minimum 2 / 2 / 1 |
| 3 | Issue type, any answer | No adjustment or minimum |
| 4 | Ongoing Yes | +1 and minimum 3 |
| 4 | Ongoing Partly | Minimum 3 |
| 5 | Notifications Some outstanding or None made | +1 and minimum 3 |
| 6 | Any complaints, claims or regulatory enquiries | Minimum 3 once, regardless of selection count |
| 7 | Impact Minimal | −1 |
| 7 | Impact Significant / Fundamental | Minimum 4 / 5 |
| 8 | Remediation Partly or No | Minimum 3 |
| 8 | Remediation Already completed | −1 only with Ongoing No, proceedings None, and notifications All made / None required / legitimately hidden |
| 9 | Apply adjustments | Cap adjusted score at 4, then apply highest protected minimum |

All other answers are neutral. Planned remediation Yes does not reduce risk. Completed remediation cannot erase a protected minimum; uncertain confirmations do not qualify for the reduction. Only Fundamental impact reaches 5, and ordinary adjustments cannot. Invalid/hidden answers never supply adverse effects or favourable assumptions.

Worked cases: No issue → 1; all Unknown → 1; Suspected plus all later Unknown → 2; Yes plus later Unknown → 3; Yes/Ongoing Yes → 4; Yes/stopped/notifications addressed/no external matters/Manageable/completed → 2; same with Significant → 4 or Fundamental → 5; Minimal impact with Yes never drops below 2; Ongoing Yes and outstanding notifications can reach 4 despite Minimal impact.

## Validation

Thirteen focused tests verify questionnaire progression, neutral Unknown answers, starting scores, one-point adjustments, protected floors, notification applicability, grouped external matters, remediation preconditions, hidden-answer exclusion, score/export parity and all 48,000 valid combinations. Shared runtime checks pass; full suite: 115 pass and the existing unrelated core action-colour assertion fails. Scenarios involving transaction-side recommendations, Hub action selection and snapshots remain inapplicable until actions are implemented.

Question numbers in this specification identify the agreed flow only. On-screen questions and downloaded reports display the question text without numeric prefixes.
