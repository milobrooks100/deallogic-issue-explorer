# Data Protection action matrix

Status: implemented, 1 November 2026; connected to Apply Deal Lens, Actions by Issue, Deal Hub and report recommendations. Issue: `compliance-gaps-and-personal-data-breaches`. Applies to the existing questionnaire, with no question or risk-score changes.

## Approach

Use 13 stable action IDs with rules based on the recorded facts, not a separate action list for each permutation or a score-only threshold. Each action has a short title and one-sentence instruction, with perspective-specific wording. Required means necessary for the selected deal approach under the recorded facts; it does not mean that every contractual protection is legally compulsory. Recommended is proportionate protection; Consider is optional or negotiation-dependent.

Incomplete questionnaires retain standby with no generated recommendations. Q1 No produces no issue-specific actions and the message “No issue-specific actions are indicated by the recorded answer.” General transaction diligence and warranties sit outside that focused early exit. Unknown is never a confirmed breach, a notification obligation or a reason by itself to demand an indemnity.

## Consolidated catalogue and baseline priorities

These are the Balanced instructions; the next table supplies the actual Buyer and Seller instructions. Priorities apply only when the action is triggered and are modified by the escalation rules below.

| ID / short title | One-sentence Balanced instruction | Buyer | Seller | Balanced | Icon / phase |
| --- | --- | --- | --- | --- | --- |
| DP01 Targeted diligence | Confirm the issue’s scope, affected data and legal position, using specialist advice where needed. | Recommended | Recommended | Recommended | search / Due diligence |
| DP02 Containment and remediation | Agree and implement a proportionate plan to contain any ongoing harm and remedy confirmed gaps or breaches. | Recommended | Recommended | Recommended | wrench / Due diligence |
| DP03 Breach notifications | Check the notification assessment and ensure any required notices are made promptly with reasons recorded for any delay. | Recommended | Recommended | Recommended | circle-arrow-right / Due diligence |
| DP04 Verify remediation | Verify the completed remedial work against supporting evidence and resolve any conflicting answers. | Required | Recommended | Recommended | circle-check / Due diligence |
| DP05 Complaints and claims response | Confirm the response to complaints, claims and regulatory enquiries and agree responsibility for any remaining steps. | Required | Required | Required | calendar-check / Due diligence |
| DP06 Costs and recoveries | Quantify likely costs and liabilities and check available insurance or third-party recoveries. | Recommended | Recommended | Recommended | search / Due diligence |
| DP07 Specific disclosure | Record the issue, response and remaining exposure in specific disclosures while protecting personal data and privilege. | Recommended | Required | Required | file-search / SPA drafting |
| DP08 Data protection warranties | Agree proportionate warranties on compliance, incident records and regulatory correspondence, subject to specific disclosure. | Required | Consider | Recommended | shield-check / SPA drafting |
| DP09 Remediation and conduct covenants | Document outstanding response duties, milestones, reporting and cost allocation in the sale agreement. | Recommended | Recommended | Recommended | file-pen-line / SPA drafting |
| DP10 Completion condition | Agree objective completion conditions for material unresolved issues, with a longstop date and clear termination rights. | Required | Consider | Recommended | circle-check / Closing condition |
| DP11 Specific indemnity and security | Agree a targeted indemnity for identified losses, with suitable limits and security where justified. | Recommended | Consider | Recommended | banknote / SPA drafting |
| DP12 Price treatment | Reflect material exposure in the price or completion accounts without duplicating other recoveries. | Recommended | Recommended | Recommended | arrow-down-up / SPA drafting |
| DP13 Reassess the transaction | Reassess whether the deal can proceed on acceptable terms or should be restructured or abandoned. | Required | Required | Required | arrow-left-right / Signing |

DP03 remains a Due diligence action because assessment and notification cannot be deferred automatically to signing or completion. The phase is a workflow category, not a legal deadline.

## Perspective-specific instructions

| ID | Buyer instruction | Seller instruction |
| --- | --- | --- |
| DP01 | Investigate the issue’s scope, affected data and legal position, using specialist advice where needed. | Assemble the issue records and obtain advice on unresolved facts before presenting the position to the buyer. |
| DP02 | Require a proportionate plan to contain any ongoing harm and remedy confirmed gaps or breaches. | Procure prompt containment and proportionate remedial work for confirmed gaps or breaches. |
| DP03 | Obtain the notification assessment and evidence that the responsible party has made any required notices promptly. | Procure prompt notification by the responsible party where required and document the assessment and any delay. |
| DP04 | Obtain evidence that the remedial work is complete and resolve any conflicting answers before relying on it. | Assemble evidence of completed remedial work and correct any inconsistent records. |
| DP05 | Review complaints, claims and regulatory enquiries and require a plan for any outstanding response or obligations. | Confirm complaints, claims and regulatory enquiries are properly handled and meet any remaining obligations or deadlines. |
| DP06 | Quantify likely exposure and confirm available insurance or third-party recoveries before agreeing the price. | Substantiate likely costs and preserve available insurance or third-party recoveries to support the proposed price. |
| DP07 | Require specific disclosure of the issue, response and remaining exposure without unnecessary personal data or privileged advice. | Make fair, specific disclosure of the issue and response while protecting personal data and privilege. |
| DP08 | Seek tailored warranties on compliance, incident records and regulatory correspondence without relying on them to cover disclosed issues. | Limit data protection warranties to an accurate, appropriately qualified position supported by specific disclosure. |
| DP09 | Require enforceable response and remediation duties with milestones, reporting and clear allocation of continuing costs. | Limit response and remediation covenants to defined tasks, deadlines and costs within the seller’s control. |
| DP10 | Make completion conditional on objective milestones for material unresolved issues, with a longstop date and termination rights. | Limit any completion condition to material, measurable steps within the seller’s control and resist open-ended buyer discretion. |
| DP11 | Seek a specific indemnity for identified losses, backed by escrow or retention where justified. | Resist a broad indemnity and, if agreed, limit covered losses, duration and any escrow or retention. |
| DP12 | Seek a price adjustment for material exposure not already addressed through agreed protections or recoveries. | Resist duplicate price reductions and ensure agreed protections and recoveries are reflected in the valuation. |
| DP13 | Reassess the price, structure and ability to proceed, including walking away if the issue undermines the acquisition. | Assess whether remediation, revised terms or a different structure can preserve the sale before ending the sale process. |

Conditional DP03 wording: for `some-outstanding` or `none-made`, use the instruction above; for `unknown`, use Buyer “Obtain an urgent notification assessment and ensure the responsible party makes any required notices without waiting for completion”, Seller “Procure an urgent notification assessment and any required notices without waiting for completion”, Balanced “Arrange an urgent notification assessment and ensure any required notices are made without waiting for completion”; for `all-made` or `none-required`, use Buyer “Verify the notification record or the documented basis for concluding that no notifications were required”, Seller “Retain evidence of notifications or the documented basis for concluding that none were required”, Balanced “Verify the notification record or the documented basis for concluding that no notifications were required”. Each remains one sentence.

## Exact selection and priority rules

First normalize through the existing `visibleIds`, `valid` and `normalize` rules, and require `complete`. Read only reachable answers. All rules below assume Q1 is not No. Use stable answer IDs and values from `dist/data-protection.js`.

Derived facts:

- `uncertain`: Q1 Suspected/Unknown, or any reachable later answer Unknown, including Q4 exclusive Unknown.
- `material`: Q5 Significant or Fundamental; `fundamental`: Q5 Fundamental.
- `external`: Q4 includes Complaints, Claims or Regulatory enquiries; `formal`: Q4 includes Claims or Regulatory enquiries.
- `ongoing`: Q3 Yes or Partly.
- `notificationOpen`: visible Q3b Some outstanding or None made; hidden Q3b is never open or unknown.
- `notificationUnknown`: visible Q3b Unknown.
- `workPlanned`: Q6 Yes, Partly or No; `carryOver`: Q6 Partly or No.
- `conflict`: Q6 Already completed and (`ongoing` or `notificationOpen`).
- `readinessOpen`: `ongoing` or `notificationOpen` or Q6 not Already completed; this includes uncertainty but not external matters alone.
- `evidencedIssue`: Q1 Yes or `external`; the existence of a complaint, claim or enquiry is evidence of a reported matter, not proof of an infringement or liability.

| ID | Exact trigger | Priority changes from baseline |
| --- | --- | --- |
| DP01 | `uncertain` or `material` or `external` or `ongoing` or `notificationOpen` or Q6 not Already completed | Required on all sides when `uncertain`, `material` or `formal`; otherwise baseline. |
| DP02 | `ongoing` or Q6 not Already completed | Required on all sides when `ongoing`; otherwise Recommended, including a provisional plan subject to findings where the issue or work is uncertain. |
| DP03 | Q3b is visible | Required on all sides for `notificationOpen` or `notificationUnknown`; otherwise baseline with evidence-check wording. |
| DP04 | Q6 Already completed | Required on all sides for `conflict`; otherwise baseline. |
| DP05 | `external` | Baseline; one combined action even when all three external options are selected. |
| DP06 | `material` or Q5 Unknown or `external` or Q2 Personal data breach/Both/Unknown or Q6 not Already completed | Required on all sides for `material`, Q5 Unknown or `formal`; otherwise baseline, except Seller/Balanced Consider when Q5 Minimal and Q6 Already completed and no `external`. |
| DP07 | Every completed non-No route | Baseline; disclose uncertainty as uncertainty, not as an established infringement. |
| DP08 | Every completed non-No route | Baseline; covers the agreed factual/compliance position and unknown defects, not a substitute for protection against the disclosed issue. |
| DP09 | `ongoing` or `notificationOpen` or `workPlanned` or `external` | Buyer/Balanced Required when `ongoing`, `notificationOpen` or `carryOver`; Seller Required when `carryOver`; otherwise baseline. |
| DP10 | `material` and `readinessOpen` | Baseline for Significant; for Fundamental, Seller Recommended and Balanced Required, with Buyer remaining Required. |
| DP11 | `evidencedIssue` and (`material` or `formal`) | Buyer Required for `material`; Balanced Consider where Q5 Minimal and not `material`; otherwise baseline, including Seller Consider. |
| DP12 | `material` | Buyer/Balanced Required for Fundamental; otherwise baseline. |
| DP13 | `fundamental` | Baseline. |

For DP11 when Q1 is Suspected/Unknown, the indemnity instruction is exploratory: Buyer “Assess whether the reported matter justifies a specific indemnity and any supporting escrow or retention”, Seller “Assess any proposed indemnity against the evidence and limit its scope and supporting security”, Balanced “Assess whether the reported matter justifies a targeted indemnity with suitable limits and any justified security”; use Recommended / Consider / Consider respectively until the issue is confirmed. A reported claim or regulatory enquiry with uncertain merits also requires the indemnity to define the matter and losses rather than assume liability.

No automatic escrow: DP11 proposes security only where justified after checking exposure, duration and the seller’s ability to pay. Those facts are not established by this questionnaire. No automatic settlement: DP05 does not imply all complaints or proceedings must be resolved as a condition of completion. No automatic regulator clearance: DP10 uses objectively defined steps and does not assume that a regulator will issue a clean bill of health.

## Mapping every question to the actions

| Question | How each answer changes the action selection |
| --- | --- |
| Q1 Existence | No exits; Yes supports confirmed-issue analysis; Suspected/Unknown makes diligence Required and keeps protective drafting proportionate to evidence. |
| Q2 Type | Gap/Breach/Both selects the scope of diligence and remediation; Breach/Both/Unknown adds a costs/recoveries review; never infer a notifiable incident from the type alone. |
| Q3 Ongoing | Yes/Partly makes containment Required and activates response covenants; No removes the active-containment reason; Unknown makes diligence Required without assuming that harmful processing continues. |
| Q3b Notifications | Outstanding/None made makes notification follow-up Required; Unknown makes urgent assessment Required; All made/None required selects evidence verification; hidden answers have no effect. |
| Q4 External matters | Any combination selects one response action; Claims/Regulatory enquiries also makes diligence and exposure assessment Required and opens consideration of a specific indemnity; None removes these triggers; Unknown goes to diligence, not an invented claim. |
| Q5 Impact | Minimal limits discretionary financial protections; Manageable keeps the response proportionate; Significant introduces material deal protections; Fundamental also requires viability review; Unknown requires quantification and does not alone trigger a price cut, indemnity or completion condition. |
| Q6 Remediation | Already completed selects verification; Yes selects delivery planning and covenants; Partly/No also requires allocation of continuing work and strengthens material completion protections; Unknown selects investigation and provisional planning without treating the work as done. |

## Ordering, consolidation and limits

Sort Required, Recommended, Consider, then DP01–DP13 within a priority. DP03 carries a prompt-response instruction regardless of display order. Emit each ID once and recompute when facts or perspective change. The catalogue has 13 actions; completed responses show at most nine recommendation cards. When more than nine actions trigger, merge DP01+DP06, then DP02+DP04, then DP07+DP08, then DP10+DP13, stopping as soon as nine remain. Each combined card uses one concise perspective-specific sentence, preserves both component IDs and takes the higher priority; no triggered component is dropped. Deal Hub saves the underlying registered steps separately, using the established Employment pattern, so selection and duplicate prevention continue to work against the full catalogue. Exports use the same capped cards and perspective copy as the live recommendations.

Consolidated overlaps: specialist advice sits within DP01; policies, supplier terms, retention and security fixes within DP02; assessment, notices and notification evidence within DP03; complaints, claims and enquiries within DP05; insurance and other recoveries within DP06; pre- and post-completion duties within DP09; longstop/termination mechanics within DP10; indemnity and supporting escrow/retention within DP11; price reductions and completion-account treatment within DP12. DP02 is the operational work plan, DP09 its contractual allocation, and DP10 the separate decision whether completion must await a milestone.

Prevent double recovery across DP06, DP11 and DP12. Do not imply that a payment or indemnity cures unlawful processing or limits a regulator’s or individual’s rights. Do not suggest that fines are automatically indemnifiable or insurable; the actual losses and any public-policy restrictions need specific advice. Ordinary W&I cover is not assumed to cover a known incident.

## Worked scenarios

Each scenario assumes a completed reachable route; adverse hidden answers are ignored. B/S/Bal means Buyer/Seller/Balanced.

| Scenario / answers | Expected actions / notable priorities |
| --- | --- |
| Untouched or missing relevant answer | Standby; no generated actions. |
| Q1 No, any stale later answers | No issue-specific actions. |
| Every reachable answer Unknown | DP01 Required, DP02 Recommended, DP03 Required, DP06 Required, DP07 Recommended/Required/Required, DP08 Required/Consider/Recommended; no automatic DP10–DP13. |
| Yes; Compliance gap; No; notifications hidden; None; Minimal; Already completed | DP04 Required/Recommended/Recommended, DP07 Recommended/Required/Required, DP08 Required/Consider/Recommended. |
| Yes; Personal data breach; No; All made; None; Manageable; Yes | DP01, DP02, DP03, DP06, DP07, DP08, DP09; no automatic condition, indemnity or price cut. |
| Yes; Both; Yes; None made; Complaints+Claims+Regulatory enquiries; Significant; No | DP01, DP02, DP03, DP05, DP06, DP07, DP08, DP09, DP10, DP11, DP12; consolidated to at most nine cards without duplicate external-response actions. |
| Same serious case, but Already completed | DP04 added; DP02 remains because the issue is ongoing; DP04 Required on all sides; material protections are not erased by the inconsistent cure answer. |
| Yes; Breach; No; All made; Claims; Significant; Already completed | DP01, DP03, DP04, DP05, DP06, DP07, DP08, DP09, DP11, DP12; no automatic completion condition solely because a claim exists. |
| Yes; Gap; No; notifications hidden; None; Fundamental; Already completed | DP01, DP04, DP06, DP07, DP08, DP11, DP12, DP13; no readiness condition without an outstanding readiness issue, but viability and historical exposure remain material. |
| Suspected; Both; Unknown; Unknown; Complaints; Significant; Unknown | Diligence/quantification and notification assessment Required; assess any indemnity on the evidence with Recommended/Consider/Consider labels; do not assert confirmed liability. |

## Research and drafting basis

Checked 1 November 2026 for the existing England-and-Wales/UK-target scope. Legal duties below are distinct from proposed transaction-negotiation rules; no authority mandates this catalogue or its Buyer/Seller/Balanced labels.

1. **Containment, testing and accountability:** UK GDPR Articles 5(2), 24 and 32 support evidence-led remediation and verification; Article 32 includes evaluating the effectiveness of security measures. Sources: [UK GDPR, current text](https://www.legislation.gov.uk/eur/2016/679/body/data.htm), [ICO breach-response guidance](https://ico.org.uk/for-organisations/advice-for-small-organisations/personal-data-breaches/72-hours-how-to-respond-to-a-personal-data-breach). Supports DP01, DP02 and DP04; does not turn every gap into a cyber incident.
2. **Notification thresholds and timing:** Article 33 distinguishes controller reporting from processor-to-controller notification and requires breach records; Article 34 uses a high-risk threshold for communication to individuals, subject to exceptions. A controller’s report is due without undue delay and, where feasible, within 72 hours of awareness unless the breach is unlikely to risk individuals’ rights and freedoms; processor notice is without undue delay. Missing information can be supplemented in phases; do not wait for completion. Source: [ICO personal data breach guide](https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/personal-data-breaches-a-guide/). Supports DP03 and related covenants, not unconditional reporting of every compliance gap.
3. **Complaints:** Current regulator guidance requires a complaints route, acknowledgement within 30 days, appropriate enquiries, updates and an outcome without undue delay. Source: [ICO complaints guidance](https://ico.org.uk/for-organisations/how-to-deal-with-data-protection-complaints/). Supports DP05; the questionnaire does not establish the date a particular deadline expires.
4. **Continuing liability:** Article 82 addresses material and non-material damage; DPA 2018 section 168 includes distress. Articles 58 and 83 provide regulatory powers and penalties. Remediation and the fact that processing has stopped do not establish that all historical consequences have ended. Sources: [UK GDPR](https://www.legislation.gov.uk/eur/2016/679/body/data.htm), [DPA 2018, section 168](https://www.legislation.gov.uk/ukpga/2018/12/section/168), [ICO fining guidance publication](https://www.gov.uk/government/publications/data-protection-fining). Supports assessing residual exposure rather than automatic indemnification of a fine.
5. **M&A protections:** Osborne Clarke’s account of its M&A practice identifies remediation, tailored warranties, indemnities and deal economics as responses to data risks. Lewis Silkin distinguishes fair disclosure and protection against known issues in UK deals. Sources: [Osborne Clarke, data privacy risks in acquisitions](https://www.osborneclarke.com/insights/buying-company-uk-or-eu-how-buyers-and-investors-can-protect-themselves-against-data), [Lewis Silkin, UK M&A disclosure](https://www.lewissilkin.com/insights/2024/04/04/usuk-m-a-disclosure). Supports the choice of tools in DP07–DP13; the triggers, labels, security tests, covenant limits and condition design are drafting judgments, not statutory requirements or statements that the counterparty must accept them.
6. **Insurance:** An insurer’s own UK transactional-risk guidance explains the separate review of existing business insurance, including cyber cover, alongside W&I diligence. Source: [WTW, insurance and transactional due diligence](https://www.wtwco.com/en-gb/insights/2024/05/transactional-risk-mitigation-tools-warranty-and-indemnity-and-due-diligence). Supports checking actual policies, notification and consent terms in DP06; no particular cover, recovery or fine insurability is assumed.
7. **Transaction structure:** The regulator’s data-sharing code requires attention to transfers to another/additional controller, purposes, lawful basis and transparency in M&A. Source: [ICO data-sharing code, M&A section](https://ico.org.uk/media/for-organisations/guide-to-data-protection/ico-codes-of-practice/data-sharing-a-code-of-practice-1-0.pdf). In a share acquisition assess exposure in the target; in an asset deal tailor assumed/excluded liabilities and continuing processing separately, without implying a private allocation removes statutory duties. Data-transfer planning remains outside this questionnaire.
8. **Current-law check:** Reviewed the DUAA commencement materials and current complaints guidance, rather than relying only on pre-2025 commentary. [Government commencement update, 12 October 2026](https://www.gov.uk/guidance/data-use-and-access-act-2025-plans-for-commencement) records the regulator’s institutional transition effective 30 September 2026; drafted actions use “regulator” and do not depend on its institutional name. This research does not change the existing questionnaire labels.

## Runtime integration

DP01–DP13 are registered with canonical Balanced, Buyer and Seller copy in `dist/action-registry.js`. `chooseActions` in `dist/data-protection.js` applies the rules and conditional wording, then consolidates only if needed to meet the nine-card cap. Apply Deal Lens and reports use this same function; Actions by Issue shows all 13 canonical entries with the shared perspective selector. Catalogue additions are deliberate manual selections, labelled Consider by the existing Hub workflow, rather than questionnaire-based recommendations.

The Hub recognizes the Data Protection render event and action rows, preserves component IDs and their individual priorities when saving combined cards, clears obsolete selections after answer changes, and refreshes pending selections after a side change. It uses canonical registry phases and existing snapshot/persistence/duplicate-prevention behavior, preserving manually edited saved actions. The standard scenario checklist applies; legal notes remain a separate authoring stage.

## Validation

A standalone authoring check evaluated these action rules against the existing questionnaire’s 72,000 Cartesian answer combinations, normalized to their reachable branches, across all three perspectives (216,000 evaluations). It verified that every catalogue action is reachable, no ID is duplicated, labels stay within the three allowed priorities, No and incomplete routes produce no actions, hidden notifications do not affect recommendations, active containment and outstanding notifications remain Required, and Fundamental impact always produces the viability review. The raw rule set can contain 13 components, including contradictory reported-completion scenarios. Runtime tests additionally evaluate all 216,000 cases to verify at most nine cards, exact component coverage, preserved priorities and one-sentence instructions of at most 32 words. Focused checks cover side/notification wording, live/report parity, registry identity and saving combined cards without overwriting edited actions. Browser checks cover the 13-entry catalogue and its side selector, severe-case recommendations, selection/cancel/disabled-empty behavior, Hub capture and duplicate prevention. These checks do not establish the adequacy of protections for facts the questionnaire does not capture.
