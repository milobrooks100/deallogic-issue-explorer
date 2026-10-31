# Existing Deal Map areas: implementation reference

Baseline inspected on 31 October 2026. This reference maps current behaviour and exceptions; the [authoring standard](deal-map-authoring-standard.md) defines preferred future authoring. It does not change existing content or score formulas. Read executable rules for exact combinations, evaluation order and wording before modifying an established issue.

## Source map

| Concern | Current source |
| --- | --- |
| Area/category navigation, shared shell, risk labels, four tailored issue flows | `dist/index.html` |
| Finance questionnaire, visibility, score and action rules | `dist/debt-facilities.js` |
| Prepared issue records, metadata and Finance legal notes | `dist/issues.json` |
| Stable action identity, icons, titles and phases | `dist/action-registry.js` |
| Hub selection, duplicate prevention, snapshots and stale detection | `dist/deal-hub.js` |
| Shared icon palette and presentation | `dist/workflow-colours.css`, `dist/workspace-redesign.js`, shared theme styles |
| Additional action guidance | `dist/action-playbooks.js` |
| Issue-data preparation | `scripts/build.mjs` (optional sibling `data/` authoring tree; prepared-data fallback) |

Some issue-record questions differ from the tailored UI questions. Do not assume that reading `issues.json` alone describes what users see. Keep all active representations consistent when changing them. Follow the maintained root `AGENTS.md` action icon contract.

## Five issue patterns

| Area / stable issue ID | Questions and controls | Risk behaviour to inspect | Notes |
| --- | --- | --- | --- |
| Material Contracts / `customer-change-of-control` | Five main questions; conditional consent-reasonableness question; dropdowns, 1–3 importance slider and consent-factor checkboxes with conditional Other text | Absence or no trigger returns 1. Recorded provision begins at 2; confirmed or unclear trigger sets 3. Consent, high importance and adverse consent factors add points, capped at 5. | Two: Triggers; Reasonableness |
| Intellectual Property / `missing-ip-assignment` | Six progressively revealed single-select questions: gap, evidence, importance, replacement, owner relationship, claim | No gap or sufficient ownership evidence returns 1. Unresolved gap starts at 3, adjusted for importance, replacement difficulty, cooperation and claims, bounded 2–5. | Two: Contractor vs Employee Ownership; Deeds are Advisable |
| Shares / `option-holders` | Six questions; award treatment permits compatible multiple selections; undecided treatment is exclusive | Confirmed absence returns 1; not checked returns 2. Records, implementation, dilution and tax issues impose floors; a material award position that cannot be implemented can reach 5. | Two: Exit Mechanics; Tax and Payroll |
| Disputes / `threatened-litigation` | Six progressively revealed questions: threat, stage, merits, impact, recovery, resolution | Stage, merits and impact establish floors. Confirmed recoveries can reduce financial risk subject to non-financial floors. Fundamental impact can reach 5; fully performed resolution returns 1. | Three: Limitation periods; Fair disclosure; Privilege protection |
| Finance / `debt-facilities-repayment` | Seven possible questions; repayment-only, consent-only and combined routes show different subsets | Confirmed absence returns 1; not checked returns 2. Unclear requirements normally produce 3; payoff, releases and uncertainty can raise to 4; funding shortfall, refusal or blocked sequencing can produce 5. Fully ready confirmed obligations can reduce to 2. | Two: Transaction triggers; Register updates |

## Exceptions and boundaries

- All five use the standby message and the completed Summary → Key deal implications → Recommended actions → Notes structure. Their readiness gates differ. Finance requires all currently visible answers; Change of Control does not require every consent-outlook detail before producing output. Consult each renderer's completion condition rather than assuming a universal gate.
- The original five issues initially display 1/5, labelled No risk. The Share ownership issue instead uses Not assessed and provisional results; its issue specification records that distinction.
- Existing option and litigation answers can be substantially longer than the preferred short-label standard. Some questions have more than five substantive choices. Do not copy that verbosity into a new issue or shorten old labels without handling their dependent rules and saved values.
- Finance currently caps displayed actions at ten; litigation caps at nine and limits overlapping action families. These are issue-specific implementation details, not shared limits.
- Buyer / Seller / Balanced affects action recommendations and priority. Do not infer the risk score from the selected side or action count.
- Hub extraction currently explicitly recognises the five issue IDs. New issues need deliberate integration. Hub captures an issue snapshot and stores selected actions separately; answer changes flag the snapshot as stale rather than automatically replacing saved actions.
- Legal-note text is existing product content, not newly verified legal guidance. Recheck authorities and applicability when authoring or changing substantive notes.

## Recording future scoring detail

The [Share ownership and transfer restrictions draft](issues/share-ownership-and-transfer-restrictions.md) is a sixth issue under Shares. It implements the agreed facts questionnaire and component-based risk assessment using Option Holders presentation; substantive deal logic remains deferred. Its specification records the scoring table and worked outcomes.

Keep a completed risk decision table in the issue's maintained specification when introducing new substantive rules. Record ordered conditions, operations, floors, reductions and worked outcomes using the issue template. Link that specification here so the main authoring standard stays short. Preserve the executable rule as the implementation authority and investigate any disagreement between it and the specification.
