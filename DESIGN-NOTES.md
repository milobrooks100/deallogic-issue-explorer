# DealLogic v0.4 — Workspace redesign preview

This branch applies the Nusa Bay dashboard's calm visual language to the existing DealLogic app. It keeps the legal copy, issue data, rule engine, project storage, transaction sides, action selection, exports, custom actions and task statuses.

## Direction and examples

- Reference: https://nusa-bay-host.netlify.app/dashboard — floating white navigation, warm grey canvas, softly rounded panels, deep green active states and restrained pastel surfaces.
- 21st Sidebar: https://mcp.21st.dev/%40shadcn/components/sidebar — grouped navigation, visible active location and a consistent workspace area.
- 21st App Dashboard Layout: https://21st.dev/%40hello_a52e1bda/components/app-1 — readable overview cards and stable sidebar/content layout.
- 21st Card Tabs: https://preview.21st.dev/%40uiable/components/card-tabs — compact switching between summary, board, table and project settings.

The 21st CLI search required authentication. Public catalog examples were reviewed as inspiration; no third-party component source was copied or claimed to be installed. The existing app uses plain HTML and JavaScript, so the patterns were implemented in that stack.

UI/UX Pro Max informed hierarchy, contrast, responsive layout, focus and form guidance. Its generic legal marketing-page recommendation was not appropriate for this workspace. Emil Kowalski's guidance informed quiet, brief feedback, interruptible transitions and reduced-motion handling.

## System

- Warm grey canvas `#f0f1ee`, white panels, ink `#293a35`, muted text `#64706b`.
- 224px desktop navigation; 28px content gutter; 24px primary panel radius.
- System sans-serif typography, restrained weights and short readable lines.
- Blue priority badges retain Required / Recommended / Consider semantics.
- Decorative SVG icons, clear text labels, visible keyboard focus and native form controls.
- Colour changes at 150ms; press feedback at 120ms; no entrance animation delaying repeated work.
- Desktop sidebar becomes a top navigation and project selector on tablet/mobile.
- Dashboard counts come from the active project's real saved data.

## Implementation

`dist/workspace-redesign.css` provides the visual system. `dist/workspace-redesign.js` decorates existing views with navigation, context, icons and overview counts. The issue engine and `dist/issues.json` are preserved. The build can use committed issue data when the optional authoring folder is absent, allowing standalone preview deployments.

This remains a branch preview for visual review before merging into main.
