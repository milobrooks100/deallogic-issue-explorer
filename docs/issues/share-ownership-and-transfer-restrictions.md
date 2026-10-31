# Share ownership and transfer restrictions

## Current scope

Facts-only draft under Shares, using Option Holders as the presentation template. The original Option Holders issue remains unchanged. The agreed title, introduction, questionnaire and information tooltips are implemented; tailored scoring, completion outputs, actions and legal notes are deferred. Apply deal logic retains the Option Holders standby presentation even after answers are entered. The existing initial risk display is retained and is not an assessment of these new answers.

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

## Persistence and integration

Use the existing issue/deal-scoped storage adapter. New stable issue and answer IDs isolate responses from Option Holders. Reports translate stable values to current display labels and include only visible questions. No new actions or registry entries exist at this stage, so there is no action-selection or Deal Hub recommendation integration yet. Existing issues delegate to their unchanged renderers and export handlers.

## Verification scenarios

- Untouched: four main questions, no follow-ups, all Unanswered, standby logic.
- Restrictions Yes / Partly: show 3a; No / Unchecked / Unanswered: hide and clear 3a.
- Security Yes: show 4b; No / Unclear / Unchecked / Unanswered: hide and clear 4b.
- Parent answer changes do not clear unrelated main or still-applicable follow-up responses.
- Reload / issue switching / deal switching preserve independent responses; reports contain current labels, not storage IDs.
- Completed questionnaire still shows standby; no Option Holders recommendations or notes appear in this issue.
- Original Option Holders and the five existing issue flows remain unchanged.

Before extending the draft, complete the risk decision table, perspective-specific actions and legal notes using the main authoring template. Do not reuse the Option Holders scoring formula.
