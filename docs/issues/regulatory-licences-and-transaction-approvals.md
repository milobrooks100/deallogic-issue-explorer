# Regulatory Licences and Transaction Approvals

## Identity and scope

Area Regulatory (`regulatory`); issue `regulatory-licences-and-transaction-approvals`. UK-target share and business acquisitions, with sector, territorial and applicable overseas requirements established through transaction-specific review. This stage implements the agreed questionnaire only. Use Threatened Litigation's existing issue header, subtitle, risk track, facts card, tooltip/select styling, progressive reveal, reset and standby panel. Substantive risk assessment, summaries, implications, actions and legal notes are deferred at the user's express request; no litigation rules or advice are copied.

Introduction: Review whether the target holds and complies with the regulatory permissions it needs to operate, and whether the proposed transaction requires regulatory approval, notification or clearance. Identify outstanding issues and their effect on business continuity and completion.

## Canonical questionnaire

`dist/issues.json` owns question text and introduction; `dist/regulatory.js` owns stable answer values, labels and tooltips. All questions use single selection except Q3, which permits compatible simultaneous requirements.

| Question ID | Question | Stable values → labels |
| --- | --- | --- |
| `reg-permissions` | Does the target require regulatory permissions to operate? | yes → Yes; no → No; unknown → Unknown |
| `reg-permission-issues` | Have any issues been identified with the target’s regulatory permissions? | none → None identified; gaps → Permission gaps; compliance → Compliance issues; both → Both; unknown → Unknown |
| `reg-transaction-steps` | What regulatory steps does the transaction involve? (select all that apply) | approval → Prior approval; notification → Mandatory notification; voluntary → Voluntary clearance; none → None identified; unknown → Unknown |
| `reg-step-status` | What is the status of those transaction steps? | completed → All completed; progress → In progress; not-started → Not started; blocked → Blocked; unknown → Unknown |
| `reg-impact` | What is the likely impact on the target or deal? | minimal → Minimal; manageable → Manageable; significant → Significant; fundamental → Fundamental; unknown → Unknown |
| `reg-deadlines` | Can all outstanding steps be completed by the applicable deadlines? | completed → Already completed; yes → Yes; partly → Partly; no → No; unknown → Unknown |

Tooltips preserve the agreed evidence checks, distinguish operating permission gaps from compliance issues, explain approval versus notification versus voluntary clearance, and require effective approvals, applicable waiting periods and conditions before All completed. Deadlines distinguish completion, commencement of activities and post-completion filings. Unknown is an explicit valid response; Unanswered is an empty placeholder, or no Q3 selections.

## Visibility and completion

Initially show Q1 only. Each valid response reveals the next relevant question. Q1 No skips Q2 but never Q3; Yes and Unknown show Q2. Q3 None identified skips Q4; all other valid Q3 selections, including Unknown, show Q4. Q3's None identified and Unknown are each exclusive; selecting either clears other selections, and selecting a substantive step clears either exclusive selection.

Finish early if Q3 is None identified and Q1 is No, or Q1 is Yes and Q2 is None identified. Otherwise ask Q5 then Q6. Q1 Unknown cannot take the clean early exit, even if Q2 is None identified. Completion means every visible question is valid. Changing an answer clears all later answers; invalid, obsolete and hidden answers are excluded before rendering, saving and exporting. No migration is needed for this new issue.

## Outputs and deferred assessment

Before completion: Answer all relevant questions to generate your deal analysis.

After completion: Your responses have been recorded. Deal analysis will be added next.

The existing risk badge stays at its initial 1/5 · No risk on every route, including Blocked and Fundamental. The accompanying hint says Assessment to be added. This is a questionnaire-stage placeholder, not an assessment of the recorded facts. Reports explicitly say Risk assessment: not yet configured, and export only visible questions and selected labels. No derived analysis, actions, legal notes or Hub snapshots are generated in this stage; perspective has no effect on factual answers. Required/Recommended/Consider, action registry integration and Hub component identity are inapplicable until the action stage.

## Research basis

Reviewed 6 November 2026 before agreeing this questionnaire:

- [FCA change in control](https://www.fca.org.uk/firms/change-control): prior controller approval is separate from the target's operating authorisation.
- [NSI acquisition guidance](https://www.gov.uk/guidance/national-security-and-investment-act-guidance-on-acquisitions): transaction screening remains relevant without operating licences; distinguish mandatory approval from wider call-in exposure.
- [CMA merger investigations](https://www.gov.uk/government/publications/mergers-how-they-are-investigated/mergers-how-they-are-investigated) and [digital markets guidance](https://www.gov.uk/guidance/how-the-uks-digital-markets-competition-regime-works): ordinary voluntary merger notification differs from specific mandatory reporting regimes.
- [Environment Agency permit transfers](https://www.gov.uk/guidance/change-transfer-or-cancel-your-environmental-permit) and [CQC business transfers](https://www.cqc.org.uk/guidance-regulation/providers/registration/buy-sell-or-transfer-registered-business): the relevant operator and transaction structure matter. Both examples concern England; do not generalise territorial requirements.

## Integration and verification

Regulatory is in the alphabetical Deal Map areas and the common issue tiles. The dedicated script loads after the existing issue adapters, delegates other issues unchanged, and uses the current active-deal storage adapter and shared reset. Runtime checks cover script loading and the storage boundary. Focused tests cover early exits, uncertainty, compatible/exclusive selections, hidden/invalid responses, report parity and non-delegation of risk/advice. Build and all 182 repository tests pass.

Browser verification at the existing narrow viewport confirmed the tile, introduction, progressive questions, compatible checkbox selections, completed-stage message and persistence across refresh/reopening. Full account sync, two-deal switching, all themes and desktop-width visual review have not been rechecked. Substantive material/remediated risk scenarios, perspective actions and Hub snapshots are deferred rather than claimed as verified.
