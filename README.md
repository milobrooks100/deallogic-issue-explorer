# DealLogic Issue Explorer

DealLogic is a prototype M&A issue-analysis workspace. It combines a structured Deal Map with rule-based deal logic, recommended actions, and a project-specific Deal Hub.

## Current checkpoint

This repository captures the `v0.2-project-workspaces` version, including:

- project-specific Deal Map answers and transaction-side settings;
- a Deal Hub with summary, task-board, table, and project-settings views;
- recommended-action selection and custom action items; and
- a structural project sidebar for switching between saved deal workspaces.

## Local development

The application is a buildless static site. Its deployable files are in `dist/`.

```sh
npm run build
npm run check
python3 -m http.server 4173 --directory dist
```

## Data storage

Project data is currently stored in the browser's local storage. It is not yet synchronised to a user account or server, so clearing browser storage will remove locally saved projects.

Browser persistence is accessed through `dist/app-storage.js`. That small adapter preserves the current local-storage behaviour while providing a single boundary for a future signed-in account or backend synchronisation layer.

## Company Radar

Company Radar is a project-specific dashboard of public Companies House register data. Users can add several entities to a deal, review rule-based attention flags, open the original register pages, download available PDFs on demand, and add a finding to Deal Hub. Company selections are stored in this browser with the rest of the project. Register data is fetched when the section is opened or refreshed.

The Vercel `api/` functions provide same-origin search, company summary and document-download routes. Register for a live Companies House API key and set `COMPANIES_HOUSE_API_KEY` in the Vercel project's environment variables for Preview and Production, then redeploy. Never add the key to `dist/` or commit a filled-in `.env` file. Local development can use `vercel dev` with the same environment variable; a plain static file server cannot run these functions.

The document route verifies that the document belongs to the selected company and limits in-app PDFs to 12 MB. The public Companies House link remains available for larger or unavailable files. The API routes are public because the prototype has no user authentication; before high-volume public use, add shared rate limiting or host-level abuse protection and monitor Companies House quota and function bandwidth. The app does not store downloaded documents.

## Runtime structure

- `dist/index.html` contains the core issue explorer and the two completed issue-specific logic flows.
- `dist/deal-logic-templates.js` contains the shared provisional renderer for Shares, Disputes and Finance.
- `dist/deal-hub-v8.js` owns Deal Hub state and interaction.
- `dist/workspace-redesign.js` is presentation-only decoration for navigation, icons and workspace summaries.
- `dist/issues.json` is generated from the structured issue files by `npm run build`.

## Status

Prototype content only. The application is not legal advice and its outputs must be reviewed and tailored for each transaction and jurisdiction.
