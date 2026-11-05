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
- All six issues initially display 1/5, labelled No risk. Share ownership reveals one additional question at a time as the preceding answer is recorded, including conditional follow-ups before continuing.
- Existing option and litigation answers can be substantially longer than the preferred short-label standard. Some questions have more than five substantive choices. Do not copy that verbosity into a new issue or shorten old labels without handling their dependent rules and saved values.
- Finance and litigation display at most nine recommendation cards through lossless consolidation of related steps; Option Holders retains all triggered steps within its nine-action catalogue. See the issue specifications for component identities and perspective wording.
- Buyer / Seller / Balanced affects action recommendations and priority. Do not infer the risk score from the selected side or action count.
- Hub extraction explicitly recognises the six current issue IDs, including Share ownership. New issues need deliberate integration. Hub captures an issue snapshot and stores selected actions separately; answer changes flag the snapshot as stale rather than automatically replacing saved actions.
- Legal-note text is existing product content, not newly verified legal guidance. Recheck authorities and applicability when authoring or changing substantive notes.

## Recording future scoring detail

The [Share Ownership and Transfer Restrictions draft](issues/share-ownership-and-transfer-restrictions.md) is a sixth issue under Shares. It implements the agreed facts questionnaire, component-based risk assessment, prose summary and up to three stable deal implications using Option Holders presentation. Its ten registered actions follow a perspective-specific matrix capped at eight recommendations, with selected-action saving to Deal Hub. Four short legal notes include linked authorities. Its specification records the scoring table, completion gate, action matrix, legal sources and worked outcomes.

Keep a completed risk decision table in the issue's maintained specification when introducing new substantive rules. Record ordered conditions, operations, floors, reductions and worked outcomes using the issue template. Link that specification here so the main authoring standard stays short. Preserve the executable rule as the implementation authority and investigate any disagreement between it and the specification.

## Employment questionnaire draft

[Key Employee Retention and Employment Terms](issues/key-employee-retention-and-employment-terms.md) adds the Employment area with six agreed questions, answers and tooltips, reusing Threatened Litigation presentation. This stage includes the questionnaire, prose summary and up to three stable key deal implications; employee risk scoring and up to nine action cards are implemented, with 12 registered actions, conditional protection wording and Deal Hub saving. Three approved Employment legal notes cover notice, post-termination restrictions and leaver terms, with primary-source links. See the specification for visibility and export behaviour.

Employment actions now use canonical perspective-specific wording in Apply deal logic, the catalogue, reports and Hub capture, retaining neutral contract/leaver checks where appropriate; Actions by Issue exposes all three side controls for every issue.

## Data Protection questionnaire draft

[Compliance Gaps and Personal Data Breaches](issues/compliance-gaps-and-personal-data-breaches.md) adds Data Protection using Threatened Litigation’s shared presentation. Six main questions and conditional Q3b include approved concise labels and tooltips. Q4 supports compatible multiple selections with exclusive None/Unknown. Questionnaire, persistence, reset, rules-based risk and visible-answer exports are implemented. Unknown answers are scoring-neutral, protected floors apply after adjustments, and only Fundamental impact reaches 5. Completed answers now produce a factual prose summary and up to three reusable deal implications across impact, completion readiness and residual exposure; exports use the same analysis. Thirteen registered actions use Buyer/Seller/Balanced wording and priorities, with at most nine recommendation cards through lossless consolidation; the full catalogue, reports and Hub capture share stable identities. Three approved legal notes cover breach notifications, evidence of remediation and continuing claims exposure, with primary-source links and matching completed-report exports.

Share Ownership actions now resolve canonical Buyer/Seller/Balanced wording and answer-specific variants across Apply deal logic, reports and Hub capture; ownership verification and transfer mechanics remain neutral, and the shared Actions by Issue toggles apply to its full ten-action catalogue.

[Debt Facilities](issues/debt-facilities-repayment.md) uses the shared registry for all 14 actions, with nine perspective-specific instructions and five neutral practical checks, up to nine consolidated recommendation cards, and matching reports and Hub component capture.

[Threatened Litigation](issues/threatened-litigation.md) uses eleven perspective-specific actions and three neutral factual reviews from the canonical registry. At most nine recommendation cards preserve all triggered components through five documented consolidation pairs; reports and Deal Hub capture use the selected perspective.

[Option Holders](issues/option-holders.md) uses seven perspective-specific actions and two neutral factual reviews from the canonical registry, with all triggered actions retained within the nine-card limit. Reports and Deal Hub capture share the selected instructions and existing priorities.

[Missing IP Assignment](issues/missing-ip-assignment.md) uses nine perspective-specific actions and two neutral reviews from the shared registry, preserving the existing six profiles and at most six live recommendations. Reports and Hub capture share the selected copy; incomplete upstream answers cannot trigger stale analysis.

[Change of Control](issues/customer-change-of-control.md) uses seven perspective-specific actions and two neutral checks from the canonical registry, preserving its eighteen matrix profiles and at most three live actions. Reports use current active-deal answers and the same selected wording as the UI and Hub capture.

Actions by Issue now places its perspective selector at the top right of the Action Library page header, at the same desktop coordinates as Deal Map. Both use `createTransactionSideControl`: one selected pill expands to Buyer/Seller/Balanced and collapses after selection, persisting the active deal's side. Core M&A toolkit hides the library control. The former inline topic controls are removed. Browser checks confirmed exact header alignment, catalogue wording updates, refresh persistence, keyboard expansion/Escape/focus and Core toolkit visibility; narrow screens reuse the existing Deal Map control flow.

[Termination Rights and Material Breaches](issues/termination-rights-and-material-breaches.md) is a second Material Contracts issue. Its current delivery contains only the five-question progressive questionnaire, agreed introduction and tooltips, using Change-of-Control presentation. Risk rules, analysis, actions and Hub integration remain deferred; reports export the current visible answers.
