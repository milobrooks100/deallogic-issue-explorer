# DealLogic source maintenance

## Deal Map authoring

Before adding or changing a Deal Map area or issue, read `docs/deal-map-authoring-standard.md`. Use its linked issue template and scenario checklist; consult the existing-area reference for issue-specific scoring and exceptions. Reuse the shared presentation and integrations, and write substantive logic for the new issue rather than copying another issue's scoring. Keep these documents current when the agreed pattern changes.

For every DealLogic app change, update the current source in place. Delete superseded answers, prose, data and code instead of leaving old versions alongside replacements. Git history retains earlier iterations.

When questionnaire wording changes, update every dependent summary, risk rule, recommended action, export and saved-answer path. Keep one canonical list of current answer labels and make logic refer to stable positions or identifiers, rather than copies of the labels. Retain compatibility code only when it is needed to migrate existing user data, and keep that code narrowly scoped. Search the working tree for obsolete wording and run the relevant checks before committing.

## Action icon contract

`dist/action-registry.js` is the source of truth for every registered action's stable ID and icon. Choose its icon from `coreActionIcons`; do not put emoji, Unicode placeholders, or separate icon choices in Deal Map action data. Every Apply deal logic action must carry the matching `data-action-id` so the presentation layer can resolve the registry entry even when its display title differs.

Core M&A, Actions by Issue, and Apply deal logic share one icon colour palette in `dist/workflow-colours.css`. Deal Hub uses the same registry icon as a plain, uncoloured glyph without an enclosing square. Keep `stableActionId` when saving a registered action to Deal Hub so existing saved actions continue to resolve after copy changes. When adding or changing actions, check the icon and colour in all three views and keep the Deal Hub glyph plain.
