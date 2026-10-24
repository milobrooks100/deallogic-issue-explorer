# Development guidance

## Keep small UI changes efficient

- Keep each request narrowly scoped to one UI outcome. State the exact screen, component, behaviour, and acceptance criteria.
- Start a fresh chat for an unrelated change when that avoids carrying a long conversation history. In an existing chat, keep follow-ups only when they depend on the same files and context.
- Use a fast/light model for straightforward styling, copy, spacing, or single-component changes. Use a stronger model only when the change spans architecture, debugging, legal-domain logic, or multiple interacting files.
- Give the agent the smallest useful context: name the relevant files and ask it to inspect only those files. Do not paste or reload the whole repository for a small change.
- Ask for a minimal patch. Avoid broad refactors, formatting unrelated files, generated output, and dependency changes unless explicitly required.
- Prefer targeted checks for the files or behaviour changed. Run the full test/build suite when the change affects shared code, build configuration, or generated assets.
- Review the diff before committing. Keep commits small and descriptive so later chats can work from the commit or pull request instead of re-establishing the entire history.
- When a change is uncertain, ask the agent to explain its proposed edit briefly before implementation; once the scope is clear, let it proceed without repeating the full project background.
