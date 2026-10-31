# Share ownership and transfer restrictions

## Current scope

Questionnaire and risk assessment under Shares, using Option Holders as the presentation template. The original Option Holders issue remains unchanged. The agreed title, introduction, questionnaire, tooltips and risk rules are implemented; completion outputs, actions and legal notes remain deferred. Apply deal logic retains the standby presentation even after answers are entered.

## Canonical content and visibility

`dist/issues.json` owns the title, introduction and question wording. `dist/share-ownership.js` owns stable answer values, visible labels, tooltips and conditional visibility. The four main questions are always visible; there is no confirmed-absence early exit from ownership or participation.

| Question ID | Visibility | Answer values, in order |
| --- | --- | --- |
| `share-ownership-verified` | Always | `verified`, `evidence-gaps`, `disputed`, `unchecked` |
| `share-seller-participation` | Always | `all-agreed`, `some-undecided`, `some-refusing`, `unchecked` |
| `share-transfer-restrictions` | Always | `yes`, `no`, `partly-unclear`, `unchecked` |
| `share-restrictions-addressed` (3a) | Restrictions = `yes` or `partly-unclear` | `all-addressed`, `some-outstanding`, `not-addressed`, `unclear` |
| `share-security-exists` | Always | `yes`, `no`, `unclear`, `unchecked` |
| `share-security-release` (4b) | Security = `yes` | `release-agreed`, `discussions-ongoing`, `release-refused`, `unclear` |

Each question uses single selection, with an empty-value Unanswered placeholder. Follow-up answers are deleted when their visibility condition stops applying; returning to the branch requires a fresh answer. There are four substantive choices per question and no free-text inputs. Labels and tooltips reproduce the agreed questionnaire.

## Risk assessment

`assessRisk` in `dist/share-ownership.js` calculates four component floors and takes their maximum. Risk changes are recomputed from current answers rather than accumulated.

| Component | Answer → floor |
| --- | --- |
| Ownership | Verified → 1; Evidence gaps / Unchecked / unanswered → 2; Disputed → 4 |
| Participation | All agreed → 1; Some undecided → 3; Some refusing → 4; Unchecked / unanswered → 2 |
| Restrictions | No → 1; Unchecked / unanswered → 2; Partly / unclear → 3 regardless of follow-up; Yes + All addressed → 1; Yes + any other or unanswered follow-up → 3 |
| Security | No → 1; Unchecked / unanswered → 2; Unclear → 3; Yes + Release agreed → 2; Yes + Discussions ongoing / Unclear / unanswered → 3; Yes + Release refused → 5 |

If at least three components reach 3 or above, increase the result by one only when it is below 4. This caps combination escalation at 4 and never reduces a 5. Conservatively count seller refusal plus unresolved restrictions as one obstacle because the form does not establish their independence. Parent/follow-up pairs always form one component.

No active answers produces **Not assessed**, with no active risk segments or pointer. Any unanswered, Unchecked or unclear active response marks the result **Provisional**; unanswered main questions have a floor of 2. Explicit unchecked or uncertain answers still receive the documented numeric floor. Ignore hidden responses entirely. The existing numeric `riskScore()` interface uses 1 as its internal rendering fallback for Not assessed; the displayed assessment and exported report use the nullable assessment directly.

Worked outcomes: all verified / agreed / unrestricted / unsecured → 1; evidence gaps only → 2; undecided sellers only → 3; undecided sellers + outstanding restrictions + release discussions → 4; disputed ownership → 4; refused security release → 5. Changing a refused release to agreed reduces its component from 5 to 2, but an ownership dispute still holds the overall result at 4.

## Persistence and integration

Use the existing issue/deal-scoped storage adapter. New stable issue and answer IDs isolate responses from Option Holders. Reports translate stable values to current display labels, include only visible questions, and report the same assessment and provisional state as the UI. No new actions or registry entries exist at this stage, so there is no action-selection or Deal Hub recommendation integration yet. Existing issues delegate to their unchanged renderers and export handlers.

## Verification scenarios

- Untouched: four main questions, no follow-ups, all Unanswered, Not assessed risk, standby logic.
- Restrictions Yes / Partly: show 3a; No / Unchecked / Unanswered: hide and clear 3a.
- Security Yes: show 4b; No / Unclear / Unchecked / Unanswered: hide and clear 4b.
- Parent answer changes do not clear unrelated main or still-applicable follow-up responses.
- Reload / issue switching / deal switching preserve independent responses; reports contain current labels, not storage IDs.
- Completed questionnaire still shows standby; no Option Holders recommendations or notes appear in this issue.
- Original Option Holders and the five existing issue flows remain unchanged.

Before adding deal logic, specify perspective-specific actions and legal notes using the main authoring template. Do not reuse the Option Holders scoring formula. Risk rules have automated floor, reduction and all-permutation coverage in `tests/share-ownership-risk.test.mjs`.
