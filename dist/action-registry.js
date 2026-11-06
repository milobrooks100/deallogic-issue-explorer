(() => {
  const topics = [
    {
      id: "customer-change-of-control",
      label: "Change of Control",
      shortLabel: "Change of Control",
      actions: [
        ["coc-trigger-review", "Confirm whether the provision is triggered", "Review the clause, transaction structure and relevant exceptions to establish whether notification, consent or another step is required.", "search", "Due diligence"],
        ["coc-serve-notice", "Serve the contractual notice", "Deliver the required change-of-control notice in accordance with the contract’s timing and formalities.", "circle-arrow-right", "Post-completion"],
        ["coc-agree-communication", "Agree the counterparty communication", "Agree the counterparty communication, timing and responsibility before approaching the counterparty about the transaction.", "handshake", "Signing", {"Buyer": "Seek approval of material counterparty communications and coordinate the consent request with the transaction timetable.", "Seller": "Agree practical counterparty communications and timing, retaining control of the commercial relationship while providing the buyer with appropriate updates."}],
        ["coc-seek-consent-covenant", "Covenant to seek consent", "Agree responsibility, cooperation and proportionate endeavours to obtain consent, with clear limits on costs and concessions.", "file-pen-line", "SPA drafting", {"Buyer": "Seek an enforceable obligation to pursue consent, with progress reporting and buyer approval of material concessions.", "Seller": "Limit consent obligations to achievable endeavours, with buyer cooperation and express limits on costs, concessions and any obligation to secure consent."}],
        ["coc-warranty-disclosure", "Change-of-control warranty and disclosure", "Agree an appropriately qualified warranty on the provision, trigger and consent position, supported by specific disclosure.", "shield-check", "SPA drafting", {"Buyer": "Seek warranties covering relevant provisions, transaction triggers and outstanding consents, supported by specific disclosure.", "Seller": "Give accurate, appropriately qualified warranties and make fair, specific disclosure of relevant provisions, triggers and outstanding consents."}],
        ["coc-specific-indemnity", "Specific indemnity", "Agree a specific indemnity for defined losses from termination or other triggered consequences, with clear limits and no double recovery.", "banknote", "SPA drafting", {"Buyer": "Seek a specific indemnity for identified losses from termination or other triggered consequences, with suitable claim periods and recovery support where justified.", "Seller": "Limit any indemnity to defined change-of-control losses, with agreed caps, claim periods, mitigation and credit for recoveries."}],
        ["coc-consent-cp", "Consent condition precedent", "Agree objective completion conditions for material outstanding consents, with clear waiver rights and an agreed deadline.", "circle-check", "Closing condition", {"Buyer": "Seek an objective completion condition for material outstanding consents, with clear buyer waiver and termination rights.", "Seller": "Resist unnecessary consent conditions and limit any agreed condition to material, specified consents with objective criteria and an agreed deadline."}],
        ["coc-longstop-rights", "Longstop and termination rights", "Agree a longstop and proportionate termination or renegotiation rights if consent remains unavailable or the provision threatens contract continuity.", "arrow-left-right", "SPA drafting", {"Buyer": "Seek a longstop and clear termination or renegotiation rights where missing consent or triggered termination rights threaten contract continuity.", "Seller": "Limit termination rights to material unresolved consent or continuity risks, with a realistic longstop and scope to agree a workable solution."}],
        ["coc-tailored-response", "Tailored contractual response", "Review the recorded consequence against the contract and agree responsibility, timing and proportionate transaction protection.", "ellipsis", "SPA drafting", {"Buyer": "Review the recorded consequence and seek the steps and contractual protection needed to preserve contract continuity and value.", "Seller": "Review the recorded consequence and propose workable steps with clearly limited seller obligations and proportionate transaction protection."}]
      ]
    },
    {
      id: "missing-ip-assignment",
      label: "Missing IP Assignment",
      shortLabel: "Missing IP",
      actions: [
        ["R01", "Confirmatory deed of assignment", "Agree a valid assignment from the IP owner by completion, using a deed where appropriate and a completion condition for critical IP.", "wrench", "Closing condition", {"Buyer": "Require a valid assignment from the IP owner by completion, using a deed where appropriate and a completion condition for critical IP.", "Seller": "Arrange a valid assignment by completion, agreeing any completion condition for critical IP and using a deed where appropriate."}],
        ["R02", "Chain-of-title diligence", "Review creator status, engagement terms, assignments, licences, waivers and registry records to establish the target’s ownership or usage rights.", "search", "Due diligence"],
        ["R03", "Secure the IP owner’s cooperation", "Agree an approach to the IP owner and proportionate assignment terms, including any justified consideration or execution fee.", "handshake", "Due diligence", {"Buyer": "Agree the approach to the IP owner and seek effective assignment terms, with any payment justified against the title risk.", "Seller": "Approach the IP owner early and negotiate workable assignment terms, keeping any consideration or execution fee proportionate."}],
        ["R04", "Specific IP indemnity and security", "Agree a specific indemnity for identified ownership or infringement losses, with defined limits and proportionate escrow or retention where recovery needs support.", "banknote", "SPA drafting", {"Buyer": "Seek a specific indemnity for identified ownership or infringement losses, supported by escrow or retention where recovery needs protection.", "Seller": "Limit any IP indemnity to identified ownership or infringement exposure, with agreed caps, claim periods and proportionate security, avoiding double recovery."}],
        ["R05", "Specific disclosure", "Agree specific disclosure of missing assignments, incomplete records and known title gaps against the relevant IP warranties.", "file-search", "SPA drafting", {"Buyer": "Require specific disclosure of missing assignments, incomplete records and known title gaps before assessing the adequacy of the IP warranties.", "Seller": "Make fair, specific disclosure of missing assignments, incomplete records and known title gaps against the relevant IP warranties."}],
        ["R06", "IP title warranties and capped indemnity", "Agree appropriately qualified IP title warranties and any capped indemnity for unknown ownership defects, with clear scope and no double recovery.", "shield-check", "SPA drafting", {"Buyer": "Seek IP title warranties and an appropriate capped indemnity for unknown ownership defects, with clear scope and no double recovery.", "Seller": "Qualify IP title warranties by appropriate disclosures and limit any indemnity for unknown defects by scope, cap and claim period."}],
        ["R07", "Replacement or clean-room rewrite", "Assess the cost, timing and legal feasibility of replacing the affected IP through an independent rewrite or redesign.", "wrench", "Due diligence"],
        ["R08", "Settlement and transfer condition precedent", "Agree objective completion conditions requiring settlement, appropriate releases and valid transfer of the disputed IP, with a clear deadline.", "circle-check", "Closing condition", {"Buyer": "Make completion conditional on effective settlement, appropriate releases and valid transfer of the disputed IP, with clear waiver and termination rights.", "Seller": "Agree measurable settlement, release and transfer conditions, with a realistic deadline and proportionate termination rights, resisting discretionary buyer withdrawal."}],
        ["R09", "Purchase-price adjustment", "Agree any price adjustment for substantiated title risk or claim exposure, allowing for remediation costs and avoiding duplicate protection.", "arrow-down-up", "SPA drafting", {"Buyer": "Seek a price adjustment for substantiated title risk, claim exposure or remediation costs, without duplicating other agreed protections.", "Seller": "Resist speculative IP discounts and limit any price adjustment to substantiated exposure or remediation costs, allowing for other agreed protections."}],
        ["R10", "Alternative transaction structure", "Assess alternative transaction structures and retained liabilities, recognising that a different structure cannot itself cure missing IP ownership.", "ellipsis", "Signing", {"Buyer": "Assess whether another structure limits assumed liabilities while securing the IP rights needed to operate the business.", "Seller": "Propose a workable structure that allocates retained liabilities and delivers the necessary IP rights without assuming a structure change cures the title gap."}],
        ["R11", "Walk away or renegotiate", "Reassess the transaction terms and ability to proceed where unresolved ownership risk materially affects business value or operations.", "arrow-left-right", "Signing", {"Buyer": "Renegotiate terms or consider withdrawing where unresolved IP ownership risk undermines value or operations, checking available contractual rights.", "Seller": "Propose a credible cure, revised timetable or proportionate commercial terms to preserve the transaction where ownership risk materially affects value."}]
      ]
    },
    {
      id: "option-holders",
      label: "Option Holders",
      shortLabel: "Option Holders",
      actions: [
        ["OH01", "Reconcile awards and the cap table", "Reconcile award registers, historic exercises and cancellations against the fully diluted cap table.", "search", "Due diligence"],
        ["OH03", "Agree an award treatment schedule", "Agree an award-by-award treatment schedule consistent with the governing terms, identifying holder entitlements, responsibilities and completion steps.", "calendar-check", "Signing", {"Buyer": "Require an award-by-award schedule confirming the agreed treatment, holder entitlements and steps needed to deliver the agreed capital structure.", "Seller": "Prepare an award-by-award treatment schedule within the governing terms, with clear holder entitlements, responsibilities and achievable completion steps."}],
        ["OH04", "Obtain corporate approvals and documents", "Secure or verify the required corporate approvals and implementation documents for the agreed award treatment.", "calendar-check", "Signing", {"Buyer": "Require evidence of valid corporate approvals and completed implementation documents for the agreed award treatment.", "Seller": "Arrange any outstanding corporate approvals and implementation documents, and provide evidence of those already secured."}],
        ["OH05", "Obtain holder consents and releases", "Obtain any holder consents, elections, releases and powers of attorney required to implement the agreed treatment.", "handshake", "Signing", {"Buyer": "Require evidence of all holder consents, elections, releases and powers of attorney needed to implement the agreed treatment.", "Seller": "Arrange the necessary holder consents, elections, releases and powers of attorney in time for completion, avoiding requirements beyond the agreed treatment."}],
        ["OH06", "Prepare the final closing cap table", "Agree the final completion cap table reflecting the award treatment and reconcile it with share transfers and proceeds allocation.", "calendar-check", "Closing condition", {"Buyer": "Require a verified completion cap table reflecting the award treatment, reconciled with share transfers and proceeds allocation.", "Seller": "Deliver the final completion cap table and reconcile the agreed award treatment with share transfers and proceeds allocation."}],
        ["OH07", "Obtain share-scheme tax and payroll advice", "Confirm the tax, withholding, payroll and reporting consequences of the proposed treatment.", "search", "Due diligence"],
        ["OH08", "Award implementation condition precedent", "Agree objective completion conditions for material award implementation steps and delivery of the final cap table, with a clear deadline.", "circle-check", "Closing condition", {"Buyer": "Make material award implementation steps and delivery of the final cap table objective completion conditions, with clear buyer waiver and termination rights.", "Seller": "Limit award-related completion conditions to material unresolved steps, with objective satisfaction criteria, an agreed deadline and proportionate termination rights."}],
        ["OH10", "Specific indemnity and economic protection", "Agree protection for identified award, dilution or tax losses, with defined limits and proportionate security or price treatment, avoiding double recovery.", "banknote", "SPA drafting", {"Buyer": "Seek a specific indemnity for identified award, dilution or tax losses, supported where appropriate by escrow, retention or price adjustment without double recovery.", "Seller": "Limit any award or tax indemnity to defined exposure, with agreed caps and claim periods, and resist overlapping retention or price deductions."}],
        ["OH11", "Alternative treatment or transaction terms", "Where material awards obstruct completion, agree a workable alternative treatment, timetable or structure and its effect on value.", "arrow-left-right", "Signing", {"Buyer": "Where material awards obstruct completion, seek an alternative treatment, timetable or structure that delivers the agreed capital position, and reassess value.", "Seller": "Where material awards obstruct completion, propose a workable alternative treatment or timetable and agree any resulting change to structure or value."}]
      ]
    },
    {
      id: "threatened-litigation",
      label: "Threatened Litigation",
      shortLabel: "Threatened Litigation",
      actions: [
        ["conduct-dispute-diligence", "Further diligence", "Review the claim’s factual basis, procedural status, merits, potential exposure and likely effect on the target and transaction.", "search", "Due diligence"],
        ["obtain-contentious-advice", "Specialist legal assessment", "Obtain or update privileged legal advice on the claim, available defences, likely remedies and a reasonable settlement range.", "search", "Due diligence"],
        ["specific-litigation-disclosure", "Specific disclosure", "Agree specific disclosure of the claim, exposure, recovery position and material developments, while protecting privilege.", "file-search", "SPA drafting", {"Buyer": "Require specific disclosure of the claim, exposure, recovery position and material developments, using factual summaries where needed to protect privilege.", "Seller": "Make fair, specific disclosure of the claim and material developments, using factual summaries and agreed safeguards to protect privilege."}],
        ["confirm-insurance-and-recovery-rights", "Confirm insurance and recovery rights", "Confirm available insurance and other recovery rights, and satisfy applicable notice, consent and preservation requirements.", "search", "Due diligence"],
        ["resolve-claim-before-completion", "Resolve before completion", "Agree and implement a binding resolution before completion, including any remaining payments, releases and procedural steps.", "wrench", "Closing condition", {"Buyer": "Require an effective resolution before completion, with evidence that agreed payments, releases and procedural steps are complete.", "Seller": "Complete the agreed resolution steps and secure appropriate releases before completion to reduce residual exposure."}],
        ["litigation-resolution-condition-precedent", "Condition precedent", "Agree objective litigation milestones as completion conditions, with a longstop date and proportionate waiver and termination rights.", "circle-check", "Closing condition", {"Buyer": "Make material litigation milestones objective completion conditions, with a longstop date and clear buyer waiver and termination rights.", "Seller": "Limit litigation conditions to material, measurable milestones and resist discretionary buyer withdrawal rights, with an agreed longstop date."}],
        ["pre-completion-litigation-covenant", "Pre-completion conduct covenant", "If signing precedes completion, agree controls over material admissions, settlements and strategy changes, allowing timely compliance with procedural duties.", "file-pen-line", "SPA drafting", {"Buyer": "If signing precedes completion, seek consultation and consent rights over material litigation decisions, with exceptions for urgent procedural duties.", "Seller": "If signing precedes completion, limit buyer consent rights to material litigation decisions and preserve flexibility for urgent procedural duties."}],
        ["litigation-warranty", "Specific warranty", "Agree appropriately qualified warranties covering the dispute position, related undisclosed claims and material developments, supported by specific disclosure.", "shield-check", "SPA drafting", {"Buyer": "Seek warranties covering the dispute position, related undisclosed claims and material developments, supported by specific disclosure.", "Seller": "Give accurate, appropriately qualified dispute warranties and disclose known claims and developments against the relevant warranties."}],
        ["specific-litigation-indemnity", "Specific indemnity", "Agree a specific indemnity for defined litigation losses, with clear limits, claims control and treatment of recoveries.", "banknote", "SPA drafting", {"Buyer": "Seek a specific indemnity for identified litigation losses, with suitable claim periods, claims control and no double recovery.", "Seller": "Limit any litigation indemnity to defined losses and agreed caps and periods, with claims control, mitigation and credit for recoveries."}],
        ["litigation-ring-fencing-retention", "Ring-fencing or purchase-price retention", "Agree proportionate escrow or retention for identified litigation exposure, with clear payment and release triggers.", "lock-keyhole", "SPA drafting", {"Buyer": "Seek escrow or retention sufficient to support recovery for identified litigation losses, with clear payment and release triggers.", "Seller": "Limit any litigation escrow or retention to justified exposure, with a fixed release timetable and defined deductions."}],
        ["litigation-purchase-price-adjustment", "Purchase-price adjustment", "Agree any price adjustment for material litigation exposure, taking account of expected losses, costs and recoveries without double counting.", "arrow-down-up", "SPA drafting", {"Buyer": "Seek a price reduction for material litigation exposure, allowing for expected losses, costs and recoveries without duplicating other protections.", "Seller": "Resist speculative litigation discounts and limit any reduction to substantiated exposure, allowing for recoveries and other agreed protections."}],
        ["litigation-closing-loss-reserve", "Closing loss reserve or working-capital true-up", "Agree any litigation reserve or completion accounts adjustment, with clear accounting policies and no duplicate recovery.", "arrow-down-up", "Closing condition", {"Buyer": "Seek an appropriate litigation reserve or debt-like adjustment under the agreed accounting policies, without duplicating price deductions or other recoveries.", "Seller": "Limit litigation reserves or completion accounts deductions to the agreed accounting treatment, excluding amounts already reflected in price or other recoveries."}],
        ["litigation-wi-insurance", "Warranty and indemnity insurance", "Check W&I exclusions for the known dispute and explore available cover for related exposures without assuming the dispute is insured.", "shield-check", "Due diligence", {"Buyer": "Check W&I exclusions and available cover for related exposures before deciding what seller protection remains necessary.", "Seller": "Explore W&I cover for related exposures to reduce recourse to sellers, while confirming any exclusion for the known dispute."}],
        ["specific-mae-mac-walk-right", "Specific MAE/MAC walk-right", "Consider termination rights for defined material litigation developments, with objective thresholds and agreed exclusions.", "arrow-left-right", "Signing", {"Buyer": "Seek termination rights for defined material litigation developments that threaten transaction value or completion, with objective thresholds.", "Seller": "Resist broad litigation termination rights and limit any agreed trigger to objectively defined material developments, with clear exclusions."}]
      ]
    },
    {
      id: "debt-facilities-repayment",
      label: "Debt Facilities Requiring Repayment",
      shortLabel: "Debt Facilities",
      actions: [
        ["D01", "Finance schedule and trigger review", "Review a complete schedule of borrowing, guarantees and security and identify any repayment, consent or waiver requirements triggered by the transaction.", "search", "Due diligence"],
        ["D02", "Repayment covenant", "Agree who will arrange repayment or cancellation of specified facilities on or before completion.", "file-pen-line", "SPA drafting", {"Buyer": "Require repayment or cancellation of the specified facilities by completion, with clear seller obligations and evidence of discharge.", "Seller": "Agree defined repayment or cancellation duties for specified facilities, tied to the agreed funding and completion arrangements."}],
        ["D03", "Payoff deliverable", "Obtain a current written lender statement covering all amounts due, payment details and release conditions.", "calendar-check", "Closing condition"],
        ["D04", "Lender consent or waiver", "Obtain effective written consent or a waiver covering the transaction where a facility will continue.", "handshake", "Closing condition", {"Buyer": "Require effective written lender consent or waiver covering the transaction before relying on continued financing.", "Seller": "Arrange effective written lender consent or waiver and agree any lender conditions before committing to completion."}],
        ["D05", "Pre-completion covenant", "If signing precedes completion, agree controls over lender engagement, material borrowing or security changes and acceptance of lender conditions.", "file-pen-line", "SPA drafting", {"Buyer": "If signing precedes completion, seek consent rights over material lender negotiations, borrowing changes and acceptance of lender conditions.", "Seller": "If signing precedes completion, limit buyer consent rights to material finance changes, with practical exceptions for ordinary business needs and legal duties."}],
        ["D06", "Alternative lender route", "If the proposed route fails, agree amended terms, refinancing, a different repayment route or a revised timetable.", "arrow-left-right", "Signing"],
        ["D07", "Funding and shortfall allocation", "Confirm committed repayment funds and specify who bears any payoff shortfall.", "banknote", "SPA drafting", {"Buyer": "Require sufficient committed repayment funds and clear allocation of any shortfall, including agreed seller funding obligations.", "Seller": "Confirm agreed repayment funding and limit seller responsibility for any shortfall to expressly agreed amounts and timing."}],
        ["D08", "Security and guarantee releases", "Agree binding security and guarantee releases, or lender undertakings to deliver them against repayment, at completion.", "wrench", "Closing condition", {"Buyer": "Require binding releases of target-group security and guarantees, or lender undertakings to deliver them against repayment at completion.", "Seller": "Agree the release package, repayment conditions and lender deliverables needed to discharge target-group security and guarantees at completion."}],
        ["D09", "Completion funds flow", "Link lender payment, consent effectiveness and release delivery in a simultaneous completion process.", "calendar-check", "Closing condition"],
        ["D10", "Completion condition and longstop", "Agree material lender steps as objective completion conditions or deliverables, with a longstop date and proportionate termination rights.", "circle-check", "Closing condition", {"Buyer": "Make material lender steps objective completion conditions, with a longstop date and clear waiver and termination rights.", "Seller": "Limit lender-related completion conditions to material, measurable steps and resist open-ended buyer discretion, with proportionate longstop and termination rights."}],
        ["D11", "Debt and price mechanism", "Define how principal, interest, fees, break costs and hedging amounts affect consideration without counting the payoff twice.", "arrow-down-up", "SPA drafting", {"Buyer": "Require all principal, interest, fees, break costs and hedging amounts to be reflected in the price mechanism without double counting repayment.", "Seller": "Limit debt deductions to agreed amounts and definitions, excluding duplicate deductions for costs already reflected in the payoff or price."}],
        ["D12", "Finance warranties and disclosure", "Agree finance warranties covering facilities, security, amounts outstanding, defaults and lender consents, supported by specific disclosure.", "shield-check", "SPA drafting", {"Buyer": "Seek finance warranties covering facilities, security, amounts outstanding, defaults and lender consents, supported by specific disclosure.", "Seller": "Give accurate, appropriately qualified finance warranties and make fair disclosure of facilities, security, defaults and outstanding lender requirements."}],
        ["D13", "Charge-register update", "After actual repayment or release, arrange any appropriate Companies House record update.", "circle-arrow-right", "Post-completion"],
        ["D14", "APA excluded liabilities", "In cases of asset sales, specify which finance liabilities the buyer assumes, exclude the others, and obtain any necessary creditor consent or novation.", "ellipsis", "SPA drafting", {"Buyer": "In cases of asset sales, specify assumed finance liabilities, exclude the others and require any necessary creditor consents or novations.", "Seller": "In cases of asset sales, define retained and transferred finance liabilities and obtain any creditor releases, consents or novations needed to implement the agreed allocation."}]
      ]
    }
  ];

  topics.push({
    id: "share-ownership-and-transfer-restrictions",
    label: "Share Ownership and Transfer Restrictions",
    shortLabel: "Share Ownership",
    actions: [
      ["SO01", "Verify share ownership", "Reconcile the register of members, cap table and supporting title documents to confirm each seller’s ownership of the sale shares.", "search", "Due diligence"],
      ["SO02", "Rectify title defects", "Obtain missing ownership evidence and resolve title defects or competing claims through corrective documents, settlement or appropriate register rectification.", "wrench", "Due diligence", {"Buyer": "Require missing ownership evidence and effective correction of title defects or competing claims before completion.", "Seller": "Provide missing ownership evidence and resolve identified title defects or competing claims through proportionate corrective steps before completion."}],
      ["SO03", "Secure seller participation", "Agree participation with outstanding shareholders and verify any drag-along route before relying on compulsory transfer.", "handshake", "Signing", {"Buyer": "Confirm that the required shareholders will sell and verify any drag-along route before relying on compulsory transfer.", "Seller": "Secure agreement to sell from outstanding shareholders and check that any proposed drag-along follows the applicable documents and procedure."}],
      ["SO04", "Obtain transfer consents and waivers", "Secure the approvals, pre-emption waivers and other clearances required under the articles, shareholders’ agreement and relevant contractual arrangements.", "handshake", "Signing", {"Buyer": "Require evidence that all necessary transfer approvals, pre-emption waivers and contractual clearances have been obtained.", "Seller": "Arrange the necessary transfer approvals, pre-emption waivers and contractual clearances in time for completion."}],
      ["SO05", "Release security over the shares", "Obtain binding release arrangements covering the sale shares, with any repayment requirements coordinated through the completion funds flow.", "wrench", "Closing condition", {"Buyer": "Require binding releases of security over the sale shares, coordinating any repayment and release through the completion funds flow.", "Seller": "Agree binding security releases and any repayment arrangements so the sale shares can be delivered free of security at completion."}],
      ["SO06", "Title and capacity warranties", "Agree warranties covering each seller’s ownership, capacity and authority to sell, and the absence of undisclosed encumbrances over their shares.", "shield-check", "SPA drafting", {"Buyer": "Seek warranties covering each seller’s ownership, capacity and authority to sell, and the absence of undisclosed encumbrances over their shares.", "Seller": "Give accurate warranties limited to each seller’s own title, capacity and authority, with any encumbrances clearly identified."}],
      ["SO07", "Specific disclosure", "Clearly disclose known ownership gaps, competing claims, transfer restrictions and security arrangements against the relevant SPA warranties.", "file-search", "SPA drafting", {"Buyer": "Require specific disclosure of ownership gaps, competing claims, transfer restrictions and security against the relevant sale agreement warranties.", "Seller": "Make fair, specific disclosure of known ownership gaps, competing claims, transfer restrictions and security against the relevant warranties."}],
      ["SO08", "Specific title indemnity and security", "Allocate losses from identified title defects or competing claims through a specific indemnity, supported by escrow or retention where appropriate.", "banknote", "SPA drafting", {"Buyer": "Seek a specific indemnity for identified title defects or competing claims, with escrow or retention where recovery needs protection.", "Seller": "Resist broad title indemnities and limit any agreed cover, duration and supporting security to the identified exposure."}],
      ["SO09", "Completion conditions and longstop", "Make material title, participation or release requirements objective completion conditions, with an agreed longstop and proportionate termination rights.", "circle-check", "Closing condition", {"Buyer": "Make material title, participation or release steps objective completion conditions, with a longstop date and clear waiver and termination rights.", "Seller": "Limit completion conditions to material, measurable title, participation or release steps, with an agreed longstop and proportionate termination rights."}],
      ["SO10", "Share transfer completion mechanics", "Agree transfer documents, certificate delivery, registration steps and any interim voting arrangements pending registration.", "calendar-check", "Closing condition"]
    ]
  });

  topics.push({
  "id": "key-employee-retention-and-employment-terms",
  "label": "Key Employee Retention and Employment Terms",
  "shortLabel": "Employment",
  "actions": [
    [
      "ER13",
      "Review employment contracts",
      "Review key employees’ contracts, amendments and incentive arrangements to identify notice periods, departure rights, payments and gaps in protection.",
      "search",
      "Due diligence"
    ],
    [
      "ER14",
      "Review pay and incentives",
      "If remuneration is contributing to departure risk, consider salary increases, bonuses or improved benefits, taking account of recurring costs and who funds them.",
      "wrench",
      "Due diligence",
      {
        "Buyer": "If remuneration contributes to departure risk, assess targeted pay improvements and require agreement on recurring costs and who funds them.",
        "Seller": "If remuneration contributes to departure risk, assess proportionate pay improvements and limit new funding commitments to those expressly agreed."
      }
    ],
    [
      "ER01",
      "Binding retention arrangements",
      "Tie retention payments to an agreed period of service or handover, with clear rules for employees who leave early.",
      "handshake",
      "Signing",
      {
        "Buyer": "Seek binding retention payments linked to service or handover, with clear early-leaver terms and agreed funding.",
        "Seller": "Agree proportionate retention payments linked to service or handover, with clear early-leaver terms and defined seller funding commitments."
      }
    ],
    [
      "ER15",
      "Review good/bad leaver terms",
      "If key employees hold shares, options or continuing equity incentives, review how departure affects vesting, exercise rights and compulsory transfers alongside the Option Holders analysis.",
      "search",
      "Due diligence"
    ],
    [
      "ER02",
      "Strengthen employment terms",
      "Agree suitable notice, handover, confidentiality and reasonable competition restrictions, with employee consent and regard to TUPE.",
      "wrench",
      "Signing",
      {
        "Buyer": "Seek suitable notice, handover, confidentiality and reasonable competition protections, with employee consent and regard to TUPE.",
        "Seller": "Agree proportionate changes to notice, handover, confidentiality and reasonable competition terms, with employee consent and regard to TUPE."
      }
    ],
    [
      "ER03",
      "Key employee completion protections",
      "Where retention is essential, make completion conditional on agreed employee arrangements, with a deadline and clear rights to waive the condition or terminate.",
      "circle-check",
      "Closing condition",
      {
        "Buyer": "Where retention is essential, seek objective employee completion conditions with a deadline and clear waiver and termination rights.",
        "Seller": "Where retention is essential, limit employee completion conditions to defined milestones and deadlines rather than open-ended guarantees that employees will stay."
      }
    ],
    [
      "ER04",
      "Pre-completion employment covenant",
      "If signing precedes completion, require buyer consent for material changes to key employees’ terms, bonuses or departure arrangements, subject to appropriate exceptions.",
      "file-pen-line",
      "SPA drafting",
      {
        "Buyer": "If signing precedes completion, seek consent rights over material changes to key employees’ terms, bonuses or departure arrangements, subject to appropriate exceptions.",
        "Seller": "If signing precedes completion, limit buyer consent rights to material employment changes, with exceptions for ordinary business needs and legal duties."
      }
    ],
    [
      "ER05",
      "Employment warranties and disclosure",
      "Obtain assurances about employment terms, payments and resignation notices, supported by clear disclosure of known issues and knowledge-qualified statements about departure intentions.",
      "shield-check",
      "SPA drafting",
      {
        "Buyer": "Seek employment warranties supported by clear disclosure, covering terms, payments and resignation notices, with knowledge-qualified statements about departure intentions.",
        "Seller": "Give accurate employment warranties supported by fair disclosure and appropriate knowledge qualifications, without guaranteeing employees’ future intentions."
      }
    ],
    [
      "ER07",
      "Allocate employee payments",
      "Agree who bears bonuses, severance, retention payments and employer taxes, reflecting these in the price and completion payments without double counting.",
      "calendar-check",
      "Closing condition",
      {
        "Buyer": "Identify employee transaction payments and employer taxes and seek clear seller responsibility for agreed pre-completion costs without double counting.",
        "Seller": "Identify employee transaction payments and employer taxes and limit seller funding to agreed amounts, separating buyer-led retention costs without double counting."
      }
    ],
    [
      "ER08",
      "Specific indemnity and security",
      "If an identified employee liability requires protection, agree which losses the seller will reimburse and consider escrow or a price holdback where recovery is a concern.",
      "banknote",
      "SPA drafting",
      {
        "Buyer": "If an identified employee liability requires protection, seek a specific indemnity and consider escrow or retention where recovery is a concern.",
        "Seller": "If an identified employee liability requires protection, resist broad indemnities and limit any agreed liability, duration and security to the identified exposure."
      }
    ],
    [
      "ER09",
      "Limit seller retention obligations",
      "If the buyer seeks retention guarantees, require defined seller efforts instead and exclude departures caused by buyer decisions after completion.",
      "file-pen-line",
      "SPA drafting",
      {
        "Buyer": "If seller retention duties are negotiated, require defined efforts and allocate responsibility for departures caused by buyer decisions.",
        "Seller": "If the buyer seeks retention guarantees, limit commitments to defined seller efforts and exclude departures caused by buyer decisions after completion."
      }
    ],
    [
      "ER11",
      "TUPE protections",
      "If TUPE applies to a business transfer, allocate employee information, consultation and transfer obligations, together with responsibility for losses caused by each party’s failures.",
      "file-pen-line",
      "SPA drafting",
      {
        "Buyer": "If TUPE applies, verify employee information and consultation steps and seek protection for seller failures while addressing the buyer’s own duties.",
        "Seller": "If TUPE applies, fulfil the seller’s information and consultation duties and limit liability for failures caused by the buyer."
      }
    ]
  ]
});

  topics.push({
  "id": "compliance-gaps-and-personal-data-breaches",
  "label": "Compliance Gaps and Personal Data Breaches",
  "shortLabel": "Data Protection",
  "actions": [
    [
      "DP01",
      "Targeted diligence",
      "Confirm the issue’s scope, affected data and legal position, using specialist advice where needed.",
      "search",
      "Due diligence",
      {
        "Buyer": "Investigate the issue’s scope, affected data and legal position, using specialist advice where needed.",
        "Seller": "Assemble the issue records and obtain advice on unresolved facts before presenting the position to the buyer."
      }
    ],
    [
      "DP02",
      "Containment and remediation",
      "Agree and implement a proportionate plan to contain any ongoing harm and remedy confirmed gaps or breaches.",
      "wrench",
      "Due diligence",
      {
        "Buyer": "Require a proportionate plan to contain any ongoing harm and remedy confirmed gaps or breaches.",
        "Seller": "Procure prompt containment and proportionate remedial work for confirmed gaps or breaches."
      }
    ],
    [
      "DP03",
      "Breach notifications",
      "Check the notification assessment and ensure any required notices are made promptly with reasons recorded for any delay.",
      "circle-arrow-right",
      "Due diligence",
      {
        "Buyer": "Obtain the notification assessment and evidence that the responsible party has made any required notices promptly.",
        "Seller": "Procure prompt notification by the responsible party where required and document the assessment and any delay."
      }
    ],
    [
      "DP04",
      "Verify remediation",
      "Verify the completed remedial work against supporting evidence and resolve any conflicting answers.",
      "circle-check",
      "Due diligence",
      {
        "Buyer": "Obtain evidence that the remedial work is complete and resolve any conflicting answers before relying on it.",
        "Seller": "Assemble evidence of completed remedial work and correct any inconsistent records."
      }
    ],
    [
      "DP05",
      "Complaints and claims response",
      "Confirm the response to complaints, claims and regulatory enquiries and agree responsibility for any remaining steps.",
      "calendar-check",
      "Due diligence",
      {
        "Buyer": "Review complaints, claims and regulatory enquiries and require a plan for any outstanding response or obligations.",
        "Seller": "Confirm complaints, claims and regulatory enquiries are properly handled and meet any remaining obligations or deadlines."
      }
    ],
    [
      "DP06",
      "Costs and recoveries",
      "Quantify likely costs and liabilities and check available insurance or third-party recoveries.",
      "search",
      "Due diligence",
      {
        "Buyer": "Quantify likely exposure and confirm available insurance or third-party recoveries before agreeing the price.",
        "Seller": "Substantiate likely costs and preserve available insurance or third-party recoveries to support the proposed price."
      }
    ],
    [
      "DP07",
      "Specific disclosure",
      "Record the issue, response and remaining exposure in specific disclosures while protecting personal data and privilege.",
      "file-search",
      "SPA drafting",
      {
        "Buyer": "Require specific disclosure of the issue, response and remaining exposure without unnecessary personal data or privileged advice.",
        "Seller": "Make fair, specific disclosure of the issue and response while protecting personal data and privilege."
      }
    ],
    [
      "DP08",
      "Data protection warranties",
      "Agree proportionate warranties on compliance, incident records and regulatory correspondence, subject to specific disclosure.",
      "shield-check",
      "SPA drafting",
      {
        "Buyer": "Seek tailored warranties on compliance, incident records and regulatory correspondence without relying on them to cover disclosed issues.",
        "Seller": "Limit data protection warranties to an accurate, appropriately qualified position supported by specific disclosure."
      }
    ],
    [
      "DP09",
      "Remediation and conduct covenants",
      "Document outstanding response duties, milestones, reporting and cost allocation in the sale agreement.",
      "file-pen-line",
      "SPA drafting",
      {
        "Buyer": "Require enforceable response and remediation duties with milestones, reporting and clear allocation of continuing costs.",
        "Seller": "Limit response and remediation covenants to defined tasks, deadlines and costs within the seller’s control."
      }
    ],
    [
      "DP10",
      "Completion condition",
      "Agree objective completion conditions for material unresolved issues, with a longstop date and clear termination rights.",
      "circle-check",
      "Closing condition",
      {
        "Buyer": "Make completion conditional on objective milestones for material unresolved issues, with a longstop date and termination rights.",
        "Seller": "Limit any completion condition to material, measurable steps within the seller’s control and resist open-ended buyer discretion."
      }
    ],
    [
      "DP11",
      "Specific indemnity and security",
      "Agree a targeted indemnity for identified losses, with suitable limits and security where justified.",
      "banknote",
      "SPA drafting",
      {
        "Buyer": "Seek a specific indemnity for identified losses, backed by escrow or retention where justified.",
        "Seller": "Resist a broad indemnity and, if agreed, limit covered losses, duration and any escrow or retention."
      }
    ],
    [
      "DP12",
      "Price treatment",
      "Reflect material exposure in the price or completion accounts without duplicating other recoveries.",
      "arrow-down-up",
      "SPA drafting",
      {
        "Buyer": "Seek a price adjustment for material exposure not already addressed through agreed protections or recoveries.",
        "Seller": "Resist duplicate price reductions and ensure agreed protections and recoveries are reflected in the valuation."
      }
    ],
    [
      "DP13",
      "Reassess the transaction",
      "Reassess whether the deal can proceed on acceptable terms or should be restructured or abandoned.",
      "arrow-left-right",
      "Signing",
      {
        "Buyer": "Reassess the price, structure and ability to proceed, including walking away if the issue undermines the acquisition.",
        "Seller": "Assess whether remediation, revised terms or a different structure can preserve the sale before ending the sale process."
      }
    ]
  ]
});

  topics.push({
  "id": "termination-rights-and-material-breaches",
  "label": "Termination Rights and Material Breaches",
  "shortLabel": "Termination Rights",
  "actions": [
    [
      "TR01",
      "Review the contractual position",
      "Review the contract, correspondence and available remedies to establish the issue and remaining uncertainty.",
      "search",
      "Due diligence",
      {
        "Buyer": "Review the contract, correspondence and available remedies to establish the breach, termination rights and remaining uncertainty.",
        "Seller": "Assemble the contract and correspondence, and resolve uncertainties before presenting the position to the buyer."
      }
    ],
    [
      "TR02",
      "Manage notices and preserve rights",
      "Check notice validity, meet response deadlines and preserve the target’s rights, with specialist advice where needed.",
      "calendar-check",
      "Due diligence",
      {
        "Buyer": "Require confirmation of notice validity, response deadlines and steps preserving the target’s rights, with specialist advice where needed.",
        "Seller": "Procure timely responses and preserve the target’s rights, avoiding unsupported admissions, waivers or termination steps."
      }
    ],
    [
      "TR03",
      "Secure continuity or replacement",
      "Agree and implement a practical cure, waiver, continuation or replacement, with clear responsibility for costs and delivery.",
      "wrench",
      "Due diligence",
      {
        "Buyer": "Require an effective cure, waiver, agreed continuation or workable replacement before relying on the contract’s future value.",
        "Seller": "Negotiate a practical cure, waiver, continuation or replacement while controlling concessions and protecting the commercial relationship."
      }
    ],
    [
      "TR04",
      "Verify the resolution",
      "Verify that the resolution is effective and identify any surviving claims, obligations or continuity needs.",
      "circle-check",
      "Due diligence",
      {
        "Buyer": "Obtain evidence that the resolution is effective and covers outstanding claims, termination rights and continuity needs.",
        "Seller": "Assemble evidence of effective resolution and identify any surviving obligations before seeking release from further protection."
      }
    ],
    [
      "TR05",
      "Quantify costs and recoveries",
      "Quantify likely losses, mitigation costs and available recoveries to support proportionate pricing and risk allocation.",
      "file-search",
      "Due diligence",
      {
        "Buyer": "Quantify lost revenue, replacement costs and potential liabilities, and assess available recoveries before agreeing value and protection.",
        "Seller": "Substantiate likely losses, mitigation costs and available recoveries to resist speculative deductions or disproportionate protection."
      }
    ],
    [
      "TR06",
      "Tailor warranties and disclosure",
      "Agree accurate contract-status warranties and specific disclosure, addressing identified losses separately.",
      "shield-check",
      "SPA drafting",
      {
        "Buyer": "Seek tailored contract-status warranties and specific disclosure of breaches, notices and threatened termination, without treating warranties as cover for disclosed losses.",
        "Seller": "Make fair, specific disclosure and qualify contract warranties to reflect the documented position and agreed liability limitations."
      }
    ],
    [
      "TR07",
      "Document outstanding obligations",
      "Document remedial tasks, milestones, reporting, cooperation and costs, with proportionate controls on material decisions and exceptions for urgent steps.",
      "file-pen-line",
      "SPA drafting",
      {
        "Buyer": "Require enforceable remedial duties, progress reporting and controls on material settlements or contract changes, with appropriate urgent-action exceptions.",
        "Seller": "Limit remedial duties to defined tasks and reasonable endeavours, with cooperation requirements, cost limits and flexibility for urgent steps."
      }
    ],
    [
      "TR08",
      "Set completion conditions",
      "Agree objective conditions for essential continuity or resolution, with a realistic longstop date and proportionate rights if conditions fail.",
      "circle-check",
      "Closing condition",
      {
        "Buyer": "Make completion conditional on objective continuity or resolution milestones, with a longstop date and clear rights if conditions fail.",
        "Seller": "Resist unnecessary conditionality; limit agreed conditions to material, measurable outcomes, with realistic deadlines and tightly defined withdrawal rights."
      }
    ],
    [
      "TR09",
      "Allocate identified losses",
      "Agree a targeted indemnity for identified losses, with negotiated limits, claims procedures and security only where justified.",
      "banknote",
      "SPA drafting",
      {
        "Buyer": "Seek a specific indemnity for identified exposure, with suitable claim periods and escrow or retention where recovery risk justifies it.",
        "Seller": "Resist blanket indemnities; limit any agreed cover by scope, cap, duration, claims control and credits for recoveries or price adjustments."
      }
    ],
    [
      "TR10",
      "Reflect exposure in the price",
      "Reflect evidenced loss of value or exposure in the price or contingent payments, avoiding double recovery.",
      "arrow-down-up",
      "SPA drafting",
      {
        "Buyer": "Seek a price reduction or contingent payment structure reflecting lost value or unresolved exposure, without duplicating other recovery.",
        "Seller": "Resist speculative deductions and use evidence-based adjustments or contingent payments, crediting mitigation and other agreed protection."
      }
    ],
    [
      "TR11",
      "Reassess the transaction",
      "Reassess transaction viability and agree whether resolution, revised terms, restructuring or a negotiated exit is appropriate.",
      "arrow-left-right",
      "Signing",
      {
        "Buyer": "Reassess whether to proceed, restructure or negotiate an exit where the contract issue undermines the acquisition rationale.",
        "Seller": "Assess whether resolution, revised terms or restructuring can preserve the sale, and establish alternatives if the deal cannot proceed."
      }
    ]
  ]
});

  // Explicit catalogue choices alongside the answer-driven TR01/TR03 variants.
  topics.find(topic => topic.id === "termination-rights-and-material-breaches").actions.push(
    ["TR12", "Agree a pause with the counterparty",
      "If the contract is still live, seek written agreement on which steps the counterparty will pause, until when, and what each party must do meanwhile.",
      "handshake", "Due diligence"],
    ["TR13", "Test the first day without the contract",
      "Ask the business owner what would stop on day one, who would be affected and whether the fallback would work in time; use actual disruption if already ended.",
      "search", "Due diligence"]
  );

  const coreActionIcons = Object.freeze({
    "Further diligence": "search",
    "Rectification": "wrench",
    "Third-party consent": "handshake",
    "Condition precedent": "circle-check",
    "Pre-completion covenant": "file-pen-line",
    "Warranty": "shield-check",
    "Specific indemnity": "banknote",
    "Specific disclosure": "file-search",
    "Escrow or retention": "lock-keyhole",
    "Price adjustment": "arrow-down-up",
    "Completion mechanic": "calendar-check",
    "Post-completion action": "circle-arrow-right",
    "Walk away or renegotiate": "arrow-left-right",
    "Other": "ellipsis"
  });
  const validIcons = new Set(Object.values(coreActionIcons));
  topics.forEach(topic => {
    topic.actions = topic.actions.map(([id, title, description, icon, phase, descriptionsBySide]) => {
      if (!validIcons.has(icon)) throw new Error(`Unknown action icon for ${topic.id}/${id}: ${icon}`);
      return { id, title, description, icon, phase, ...(descriptionsBySide ? { descriptionsBySide } : {}) };
    });
  });

  const byTopic = new Map(topics.map(topic => [topic.id, topic]));
  const aliases = {
    "customer-change-of-control": [
      [/further diligence/i, "coc-trigger-review"], [/post-completion action/i, "coc-serve-notice"],
      [/pre-completion covenant/i, text => /communication/i.test(text) ? "coc-agree-communication" : "coc-seek-consent-covenant"],
      [/warranty/i, "coc-warranty-disclosure"], [/specific indemnity/i, "coc-specific-indemnity"],
      [/condition precedent/i, "coc-consent-cp"], [/walk away|longstop/i, "coc-longstop-rights"], [/other|tailored/i, "coc-tailored-response"]
    ]
  };
  const resolveActionId = (topicId, title = "", description = "", explicitId = "") => {
    if (topicId === "key-employee-retention-and-employment-terms") {
      // Resolve retired protections to their merged successor without rewriting saved user content.
      explicitId = ({ER06:"ER05", ER10:"ER08", ER12:"ER03"})[explicitId] || explicitId;
      if (!explicitId) {
        const legacyTitles = {"Employment warranties":"ER05", "Specific employment disclosure":"ER05", "Specific employment indemnity":"ER08", "Escrow or price retention":"ER08", "Key employee completion condition":"ER03", "Renegotiate or exit":"ER03"};
        explicitId = legacyTitles[title] || "";
      }
    }
    const topic = byTopic.get(topicId);
    if (!topic) return explicitId || "";
    if (explicitId && topic.actions.some(action => action.id === explicitId)) return explicitId;
    const exact = topic.actions.find(action => action.title.toLowerCase() === String(title).trim().toLowerCase());
    if (exact) return exact.id;
    const text = `${title} ${description}`;
    for (const [pattern, value] of aliases[topicId] || []) {
      if (pattern.test(text)) return typeof value === "function" ? value(text) : value;
    }
    return explicitId || "";
  };

  const actionFor = (topicId, title = "", description = "", explicitId = "") => {
    const id = resolveActionId(topicId, title, description, explicitId);
    return byTopic.get(topicId)?.actions.find(action => action.id === id) || null;
  };

  const forSide = (action, side = "Balanced") => action ? { ...action, description: action.descriptionsBySide?.[side] || action.description } : null;
  window.DealLogicActionRegistry = { topics, byTopic, coreActionIcons, resolveActionId, actionFor, forSide };
})();
