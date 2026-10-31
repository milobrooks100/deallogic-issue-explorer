# Deal Map scenario checklist

Use with the [authoring standard](deal-map-authoring-standard.md). For each applicable scenario, record inputs, visible questions, expected score, completion state, summary, implications, actions and priority labels. Mark genuinely inapplicable cases with a reason. These are verification requirements for future issue work, not a claim that automated coverage already exists.

- [ ] **Untouched:** initial question and standby panel are correct; no unsupported conclusion or action appears.
- [ ] **Confirmed absent / not triggered:** questionnaire takes the appropriate early exit; output explains the recorded basis and excludes unrelated follow-ups and actions.
- [ ] **Unknown / not assessed:** uncertainty remains explicit and does not acquire the meaning of a confirmed negative.
- [ ] **Routine manageable case:** completed branch produces the documented score and proportionate actions.
- [ ] **Material or blocked case:** the serious condition imposes its documented floor or score; necessary actions remain visible after ordering and caps.
- [ ] **Remediated case:** verified cure lowers risk only as the issue rules permit; residual or non-financial risk is retained where applicable.
- [ ] **Every branch:** exercise conditional questions, alternative transaction routes, `Other` text and exclusive / compatible multiple selections.
- [ ] **Changed upstream answer:** obsolete dependent responses do not affect visibility, risk, summaries, actions, exports or saved issue context.
- [ ] **All three sides:** Buyer, Seller and Balanced produce their specified actions and labels; switching perspective does not duplicate stable actions.
- [ ] **Deal Hub selection:** entry selects available actions; individual deselection, count, cancel, empty selection and confirmation work. Only confirmed selected actions are added.
- [ ] **Deal Hub identity:** adding again does not duplicate an action. Stable IDs and registry icons survive display-copy changes; Hub glyphs remain plain.
- [ ] **Persistence:** refresh and switching between two deals preserve each deal's own answers and side. Account / browser storage continues through the existing storage layer.
- [ ] **Snapshots:** saved answers, risk and summary reflect capture time; later answer changes show the stale indication and refresh works. Existing manually edited actions remain intact.
- [ ] **Reports:** current questions, selected answers, conditional responses and risk agree with the UI; obsolete wording and irrelevant answers are absent.
- [ ] **Presentation:** shared layout, risk indicator, priority labels, icon colours, concise notes and tooltips remain readable in supported themes and at narrow widths; keyboard interaction works.

Run the relevant existing checks. Add meaningful decision-rule coverage when implementing substantive logic; do not add tests that merely repeat static documentation. Report any unverified scenario or existing limitation explicitly.
