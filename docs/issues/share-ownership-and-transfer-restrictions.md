# Share Ownership and Transfer Restrictions

## Current scope

Questionnaire and risk assessment under Shares, using Option Holders as the presentation template. The original Option Holders issue remains unchanged. The title, introduction, questionnaire, tooltips, risk rules, prose summary, key deal implications and perspective-specific recommended actions are implemented. Four legal notes with linked sources are included at the user’s request. Apply Deal Lens stays in standby until every applicable question has a valid answer, including conditional follow-ups.

## Canonical content and visibility

`dist/issues.json` owns the title, introduction and question wording. `dist/share-ownership.js` owns stable answer values, visible labels, tooltips and conditional visibility. Only the ownership question is initially visible. Each answer reveals the next applicable question, with conditional follow-ups completed before continuing; there is no confirmed-absence early exit from ownership or participation.

| Question ID | Visibility | Answer values, in order |
| --- | --- | --- |
| `share-ownership-verified` | Always | `verified`, `evidence-gaps`, `disputed`, `unchecked` |
| `share-seller-participation` | Ownership answered | `all-agreed`, `some-undecided`, `some-refusing`, `unchecked` |
| `share-transfer-restrictions` | Participation answered | `yes`, `no`, `partly-unclear`, `unchecked` |
| `share-restrictions-addressed` (3a) | Restrictions = `yes` or `partly-unclear` | `all-addressed`, `some-outstanding`, `not-addressed`, `unclear` |
| `share-security-exists` | Restrictions answered and any applicable 3a answered | `yes`, `no`, `unclear`, `unchecked` |
| `share-security-release` (4b) | Security = `yes` | `release-agreed`, `discussions-ongoing`, `release-refused`, `unclear` |

Each question uses single selection, with an empty-value Unanswered placeholder. Responses are deleted when they become unreachable, including later main questions after an earlier answer is cleared; returning to the branch requires a fresh answer. There are four substantive choices per question and no free-text inputs. Labels and tooltips reproduce the agreed questionnaire.

## Risk assessment

`assessRisk` in `dist/share-ownership.js` calculates four component floors and takes their maximum. Risk changes are recomputed from current answers rather than accumulated.

| Component | Answer → floor |
| --- | --- |
| Ownership | Verified → 1; Evidence gaps / Unchecked / unanswered → 2; Disputed → 4 |
| Participation | All agreed → 1; Some undecided → 3; Some refusing → 4; Unchecked / unanswered → 2 |
| Restrictions | No → 1; Unchecked / unanswered → 2; Partly / unclear → 3 regardless of follow-up; Yes + All addressed → 1; Yes + any other or unanswered follow-up → 3 |
| Security | No → 1; Unchecked / unanswered → 2; Unclear → 3; Yes + Release agreed → 2; Yes + Discussions ongoing / Unclear / unanswered → 3; Yes + Release refused → 5 |

If at least three components reach 3 or above, increase the result by one only when it is below 4. This caps combination escalation at 4 and never reduces a 5. Conservatively count seller refusal plus unresolved restrictions as one obstacle because the form does not establish their independence. Parent/follow-up pairs always form one component.

No active answers produces **1/5 · No risk**, with the first segment and pointer active. The badge and export contain only the score and risk level, without an assessment-status suffix. After answering begins, unanswered main questions retain their floor of 2; explicitly uncertain answers retain their documented floors. Ignore all unreachable responses, including values saved beyond an unanswered earlier question.

Worked outcomes: all verified / agreed / unrestricted / unsecured → 1; evidence gaps only → 2; undecided sellers only → 3; undecided sellers + outstanding restrictions + release discussions → 4; disputed ownership → 4; refused security release → 5. Changing a refused release to agreed reduces its component from 5 to 2, but an ownership dispute still holds the overall result at 4.

## Summary and key deal implications

`buildAnalysis` in `dist/share-ownership.js` returns no analysis until every reachable question is answered. Unchecked and unclear are valid recorded answers and generate explicit uncertainty rather than positive assumptions. The summary composes four short sentences: ownership, shareholder participation, transfer restrictions with their resolution status, and security with its release status. It uses stable answer values, ignores hidden responses and never describes agreed releases as completed or seller agreement as a binding commitment.

Key deal implications use a small set of stable consequence statements, with one point per theme and no more than three points:

1. Ownership: a dispute may obstruct delivery; evidence gaps or unchecked ownership require the title evidence to be established. Verified ownership adds no adverse implication.
2. Acquisition route: seller refusal and any outstanding transfer requirements share one point; undecided or unchecked participation uses a confirmation point. If sellers have all agreed but transfer restrictions remain unresolved or uncertain, use the transfer-clearance point instead.
3. Security: refused release is a potential completion blocker; ongoing or unclear release arrangements remain a completion dependency; agreed releases must take effect with transfer. Unknown or unchecked security requires investigation.

If none of these themes has an open issue or an outstanding release step, show one qualified point: no ownership or transfer obstacle is currently indicated by the recorded answers. Do not imply that no further transaction documentation is needed.

Worked examples:

- Disputed ownership + refusing sellers + unresolved restrictions + refused security release: the summary describes all four facts; three implications cover ownership, the acquisition route (including restrictions), and the release blocker.
- Verified ownership + all sellers agreed + restrictions addressed + release agreed: the summary records the clearances and future release; one implication links effective release to completion.
- Unclear restrictions + all addressed: retain uncertainty about the scope despite the recorded clearance. Unchecked ownership or security is described as unreviewed.
- Incomplete or cleared earlier answer: revert to the standby message and remove old summary and implications; never retain analysis based on unreachable responses.

## Recommended action matrix

Canonical titles, descriptions, icons and phases live in `dist/action-registry.js` under stable IDs SO01–SO10. `chooseActions` applies the reviewed matrix; `actionsFor` resolves registry content and concise answer-specific instructions. No actions are generated before the questionnaire is complete.

| ID | Action / toolkit symbol | Trigger | Buyer / Seller / Balanced |
| --- | --- | --- | --- |
| SO01 | Verify share ownership / Further diligence | Ownership not verified | Required / Required / Required |
| SO01 | As above | Verified | Recommended / Consider / Recommended |
| SO02 | Rectify title defects / Rectification | Evidence gaps or disputed ownership | Required / Required / Required |
| SO03 | Secure seller participation / Third-party consent | Undecided, refusing or unchecked participation | Required / Required / Required |
| SO04 | Obtain transfer consents and waivers / Third-party consent | Known restrictions not all addressed | Required / Required / Required |
| SO04 | As above | Restrictions partly unclear or unchecked | Required / Recommended / Required |
| SO05 | Release security over the shares / Rectification | Security exists; release not agreed | Required / Required / Required |
| SO05 | As above | Release agreed | Recommended / Recommended / Recommended |
| SO06 | Title and capacity warranties / Warranty | Every completed assessment | Required / Recommended / Recommended |
| SO07 | Specific disclosure / Specific disclosure | Ownership gaps/dispute, known/possible restrictions or known security | Recommended / Required / Recommended |
| SO08 | Specific title indemnity and security / Specific indemnity | Disputed ownership | Recommended / Consider / Recommended |
| SO08 | As above | Evidence gaps | Consider / Consider / Consider |
| SO09 | Completion conditions and longstop / Condition precedent | High or very high risk from unresolved matters | Required / Recommended / Recommended |
| SO09 | As above | Medium risk from unresolved matters | Recommended / Consider / Recommended |
| SO10 | Share transfer completion mechanics / Completion mechanic | Every completed assessment | Required / Required / Required |

Omit actions where no trigger applies. Sort Required before Recommended before Consider; within a label use SO01, SO02, SO03, SO04, SO05, SO09, SO10, SO07, SO06, SO08. This puts completion dependencies before additional contractual and financial protections. Keep the first eight: exhaustive checks ensure that the matrix never generates more than eight Required items and none is omitted by the cap. All ten remain available in Actions by Issue.

Instructions distinguish title evidence gaps from disputes, shareholder refusal from unconfirmed participation, identifying unknown clearances from obtaining known consents, and implementing an agreed release from negotiating one. Evidence gaps alone only suggest considering an indemnity, without assuming a substantive title defect.

For the fully adverse example, Buyer receives SO01–SO06, SO09 and SO10; Seller and Balanced receive SO01–SO05, SO07, SO09 and SO10. A clear assessment receives SO01, SO06 and SO10. Reports include the same selected perspective and displayed action recommendations as the UI.

## Legal notes

Four notes appear after Recommended actions, using the existing `.logic-note` treatment: a bold lead-in, two concise sentences and an underlined source link opening in a separate tab. Four notes, rather than the usual two or three, are explicitly requested for this issue. The registration-timing draft was excluded.

- **Ownership evidence:** Companies Act 2006, section 127; register evidence is prima facie rather than conclusive.
- **Missing certificates:** [private company Model Article 25](https://www.legislation.gov.uk/uksi/2008/3229/schedule/1/paragraph/25/data.html); check the actual articles and agree replacement or lost-certificate arrangements.
- **Transfer pre-emption:** Companies Act 2006, section 561; distinguish statutory allotment rights from separate transfer restrictions.
- **Drag-along amendments:** [Arbuthnott v Bonnyman [2015] EWCA Civ 536](https://caselaw.nationalarchives.gov.uk/ewca/civ/2015/536), paragraphs 66 and 98–100; the amendments facilitated an existing compulsory transfer arrangement, rather than simply creating a new drag right.

Sources were verified against the legislation, model articles and judgment on 31 October 2026 during drafting. Note text and source URLs are maintained together in `legalNotes` in `dist/share-ownership.js`. Completed reports reproduce all four notes and their source URLs. Notes remain hidden while the questionnaire is incomplete.

## Persistence and integration

Use the existing issue/deal-scoped storage adapter. New stable issue and answer IDs isolate responses from Option Holders. Reports translate stable values to current display labels, include only visible questions, and report the same score and risk level as the UI. Completed reports also include the same summary and implications; incomplete reports omit those sections. All ten actions are registered in Actions by Issue; up to eight relevant actions can be selected and saved to Deal Hub. Stable IDs link the registry icons across the views, and saved selections capture the current perspective, priority, phase, summary, risk and answers. Rerendering updates still-selected candidates to the current perspective and removes selections that no longer apply; it does not rewrite existing Hub actions. Duplicate prevention is shared with Action Library additions. Existing issues delegate to their unchanged renderers and export handlers.

## Verification scenarios

- Untouched: ownership question only, Unanswered, 1/5 No risk, standby logic.
- Restrictions Yes / Partly: show 3a; No / Unchecked / Unanswered: hide and clear 3a.
- Security Yes: show 4b; No / Unclear / Unchecked / Unanswered: hide and clear 4b.
- Parent answer changes do not clear unrelated main or still-applicable follow-up responses.
- Reload / issue switching / deal switching preserve independent responses; reports contain current labels, not storage IDs.
- A completed questionnaire shows the prose summary and at most three implications; no Option Holders recommendations or notes appear in this issue.
- Original Option Holders and the five existing issue flows remain unchanged.

Keep legal authorities current when amending the notes. Do not reuse the Option Holders scoring formula. Risk rules have automated floor, reduction and all-permutation coverage in `tests/share-ownership-risk.test.mjs`.

Analysis completion, truthful uncertainty, stable implication families, rendering transitions and all 15,625 raw answer permutations are covered in `tests/share-ownership-analysis.test.mjs`.

The action matrix, registry symbols, all three perspectives and the eight-item cap are covered across all 15,625 raw permutations in `tests/share-ownership-actions.test.mjs`.

## Perspective-specific action wording

Reviewed 1 November 2026. Eight actions (SO02–SO09) now carry Buyer and Seller instructions alongside the Balanced instruction in `dist/action-registry.js`; SO01 ownership verification and SO10 completion mechanics retain common factual wording. Buyer copy seeks evidence, protections and objective conditions; Seller copy focuses on delivering the agreed shares, making fair disclosure and limiting negotiated warranties, indemnities and conditions to the appropriate exposure. Balanced copy describes the agreed allocation and practical steps. These are transaction drafting perspectives, not changes to legal duties.

The answer-specific instructions for title disputes versus evidence gaps (SO02), unconfirmed participation (SO03), uncertain clearances (SO04), agreed releases (SO05) and possible indemnities for evidence gaps (SO08) also follow the selected perspective. No wording assumes that an evidence gap proves defective ownership, that a drag-along route is available, or that an agreed release has already taken effect.

`actionsFor` resolves the registry instruction with the shared `forSide` helper before applying any answer-specific instruction. Apply Deal Lens, downloaded reports and saved Hub recommendations therefore use the same perspective and conditional wording. Actions by Issue already exposes the shared visible Buyer/Seller/Balanced toggles for every topic, including Share Ownership; its ten catalogue entries and manual additions resolve the selected registry wording. Existing Hub items retain their saved text and manual edits when the side changes. Stable IDs, icons, phases, triggers, priorities, risk rules and the existing eight-item cap are unchanged.

Twenty-seven focused Share Ownership tests pass, including all 15,625 raw answer combinations across three perspectives (46,875 action evaluations), preserved Required actions, one-sentence instructions of at most 32 words, neutral exceptions, conditional copy and live/report parity. Shared catalogue tests exercise all three controls on every topic. Browser checks verify Seller catalogue wording, the adverse-case live recommendations and capture of a conditional Seller instruction in Deal Hub. Full suite: 132 pass; the existing unrelated core action-colour assertion still fails.
