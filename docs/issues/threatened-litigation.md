# Threatened Litigation: action perspectives

## Scope and existing questionnaire

Disputes / `threatened-litigation`, for the existing England and Wales M&A issue. The six approved concise questions and answers are canonical in `dist/index.html` and mirrored in `dist/issues.json`. Answer order, progressive reveal, risk rules, action instructions and priority modifiers remain unchanged. Exact historical labels migrate to the same answer positions, alongside earlier prefix migrations. Questions cover threat, stage/deadlines, merits, impact, recoveries and resolution; no new facts or transaction-type selector is introduced.

Untouched and incomplete relevant answers retain standby. No threat or a fully performed resolution produces no active actions; Not checked completes the gateway with a Required factual review. Hidden follow-up answers are excluded from early-exit summaries and reports. Summaries reflect the concise labels without assuming unrecorded facts. Unavailable or insufficient protection has a distinct deal implication from undecided recovery. Definitions remain in the information tooltips. The resolution question retains six choices to preserve all existing resolution states.

## Canonical action copy

`dist/action-registry.js` supplies the instruction, title, phase, icon and stable identity for the live recommendations, Actions by Issue, reports and Hub capture. `dist/issues.json` retains matching Balanced fallback instructions for compatibility consumers. The existing shared Buyer/Seller/Balanced buttons in Actions by Issue now resolve these variants; Apply deal logic retains its existing perspective selector.

Three factual reviews retain the same wording on every side:

- `conduct-dispute-diligence`: factual basis, procedural status, merits and exposure.
- `obtain-contentious-advice`: privileged advice on defences, remedies and settlement range.
- `confirm-insurance-and-recovery-rights`: available recoveries and required preservation steps.

Eleven actions have distinct Buyer, Seller and Balanced instructions:

| Stable ID | Buyer objective | Seller objective | Balanced objective |
| --- | --- | --- | --- |
| specific-litigation-disclosure | Require specific information while protecting privilege | Fair disclosure with factual summaries and safeguards | Agree specific disclosure and privilege safeguards |
| resolve-claim-before-completion | Evidence of effective resolution by completion | Complete agreed steps and secure releases | Agree and implement the binding resolution |
| litigation-resolution-condition-precedent | Objective conditions and clear buyer rights | Measurable milestones and restrained withdrawal rights | Objective conditions and proportionate rights |
| pre-completion-litigation-covenant | Consultation and consent over material decisions | Limit consent rights and retain urgent procedural flexibility | Agreed material-decision controls and procedural exceptions |
| litigation-warranty | Seek coverage of dispute position and undisclosed claims | Accurate qualified warranties with disclosure | Appropriately qualified warranties with specific disclosure |
| specific-litigation-indemnity | Specific recovery for identified losses | Defined scope, caps, periods, claims control and recoveries | Defined allocation and negotiated limits |
| litigation-ring-fencing-retention | Secure recovery with proportionate escrow or retention | Justified amounts, defined deductions and release timetable | Proportionate security with clear triggers |
| litigation-purchase-price-adjustment | Reduction for material exposure without duplication | Resist speculation and credit recoveries and other protection | Agreed adjustment for material exposure |
| litigation-closing-loss-reserve | Appropriate reserve or debt-like treatment | Agreed accounting basis and no duplicate deductions | Agreed accounts treatment without duplicate recovery |
| litigation-wi-insurance | Check exclusions before deciding seller protection | Explore related cover to reduce seller recourse | Check exclusions without assuming the known dispute is insured |
| specific-mae-mac-walk-right | Objective termination triggers for material developments | Resist broad rights and agree clear exclusions | Defined material triggers with thresholds and exclusions |

Every instruction is one sentence, at most 32 words. Existing per-answer Buyer/Balanced/Seller priority modifiers remain authoritative; Required is a transaction recommendation, not a declaration of universal legal necessity. Existing exclusions for minimal impact, unquantified exposure and confirmed recovery remain in force.

## Nine-card consolidation

The former family truncation and final slice are replaced by lossless consolidation. Generate all triggered components, including their existing maximum priority, then merge these pairs in order only while more than nine cards remain:

1. Factual review + specialist advice.
2. Specific disclosure + dispute warranties.
3. Resolution steps + completion condition.
4. Specific indemnity + escrow/retention.
5. Price adjustment + reserve/accounts treatment.

Five disjoint pairs reduce the full fourteen-action set to nine. A pair merges only when both components are active. Each card uses a concise sentence for the selected side, the highest constituent priority, and the first component's stable ID/icon; `data-constituent-ids` retains both identities. Ordering remains priority first and the existing action order second. Components are exposed through `DealLogicLitigationActions` for Hub capture.

Selecting a combined card saves its individual components with their own canonical instruction, priority and phase. Existing stable-ID duplicate prevention and manually edited saved actions are preserved. Pending selections refresh on perspective or answer changes, and incomplete answers clear unavailable picks. Saved snapshots remain explicit captures rather than silently rewritten advice.

## Reports and authority

Completed reports include the factual summary, implications, selected side and identical capped action cards with priorities. Incomplete reports retain standby. Gateway early exits omit hidden follow-up responses.

This is a negotiation-copy revision; existing limitation and disclosure notes remain unchanged. Privilege-sensitive copy was checked against the [SRA guidance on legal professional privilege](https://www.sra.org.uk/solicitors/guidance/professional-privilege-in-house/) on 1 November 2026: factual disclosure does not require unrestricted sharing of privileged advice, and any sharing arrangements require careful consideration. Contractual protections remain dependent on the SPA, insurance terms and recorded facts.

## Validation

- Twelve focused tests pass, including all 45,000 completed answer/perspective permutations: at most nine cards, complete constituent coverage, highest priority, stable identities, concise sentences, canonical variants and invalid-side fallback.
- Live markup and report parity verified for all three perspectives, including incomplete and hidden-answer cases.
- Combined Seller Hub capture preserves component priorities, phases and existing edited actions.
- Browser checks confirmed the fourteen-action library, all three toggle controls, Seller-specific catalogue wording and matching nine-card Seller live analysis.
- Runtime validation and diff whitespace checks pass. Full suite: 140 pass; one existing unrelated `core-action-colours.test.mjs` failure expects obsolete positional CSS.

## Concise-answer validation

All 45,000 completed answer/perspective combinations were compared against the previous version: identical recommended action objects and risk scores. Every previous answer migrates to its original position; regression coverage checks preserved risk and recommendations and distinguishes unavailable protection from pending recovery.
