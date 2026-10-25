(() => {
  const topics = [
    {
      id: "customer-change-of-control",
      label: "Change of Control",
      shortLabel: "Change of Control",
      actions: [
        ["coc-trigger-review", "Confirm whether the provision is triggered", "Review the clause, transaction structure and relevant exceptions to establish whether notification, consent or another step is required.", "search", "Due diligence"],
        ["coc-serve-notice", "Serve the contractual notice", "Deliver the required change-of-control notice in accordance with the contract’s timing and formalities.", "circle-arrow-right", "Post-completion"],
        ["coc-agree-communication", "Agree the counterparty communication", "Prepare and agree the notification or consent request before completion.", "file-pen-line", "Signing"],
        ["coc-seek-consent-covenant", "Covenant to seek consent", "Include an obligation to use the agreed level of endeavours to obtain third-party consent.", "file-pen-line", "SPA drafting"],
        ["coc-warranty-disclosure", "Change-of-control warranty and disclosure", "Include an appropriate SPA warranty and disclose the provision and consent position in the disclosure letter.", "shield-check", "SPA drafting"],
        ["coc-specific-indemnity", "Specific indemnity", "Allocate losses arising from third-party termination or other consequences of the change-of-control provision.", "banknote", "SPA drafting"],
        ["coc-consent-cp", "Consent condition precedent", "Make completion conditional on obtaining consent, or negotiate limits on that condition where appropriate.", "circle-check", "Closing condition"],
        ["coc-longstop-rights", "Longstop and termination rights", "Agree a deadline and appropriate termination or renegotiation rights if consent is withheld or notification triggers termination rights.", "arrow-left-right", "SPA drafting"],
        ["coc-tailored-response", "Tailored contractual response", "Agree a specific transaction response where the user records a consequence outside the standard notice and consent options.", "ellipsis", "SPA drafting"]
      ]
    },
    {
      id: "missing-ip-assignment",
      label: "Missing IP Assignment",
      shortLabel: "Missing IP",
      actions: [
        ["R01", "Confirmatory deed of assignment", "Obtain an executed assignment from the IP owner as a completion deliverable or condition.", "wrench", "Closing condition"],
        ["R02", "Chain-of-title diligence", "Review creator status, engagement terms, assignments, licences, waivers and registry records to establish the target’s ownership or usage rights.", "search", "Due diligence"],
        ["R03", "Secure the IP owner’s cooperation", "Contact the owner early and agree assignment terms, including appropriate consideration or an execution fee where needed.", "wrench", "Due diligence"],
        ["R04", "Specific IP indemnity and security", "Allocate ownership or infringement exposure through a specific indemnity, supported by escrow or retention where appropriate.", "banknote", "SPA drafting"],
        ["R05", "Specific disclosure", "Disclose missing assignments, incomplete records and identified title gaps against the IP warranties.", "file-search", "SPA drafting"],
        ["R06", "IP title warranties and capped indemnity", "Obtain title warranties with an appropriate indemnity addressing potential unknown ownership defects.", "shield-check", "SPA drafting"],
        ["R07", "Replacement or clean-room rewrite", "Assess the cost, timing and legal feasibility of replacing the affected IP through an independent rewrite or redesign.", "wrench", "Due diligence"],
        ["R08", "Settlement and transfer condition precedent", "Make completion conditional on settlement, release and full transfer where the owner has asserted a claim.", "circle-check", "Closing condition"],
        ["R09", "Purchase-price adjustment", "Assess the claim and financial exposure to determine whether valuation should reflect the title risk or potential litigation costs.", "arrow-down-up", "SPA drafting"],
        ["R10", "Alternative transaction structure", "Consider whether an asset acquisition or another structure could isolate liabilities, while assessing the continuing IP risk.", "ellipsis", "Signing"],
        ["R11", "Walk away or renegotiate", "Reconsider the transaction terms or ability to proceed where the ownership dispute materially affects target value.", "arrow-left-right", "Signing"]
      ]
    },
    {
      id: "option-holders",
      label: "Option Holders",
      shortLabel: "Option Holders",
      actions: [
        ["OH01", "Reconcile awards and the cap table", "Reconcile award registers, historic exercises and cancellations against the fully diluted cap table.", "search", "Due diligence"],
        ["OH03", "Agree an award treatment schedule", "Record the treatment of each holder and award, together with the required completion steps.", "calendar-check", "Signing"],
        ["OH04", "Obtain corporate approvals and documents", "Secure the required board and shareholder approvals and prepare the implementation documents.", "wrench", "Signing"],
        ["OH05", "Obtain holder consents and releases", "Obtain required consents, elections, releases and powers of attorney from affected holders.", "handshake", "Signing"],
        ["OH06", "Prepare the final closing cap table", "Deliver the definitive cap table reflecting the agreed award treatment.", "calendar-check", "Closing condition"],
        ["OH07", "Obtain share-scheme tax and payroll advice", "Confirm the tax, withholding, payroll and reporting consequences of the proposed treatment.", "search", "Due diligence"],
        ["OH08", "Award implementation condition precedent", "Make completion conditional on effective implementation and delivery of the final cap table and supporting documents.", "circle-check", "Closing condition"],
        ["OH10", "Specific indemnity and economic protection", "Allocate identified award, dilution or tax exposure through an indemnity, potentially supported by escrow, retention or a price adjustment.", "banknote", "SPA drafting"],
        ["OH11", "Alternative treatment or transaction terms", "Where material awards obstruct completion, consider an alternative treatment, timetable, structure or valuation.", "arrow-left-right", "Signing"]
      ]
    },
    {
      id: "threatened-litigation",
      label: "Threatened Litigation",
      shortLabel: "Threatened Litigation",
      actions: [
        ["conduct-dispute-diligence", "Further diligence", "Review the claim’s factual basis, procedural status, merits, potential exposure and likely effect on the target and transaction.", "search", "Due diligence"],
        ["obtain-contentious-advice", "Specialist legal assessment", "Obtain or update privileged contentious advice on the claim, available defences, likely remedies and reasonable settlement range.", "file-text", "Due diligence"],
        ["specific-litigation-disclosure", "Specific disclosure", "Require detailed disclosure of the claim, material documents, procedural status, financial exposure, insurance position and developments, while protecting privilege.", "file-search", "SPA drafting"],
        ["confirm-insurance-and-recovery-rights", "Confirm insurance and recovery rights", "Confirm available insurance, indemnities, liability limitations and contribution rights, including notice, consent and preservation requirements.", "file-text", "Due diligence"],
        ["resolve-claim-before-completion", "Resolve before completion", "Require settlement, withdrawal, dismissal or another effective resolution before completion, supported by an appropriate release.", "check", "Closing condition"],
        ["litigation-resolution-condition-precedent", "Condition precedent", "Make completion conditional on settlement, dismissal, release or another objectively verifiable litigation milestone.", "circle-check", "Closing condition"],
        ["pre-completion-litigation-covenant", "Pre-completion conduct covenant", "Restrict material admissions, settlements, waivers and strategy changes without appropriate buyer consultation or consent.", "check", "SPA drafting"],
        ["litigation-warranty", "Specific warranty", "Obtain warranties covering the disclosed position, related undisclosed claims and material developments.", "shield-check", "SPA drafting"],
        ["specific-litigation-indemnity", "Specific indemnity", "Allocate defined litigation losses to the seller, addressing caps, baskets, time limits, claim conduct, mitigation, recoveries and double recovery.", "banknote", "SPA drafting"],
        ["litigation-ring-fencing-retention", "Ring-fencing or purchase-price retention", "Hold part of the price in escrow or retention until final judgment, executed settlement or expiry of an agreed claims period.", "scale", "SPA drafting"],
        ["litigation-purchase-price-adjustment", "Purchase-price adjustment", "Reduce the price where significant litigation risk affects valuation, taking account of expected loss, costs and recoveries.", "scale", "SPA drafting"],
        ["litigation-closing-loss-reserve", "Closing loss reserve or working-capital true-up", "Require an agreed reserve, debt-like treatment or working-capital adjustment, with clear accounting policies and no double counting.", "file-text", "Closing condition"],
        ["litigation-wi-insurance", "Warranty and indemnity insurance", "Ask W&I underwriters whether the matter is excluded and explore cover or riders for related or secondary exposures.", "shield-check", "Due diligence"],
        ["specific-mae-mac-walk-right", "Specific MAE/MAC walk-right", "Permit termination for defined material developments, subject to agreed thresholds and carve-outs.", "file-text", "Signing"]
      ]
    },
    {
      id: "debt-facilities-repayment",
      label: "Debt Facilities Requiring Repayment",
      shortLabel: "Debt Facilities",
      actions: [
        ["D01", "Finance schedule and trigger review", "Require a complete schedule of borrowing, guarantees and security, and identify the repayment or consent terms triggered by the transaction.", "search", "Due diligence"],
        ["D02", "Repayment covenant", "Require the seller to procure repayment or cancellation of specified facilities on or before completion.", "file-pen-line", "SPA drafting"],
        ["D03", "Payoff deliverable", "Require a current written lender statement covering all amounts due, payment details and release conditions.", "file-text", "Closing condition"],
        ["D04", "Lender consent or waiver", "Obtain effective written consent or a waiver covering the transaction where a facility will continue.", "circle-check", "Closing condition"],
        ["D05", "Pre-completion covenant", "Govern lender engagement, changes to borrowing or security, and acceptance of lender conditions before completion.", "file-pen-line", "SPA drafting"],
        ["D06", "Alternative lender route", "If the proposed route fails, agree amended terms, refinancing, a different repayment route or a revised timetable.", "arrow-left-right", "Signing"],
        ["D07", "Funding and shortfall allocation", "Confirm committed repayment funds and specify who bears any payoff shortfall.", "banknote", "SPA drafting"],
        ["D08", "Security and guarantee releases", "Require agreed releases, or a binding lender undertaking to deliver them against repayment, at completion.", "shield-check", "Closing condition"],
        ["D09", "Completion funds flow", "Link lender payment, consent effectiveness and release delivery in a simultaneous completion process.", "arrow-left-right", "Closing condition"],
        ["D10", "Completion condition and longstop", "Make material lender steps conditions or completion deliverables, with an objective deadline and termination route where appropriate.", "calendar-check", "Closing condition"],
        ["D11", "Debt and price mechanism", "Define how principal, interest, fees, break costs and hedging amounts affect consideration without counting the payoff twice.", "banknote", "SPA drafting"],
        ["D12", "Finance warranties and disclosure", "Cover facilities, security, amounts outstanding, defaults and required lender consents, with specific disclosure of exceptions.", "shield-check", "SPA drafting"],
        ["D13", "Charge-register update", "After actual repayment or release, arrange any appropriate Companies House record update.", "file-check", "Post-completion"],
        ["D14", "APA excluded liabilities", "In cases of asset sales, specify which finance liabilities the buyer assumes, exclude the others, and obtain any necessary creditor consent or novation.", "file-pen-line", "SPA drafting"]
      ]
    }
  ];

  topics.forEach(topic => {
    topic.actions = topic.actions.map(([id, title, description, icon, phase]) => ({ id, title, description, icon, phase }));
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

  window.DealLogicActionRegistry = { topics, byTopic, resolveActionId };
})();
