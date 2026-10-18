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
python3 -m http.server 4173 --directory dist
```

## Data storage

Project data is currently stored in the browser's local storage. It is not yet synchronised to a user account or server, so clearing browser storage will remove locally saved projects.

## Status

Prototype content only. The application is not legal advice and its outputs must be reviewed and tailored for each transaction and jurisdiction.
