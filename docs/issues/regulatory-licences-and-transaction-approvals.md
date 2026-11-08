# Regulatory Licences and Transaction Approvals

## Identity and scope

Area Regulatory (`regulatory`); issue `regulatory-licences-and-transaction-approvals`. UK-target share and business acquisitions, with sector, territorial and applicable overseas requirements established through transaction-specific review. This stage implements the agreed questionnaire, risk assessment, prose summary and key deal implications. Use Threatened Litigation's existing issue header, subtitle, risk track, facts card, tooltip/select styling, progressive reveal, reset and standby panel. Perspective-specific actions are implemented through the [regulatory action matrix](regulatory-action-matrix.md); three user-approved legal notes follow actions, and no litigation rules or advice are copied.

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

## Outputs and assessment

Before completion: Answer all relevant questions to generate your deal analysis.

After completion: Summary followed by Key deal implications, using the shared `.logic-section` / `.logic-conclusion` presentation. `buildAnalysis` returns null until all visible questions are valid; UI and reports use its identical prose and implications. It reads only visible answers and does not mutate saved data. Buyer/Seller/Balanced does not change factual analysis.

### Summary composition

Canonical sentence maps describe operating-permission requirements, identified issues, transaction-step status, impact and deadline readiness. Transaction requirements use a single grammatical list of every selected step in canonical order. Voluntary clearance remains pursued or considered rather than presented as mandatory. Unknown answers remain explicit; completed steps are reported positions and expected delivery is a forecast. Clean early exits mention only the recorded operating-permission and transaction-screening position.

Q6 Already completed alongside a recorded permission/compliance issue or transaction steps not confirmed All completed adds an explicit reconciliation sentence. This avoids treating a reported remedy as proof that the recorded gap, concern or block is cured. Significant and Fundamental impact remain in the prose after reported completion.

### Canonical implication selection

Choose at most one statement per theme; never generate a longer list and truncate it:

1. **Business continuity and impact:** Fundamental, then Significant, then permission gaps/Both, then compliance issues, then uncertainty about operating permissions. Omit for a confirmed clean operating position and lower/unknown impact; impact uncertainty remains explicit in the summary.
2. **Transaction requirements:** Blocked takes precedence, then unknown requirements/status, then reported completed steps, then pending prior approval, mandatory notification or voluntary clearance. Prior-approval wording preserves separate notification obligations; all selected requirements remain in the summary. Omit if no transaction steps are identified.
3. **Readiness and residual exposure:** Conflicting completion reports first, then missed deadlines, partial delivery, expected delivery, unknown timing, or reported completion. Completion with Significant/Fundamental impact retains residual-exposure wording.

Clean early exits show one scoped implication, noting that business or deal changes may require reassessment. Active assessments show one to three unique implications from `implicationCopy`. These describe transaction consequences without introducing an action catalogue or legal notes.

The risk badge and report continue to use the same `assessRisk` function. The initial score is 1/5. Recommended actions, report recommendations and selected-action Hub snapshots use the regulatory action matrix; the same three legal notes appear in completed UI and issue reports.

## Draft risk decision matrix — pending user review

Start at 1. Apply in this order; adjustments cap at 4 before applying the highest protected minimum. Only Fundamental impact sets 5. Unknown and unanswered answers are neutral; all Unknown returns 1, following the existing app convention, and does not establish regulatory safety.

| Order / question | Answer | Operation |
| --- | --- | --- |
| Q1 | Any | No adjustment; determines permission-question visibility |
| Q2 | None identified / Unknown | Neutral |
| Q2 | Permission gaps | Set 3; minimum 3 |
| Q2 | Compliance issues | Set 3; minimum 2 |
| Q2 | Both | Set 3; minimum 3; no duplicate points |
| Q3 | Prior approval / Mandatory notification / Voluntary clearance | Raise to at least 2; minimum 2, once regardless of selection count |
| Q3 | None identified / Unknown | Neutral |
| Q4 | All completed / In progress / Unknown | Neutral |
| Q4 | Not started | +1; minimum 3 if approval or mandatory notification is selected |
| Q4 | Blocked | +1; minimum 4 |
| Q5 | Minimal | −1 |
| Q5 | Manageable / Unknown | Neutral |
| Q5 | Significant / Fundamental | Minimum 4 / 5 |
| Q6 | Already completed | −1 only if all visible questions have known, valid answers and Q3 None identified or Q4 All completed |
| Q6 | Yes / Unknown | Neutral; forecast is not achieved remediation |
| Q6 | Partly | Minimum 3 |
| Q6 | No | +1; minimum 4 if prior approval or permission gaps/Both; otherwise minimum 3 |

An Already completed response cannot override Blocked, a current permission gap, or Significant/Fundamental impact. Where Q2 still records a permission gap, its Medium minimum remains until the underlying answer is updated after verification. All completed transaction steps retain Low while identified steps remain on record. The clean early exits return 1 and exclude downstream responses. Perspective never affects risk.

Worked examples: approval/in progress/Manageable/Yes → 2; approval/not started/Minimal/Yes → 3; approval/Blocked/Minimal/Already completed → 4; permission gaps/no transaction steps/Minimal/Already completed → 3; compliance issues/no transaction steps/Manageable/Already completed → 2; same with Unknown impact → 3; Significant → 4; Fundamental → 5.

## Research basis

Reviewed 6 November 2026 before agreeing this questionnaire:

- [FCA change in control](https://www.fca.org.uk/firms/change-control): prior controller approval is separate from the target's operating authorisation.
- [NSI acquisition guidance](https://www.gov.uk/guidance/national-security-and-investment-act-guidance-on-acquisitions): transaction screening remains relevant without operating licences; distinguish mandatory approval from wider call-in exposure.
- [CMA merger investigations](https://www.gov.uk/government/publications/mergers-how-they-are-investigated/mergers-how-they-are-investigated) and [digital markets guidance](https://www.gov.uk/guidance/how-the-uks-digital-markets-competition-regime-works): ordinary voluntary merger notification differs from specific mandatory reporting regimes.
- [Environment Agency permit transfers](https://www.gov.uk/guidance/change-transfer-or-cancel-your-environmental-permit) and [CQC business transfers](https://www.cqc.org.uk/guidance-regulation/providers/registration/buy-sell-or-transfer-registered-business): the relevant operator and transaction structure matter. Both examples concern England; do not generalise territorial requirements.

## Integration and verification

Regulatory is in the alphabetical Deal Map areas and the common issue tiles. The dedicated script loads after the existing issue adapters, delegates other issues unchanged, and uses the current active-deal storage adapter and shared reset. Runtime checks cover script loading and the storage boundary. Focused tests cover early exits, uncertainty, compatible/exclusive selections, hidden/invalid responses, report parity and non-delegation of risk/advice. The questionnaire tests cover scoring examples, exhaustive answer combinations, protected minimums, hidden-answer exclusion, completed/incomplete analysis gates, canonical implication membership, the three-bullet limit and UI/report parity; the action-matrix specification records the additional action validation.

Browser verification at the existing narrow viewport confirmed the tile, introduction, progressive questions, compatible checkbox selections, completed-stage message and persistence across refresh/reopening. Full account sync, two-deal switching, all themes and desktop-width visual review have not been rechecked. Draft risk rules are covered by automated tests; perspective actions and Hub capture are now implemented and covered by the action-matrix checks.

Regulatory tooltips were shortened after questionnaire review, retaining the distinctions and completion qualifications above. Q3 uses the shared question label and choice-grid answer labels, matching Data Protection and the other facts questions.

The user-approved concise implication wording replaces the original copy in `implicationCopy`; selection precedence, risk rules and the three-bullet limit are unchanged. UI and report exports share this canonical wording.

## Legal notes

Three user-approved notes follow recommended actions in the shared Notes section: Controller approval (FSMA 2000 s.191F), NSI completion risk (NSI Act 2021 s.13) and Post-completion merger intervention (CMA interim-measures guidance). Wording and links are retained exactly as supplied; titles use the shared bold lead-in and sources open separately with `noopener noreferrer`. They are factual, perspective-independent notes, shown only after every relevant question is answered, including clean early exits. Completed issue reports reuse the same canonical text and sources.
