# Compliance Gaps and Personal Data Breaches

## Identity and scope

Area: Data Protection (`data-protection`). Issue: `compliance-gaps-and-personal-data-breaches`. Jurisdiction: England and Wales; UK target diligence in share or business acquisitions.

The target may have compliance gaps or personal data breaches affecting how it collects, uses or protects personal data. Review the issues, potential exposure and remedial steps to identify any effect on the transaction and work needed before completion.

This delivery is the questionnaire stage only. Reuse Threatened Litigation’s shared issue header, facts card, question/top/info/select markup, progressive reveal, reset control and standby card. Do not copy its litigation risk, legal notes, actions or analysis. Full compliance audits and transaction-specific data-transfer planning are outside this focused issue.

## Canonical questionnaire

Question wording lives in `dist/issues.json`. Stable answer values, labels, numbering and approved tooltips live in `dist/data-protection.js`.

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

Initial shared indicator remains 1/5 No risk, with an explicit questionnaire-only message stating assessment is not configured; this value is a UI placeholder and does not assess recorded facts. Report exports explicitly state Risk assessment: not yet configured, and include only visible questions with current labels. Incomplete forms retain the shared standby message. Complete forms confirm answers are recorded and analysis/recommendations are not yet configured. No summary, implications, action recommendations or legal notes are authored at this stage. No actions can be added to Deal Hub for this draft; registry, action playbooks, Hub extraction and perspective rules are inapplicable until that work is commissioned. Do not infer a favourable legal conclusion from Q1 Unknown or completed remediation.

## Validation

Focused checks exercise the confirmed-absence early exit and all-Unknown progression, progressive reveal, all three notification triggers and the gap-only skip, compatible/exclusive multiple selection, invalid answers, upstream invalidation, reports and isolation from existing issue outputs. Shared build and runtime checks cover data and script loading. Visual and interaction QA checks the template layout, tooltips, reset and narrow viewport. Substantive risk, remediated-risk reductions, transaction-side actions, Hub selection and snapshots are not applicable to this questionnaire-only stage.

Verified on 1 November 2026: build and 12-script runtime check pass; seven focused questionnaire/data tests pass; full suite 107 pass with the existing unrelated core action-colour assertion failing. Browser QA at the narrow in-app viewport confirmed area navigation, title/introduction, progressive reveal, Q3b, compatible selection, None exclusivity, upstream clearing, gap-only skip, reset and first tooltip text. The shared per-deal storage path is reused; cross-deal/reload persistence was inspected in source but not separately exercised in this browser pass. No 21st CLI is installed; existing project template components were reused as explicitly requested.
