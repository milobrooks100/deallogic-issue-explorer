# Deal Map authoring standard

Read this first when adding or changing a Deal Map issue. An **area** is a category, such as Finance; an **issue** is an individual questionnaire and response, such as Debt Facilities. A new area may contain several issues.

Use the [issue template](deal-map-issue-template.md), verify the [scenario checklist](deal-map-scenario-checklist.md), and consult the [existing-area reference](deal-map-existing-area-reference.md) for source locations and exceptions. Existing issues illustrate the pattern; their substantive rules are not interchangeable.

## Questions and answers

- Ask one concise, factual question at a time. Aim for five or six questions; add questions only where the answer changes the analysis or implementation.
- Prefer no more than five substantive choices per question, excluding the `Unanswered` placeholder. Explain any exception in the issue specification.
- Prefer one to three words per answer. Use a few more where legal or factual precision requires it; put definitions and supporting detail in the information tooltip.
- Distinguish `Unanswered` (no selection), `Unknown` (the fact is unknown), and `Not assessed` (the review has not happened) where relevant. Do not silently substitute a favourable answer.
- Use single selection by default. Use multiple selection only for compatible simultaneous facts; make an exclusive uncertainty option clear incompatible selections. Use a slider only for a genuinely ordered scale.
- Reveal relevant follow-up questions progressively. Define early exits, visibility, required answers and any `Other` text requirements. When an upstream answer changes, clear or exclude irrelevant dependent answers from scoring, summaries, actions, exports and saved context.
- Keep one canonical set of current labels and use stable answer identifiers or positions for logic. Define migration of existing saved answers when changing established values.

## Presentation and Apply deal logic

Reuse the current shared typography, spacing, theme, risk colours, tooltips, action icons and responsive behaviour. Preserve the area label, issue title, short introduction and risk assessment above **Establish the facts** and **Apply deal logic**.

Before the applicable completion rule is satisfied, show the existing standby panel:

> Turn the recorded facts into a clear transaction response.

After completion, use this order:

1. **Summary:** a short, factual account of the recorded position, including material uncertainty.
2. **Key deal implications:** preferably two or three concise bullets explaining the transaction effect, without repeating the questionnaire. A clear early exit may need only one.
3. **Recommended actions:** only relevant actions, each with its priority label, registry icon, short title and concise instruction. Preserve the Buyer / Seller / Balanced selector where applicable. Show an explicit no-active-actions message when appropriate.
4. **Notes:** two or three issue-specific legal notes. Each uses a short bold lead-in with a colon, followed by one or two concise sentences. Reuse `.logic-note` smaller, muted text and paragraph spacing; keep notes inside the existing Notes section. Verify new legal propositions and references for the specified jurisdiction.

## Risk and action rules

Use the existing five-step scale and indicator: **1 No risk, 2 Low risk, 3 Medium risk, 4 High risk, 5 Very high risk**. Write an issue-specific decision table with rule order, increases, reductions, floors, caps, uncertainty treatment and early exits. Include worked scenarios with expected scores. Do not derive risk merely from the number of questions answered or copy another issue's formula.

Existing questionnaires initially display 1/5 even before assessment. A separate **Not assessed** display was proposed during planning but is **not implemented or mandated by this documentation**. Do not introduce that product change as part of an unrelated issue addition; record the initial-state decision explicitly.

Keep issue risk, action priority and Deal Hub urgency distinct. Apply these priority meanings in the selected transaction perspective:

| Label | Meaning |
| --- | --- |
| Required | A necessary step under the recorded facts and selected perspective; not a statement that every such step is legally mandatory. |
| Recommended | A proportionate protection or practical next step. |
| Consider | An optional or negotiation-dependent response. |

Specify action triggers and Buyer / Seller / Balanced differences explicitly. Avoid duplicate or overlapping protections without a reason. There is no shared five-action limit; document any issue-specific cap and ensure it cannot silently hide a necessary action.

## Registry, Deal Hub and persistence

Follow the action icon contract in the root `AGENTS.md`. Register each action's stable ID, title, description, icon and phase in `dist/action-registry.js`; every rendered action carries `data-action-id`. Preserve `stableActionId` in Deal Hub. Reuse shared styling and the plain Deal Hub glyph.

Users select recommended **actions** for Deal Hub; answers accompany the issue as a snapshot. Preserve the existing select-all entry, individual deselection, selection count, cancel and confirm controls, disabled empty confirmation, duplicate prevention and saved-action feedback. Save issue context, answers, summary, risk and action side to the active deal. Preserve stale-snapshot indication and explicit refresh after answers change, without silently rewriting manually edited Hub actions.

Wire a new issue into navigation, rendering, completion, scoring, transaction-side updates, registry, Hub extraction, persistence and report export. Check explicit issue-ID lists and render events: copying visible markup alone is insufficient. Keep live UI, issue data, summaries and exports consistent. Treat generated data and optional authoring sources according to the current build workflow.

## Working sequence

Read this standard, inspect the closest current issue, fill out the linked template, then implement using the existing shared presentation. Validate the scenario checklist and relevant repository checks. Update the reference and this standard when an agreed pattern changes; do not leave superseded specifications alongside replacements.
