# Share ownership and transfer restrictions

This is a share-sale issue in the existing Shares area. Defective allotments are outside its questions, risk rules and actions. Option Holders retains its own questionnaire and nine-action playbook.

## Existing patterns inspected

Before implementation, reviewed the questionnaires, risk overrides, summaries, side-specific priorities and action selection in all five completed issues: Change of Control (9 actions), Missing IP Assignment (11), Option Holders (9), Threatened Litigation (14), and Debt Facilities (14). Reused the established facts/logic layout, three priority labels, side picker, project storage adapter, action registry, Hub selection, saved snapshots, status editing and Action Library deep links.

The existing registry is the source of action identity, title, default description, icon and phase. The new questionnaire uses the same stable IDs in Map, Library and Hub. Side-specific instructions resolve back to the same action, preventing duplicates when a user changes perspective or adds from the Library. Hub phases now preserve explicit registry metadata rather than guessing from drafting words.

## Five questions

1. Register of members against the sellers and sale shares.
2. Certificates and supporting ownership evidence.
3. Beneficial interests, signing arrangements, share security and adverse claims.
4. Requirements actually engaged under the articles or shareholder agreement.
5. Readiness of the identified evidence and transfer steps for completion.

Questions 3 and 4 allow overlapping factual arrangements. “None” and “not checked” are exclusive choices. Changing the first four answers clears the previous readiness answer. All five responses are required to show the tailored logic; “not checked” is a meaningful response and produces diligence recommendations.

## Risk and prose

| Position | Score |
| --- | --- |
| Evidence agrees; required steps effective or documented for completion | 1 |
| Unassessed position, or isolated missing certificates with otherwise consistent evidence | 2 |
| Other evidence gaps, expressly unchecked requirements, or outstanding authority/release/transfer steps | 3 |
| Conflicting register or supporting ownership documents | 4 |
| Adverse ownership claim/disputed authority, or a blocked required completion step | 5 |

Higher-severity facts always prevail. A readiness answer cannot cure a title conflict. Missing documents alone never establish invalid ownership. An isolated certificate gap does not trigger a title-conflict indemnity or an independent completion condition.

The summary describes each answered dimension in sentences, lists overlapping arrangements and rights, and qualifies apparent readiness where evidence remains unresolved. Where certificates are missing alongside a title conflict, it expressly separates the two. Key implications are limited to three, prioritising title resolution and blocked completion steps.

## Twelve actions and executable rules

`lib/issues/share-ownership-transfer-restrictions.json` contains the authored definition and decision rules. The build upserts it into `dist/issues.json` with or without the optional external authoring directory. `dist/share-ownership.js` derives facts once, evaluates the structured rules, applies perspective priorities, merges by stable ID, and assembles the risk, prose and actions. It does not enumerate answer permutations or truncate away required actions.

The twelve-action catalogue covers title reconciliation, certificate loss evidence, title conflict resolution, seller authority, release of share security, consents and waivers, tag/drag/adherence mechanics, warranties, disclosure, transfer and registration mechanics, completion conditions/longstop, and an indemnity for identified title exposure. The last two protections change priority and wording by perspective. Known required transfer steps remain necessary on every side. Documented ready steps remain visible as recommended evidence-delivery actions.

Icons reuse the application's document, search, wrench, handshake, lock, drafting, shield, disclosure, calendar, completion and money vocabulary. Soft colours reuse the existing action palette and remain stable by action ID across Map, Library and Hub. Priority text supplies the meaning independently of colour.

## England and Wales grounding

Primary sources checked on 29 October 2026:

- [Companies Act 2006, Part 8](https://www.legislation.gov.uk/ukpga/2006/46/part/8): membership, the register, rectification and separate treatment of trusts. Section 127's historic central-register election qualification is preserved; ordinary public filings and PSC information are not substitutes for title evidence.
- [Section 544](https://www.legislation.gov.uk/ukpga/2006/46/section/544): transfers are governed by the company's articles, subject to the statutory framework.
- [Sections 768–771](https://www.legislation.gov.uk/ukpga/2006/46/part/21/chapter/1): evidential effect of certificates and transfer registration formalities.
- [Private company model articles 23–28](https://www.gov.uk/government/publications/model-articles-for-private-companies-limited-by-shares/model-articles-for-private-companies-limited-by-shares): certificate replacement, board registration powers and transmission. The issue expressly requires the company's actual documents; model articles are not presumed to apply.
- [HMRC stock transfer guidance](https://www.gov.uk/guidance/stamp-duty-on-shares): coordinate applicable Stamp Duty formalities with the registration route.

SPA recommendations are transaction responses to those principles, rather than statements that every protection is legally mandatory. The issue distinguishes contractual completion from registration, requires waiver by the correct right holder, and does not confuse transfer pre-emption with allotment pre-emption.

## Verification

`npm run build` and `npm run check`: 66 tests pass, including 17 focused share-ownership tests. These cover the five-question/twelve-action limits, missing evidence versus conflict, adverse claims, priority differences, readiness changes, executable rules, stable IDs, export contents, delegated existing flows, and over 22,000 profile/perspective assessments with overlapping interests and restrictions.

Browser checks in an isolated local test deal covered certificate-only low risk, conflicting records, multiple simultaneous arrangements, automatic readiness reset, seller wording, saving actions, correct completion phases, reloading saved answers, duplicate prevention across perspectives, and refreshing the Hub summary/risk snapshot. The Library exposes all twelve actions and uses the shared add/deduplication route.

21st search was unavailable in this environment. Reused the installed project patterns. Local 21st review reported informational hardcoded-colour notices only; these colours intentionally match the existing action palette.
