/* Debt facilities: diligence, risk and answer-driven deal logic. */
(() => {
  const issueId = "debt-facilities-repayment";
  const escapeLogicText = value => String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const ids = ["debt-obligations", "debt-transaction-effect", "debt-payoff", "debt-consent", "debt-funding", "debt-releases", "debt-completion-sequence"];
  const options = {
    "debt-obligations": ["Unanswered", "No — confirmed from finance documents and charge records", "Yes — finance obligations or security exist", "Possibly — records are incomplete", "Not yet checked"],
    "debt-transaction-effect": ["Unanswered", "None — no repayment, consent or waiver required", "Repayment or cancellation required", "Lender consent or waiver required to continue", "Both repayment and lender consent or waiver required", "Unclear — documents or transaction analysis incomplete"],
    "debt-payoff": ["Unanswered", "Yes — current written payoff covers all amounts and release conditions", "Partly — figures or conditions remain open", "No — no written payoff obtained", "Not yet requested"],
    "debt-consent": ["Unanswered", "Yes — written consent or waiver is effective", "Agreed in principle, but not signed", "No — lender has declined or required terms are unmet", "Not yet sought"],
    "debt-funding": ["Unanswered", "Yes — sufficient committed funds and agreed funds flow", "Expected, but funding or funds flow is not final", "No — shortfall or timing gap", "Not yet assessed"],
    "debt-releases": ["Unanswered", "No target-group security or guarantees to release — confirmed", "Yes — all required releases are agreed for completion", "Partly — some releases remain outstanding", "No — required releases are unresolved", "Not yet mapped"],
    "debt-completion-sequence": ["Unanswered", "Yes — all required steps are coordinated for completion", "Partly — steps agreed in principle", "No — a completion dependency is unresolved", "Not yet agreed"]
  };
  const guidance = {
    "debt-obligations": "Check facility and security documents, guarantees, hedging documents and Companies House charge records for each target-group company.",
    "debt-transaction-effect": "Read the change-of-control, mandatory prepayment, cancellation, default and consent terms against the proposed transaction.",
    "debt-payoff": "Obtain the lender's current written figure, including principal, interest, fees, break costs and any hedging close-out, plus the release conditions.",
    "debt-consent": "Confirm that a signed lender consent or waiver covers the transaction and is effective before the relevant deadline.",
    "debt-funding": "Check that committed completion funds cover the full payoff and can reach the lender when required.",
    "debt-releases": "Map each target-group charge, guarantee and other credit support to an agreed release. Record any post-completion register update separately.",
    "debt-completion-sequence": "Check the agreed funds flow, payment instructions, release delivery and any escrow or undertaking so no step depends on an unsecured promise."
  };
  const repaymentRequired = effect => effect === options["debt-transaction-effect"][2] || effect === options["debt-transaction-effect"][4];
  const consentRequired = effect => effect === options["debt-transaction-effect"][3] || effect === options["debt-transaction-effect"][4];
  const isDebt = () => current()?.id === issueId;
  const answer = id => answers[id] || "Unanswered";
  const isKnown = value => value !== "Unanswered";
  const visibleIds = () => {
    const existence = answer(ids[0]);
    const effect = answer(ids[1]);
    if (![options[ids[0]][2], options[ids[0]][3]].includes(existence)) return [ids[0]];
    const visible = [ids[0], ids[1]];
    if (!isKnown(effect) || [options[ids[1]][1], options[ids[1]][5]].includes(effect)) return visible;
    if (repaymentRequired(effect)) visible.push(ids[2]);
    if (consentRequired(effect)) visible.push(ids[3]);
    if (repaymentRequired(effect)) visible.push(ids[4], ids[5]);
    visible.push(ids[6]);
    return visible;
  };
  const debtAnswersComplete = () => visibleIds().every(id => isKnown(answer(id)));

  const debtRiskScore = () => {
    const existence = answer(ids[0]);
    if (existence === options[ids[0]][1]) return 1;
    if (existence === "Not yet checked") return 2;
    if (!isKnown(existence)) return 1;
    const possible = existence === options[ids[0]][3];
    const effect = answer(ids[1]);
    if (effect === options[ids[1]][1]) return possible ? 3 : 1;
    if (effect === options[ids[1]][5]) return 3;
    if (!isKnown(effect)) return possible ? 3 : 2;

    let score = 3;
    if (repaymentRequired(effect)) {
      const payoff = answer(ids[2]);
      const funding = answer(ids[4]);
      const releases = answer(ids[5]);
      if (payoff === options[ids[2]][2] || payoff === options[ids[2]][3] || payoff === options[ids[2]][4]) score = Math.max(score, 4);
      if (funding === options[ids[4]][2]) score = Math.max(score, 3);
      if (funding === options[ids[4]][3]) score = 5;
      if (funding === options[ids[4]][4]) score = Math.max(score, 4);
      if (releases === options[ids[5]][3] || releases === options[ids[5]][5]) score = Math.max(score, 4);
      if (releases === options[ids[5]][4]) score = 5;
    }
    if (consentRequired(effect)) {
      const consent = answer(ids[3]);
      if (consent === options[ids[3]][2]) score = Math.max(score, 3);
      if (consent === options[ids[3]][4]) score = Math.max(score, 4);
      if (consent === options[ids[3]][3]) score = 5;
    }
    const sequence = answer(ids[6]);
    if (sequence === options[ids[6]][2]) score = Math.max(score, 3);
    if (sequence === options[ids[6]][4]) score = Math.max(score, 4);
    if (sequence === options[ids[6]][3]) score = 5;

    const payoffReady = !repaymentRequired(effect) || answer(ids[2]) === options[ids[2]][1];
    const fundingReady = !repaymentRequired(effect) || answer(ids[4]) === options[ids[4]][1];
    const releasesReady = !repaymentRequired(effect) || [options[ids[5]][1], options[ids[5]][2]].includes(answer(ids[5]));
    const consentReady = !consentRequired(effect) || answer(ids[3]) === options[ids[3]][1];
    if (!possible && payoffReady && fundingReady && releasesReady && consentReady && sequence === options[ids[6]][1]) return 2;
    return score;
  };

  const previousRiskScore = riskScore;
  riskScore = function () { return isDebt() ? debtRiskScore() : previousRiskScore(); };

  const question = (issue, id) => {
    const detail = issue.key_questions.find(item => item.id === id);
    if (!detail) return "";
    return `<div class="question"><div class="question-top"><label for="${id}">${detail.question}</label><button class="info" type="button" aria-label="Guidance for this question">i<span class="tooltip">${guidance[id]}</span></button></div><select id="${id}">${options[id].map(value => `<option ${answer(id) === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>`;
  };
  const debtQuestions = issue => visibleIds().map(id => question(issue, id)).join("");

  // Each answer has one complete sentence; combinations are assembled from the visible questions.
  const summaryCopy = {
    "debt-obligations": [null,
      "No relevant target-group borrowing, guarantee or security has been identified after reviewing the finance documents and charge records.",
      "The target group has outstanding finance obligations or security.",
      "The target group may have finance obligations or security, but the records are incomplete.",
      "The target group's finance obligations and security have not yet been checked."],
    "debt-transaction-effect": [null,
      "The finance documents do not require repayment, lender consent or a waiver for this transaction.",
      "The transaction requires repayment or cancellation of a facility.",
      "The transaction requires lender consent or a waiver for the facility to continue.",
      "The transaction requires both repayment and lender consent or a waiver.",
      "The required lender steps remain unclear because the documents or transaction analysis are incomplete."],
    "debt-payoff": [null,
      "The lender has provided a current written payoff covering all amounts and release conditions.",
      "The written payoff is incomplete; figures or release conditions remain open.",
      "No written payoff has been obtained from the lender.",
      "A written payoff has not yet been requested from the lender."],
    "debt-consent": [null,
      "The required written lender consent or waiver is effective.",
      "The lender has agreed in principle, but its consent or waiver has not been signed.",
      "The lender has declined consent, or its required terms remain unmet.",
      "The required lender consent or waiver has not yet been sought."],
    "debt-funding": [null,
      "Sufficient committed funds and an agreed completion funds flow are in place.",
      "Funding is expected, but the commitment or funds flow is not final.",
      "There is a funding shortfall or timing gap for repayment.",
      "Funding for repayment has not yet been assessed."],
    "debt-releases": [null,
      "The documents confirm that no target-group security or guarantees need release.",
      "All required target-group releases are agreed for completion.",
      "Some target-group releases remain outstanding.",
      "The required target-group releases remain unresolved.",
      "The target-group security and guarantee perimeter has not yet been mapped."],
    "debt-completion-sequence": [null,
      "All required lender steps are coordinated for completion.",
      "The completion steps are agreed in principle but are not final.",
      "A lender-related completion dependency remains unresolved.",
      "The required lender steps have not yet been agreed for completion."]
  };
  const missingLabels = {
    "debt-obligations": "target group's finance position",
    "debt-transaction-effect": "transaction's effect under the finance documents",
    "debt-payoff": "written payoff",
    "debt-consent": "required lender consent or waiver",
    "debt-funding": "repayment funding",
    "debt-releases": "release package",
    "debt-completion-sequence": "completion sequence"
  };
  const joinList = items => items.length < 3 ? items.join(" and ") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
  const debtSummary = () => {
    const sentences = [];
    const missing = [];
    for (const id of visibleIds()) {
      const selected = answer(id);
      if (selected === "Unanswered") { missing.push(missingLabels[id]); continue; }
      const index = options[id].indexOf(selected);
      sentences.push(summaryCopy[id][index] || `The recorded answer about the ${missingLabels[id]} needs review.`);
    }
    if (missing.length) sentences.push(`The ${joinList(missing)} ${missing.length === 1 ? "remains" : "remain"} unconfirmed.`);
    return sentences.join(" ");
  };

  const debtImplications = () => {
    const existence = answer(ids[0]);
    const effect = answer(ids[1]);
    if (existence === options[ids[0]][1]) return ["No debt-specific completion step is currently indicated."];
    if (existence === "Unanswered" || existence === options[ids[0]][4]) return ["Review the finance documents and charge records before settling the transaction's lender requirements."];
    if (effect === "Unanswered" || effect === options[ids[1]][5]) return ["Confirm whether the transaction triggers repayment, lender consent or a waiver before fixing the completion plan."];
    if (effect === options[ids[1]][1]) return existence === options[ids[0]][3]
      ? ["The finance records remain incomplete, so the absence of a lender requirement is not yet confirmed."]
      : ["No repayment or lender-consent completion step is currently indicated."];

    const repay = repaymentRequired(effect);
    const consent = consentRequired(effect);
    const implications = [];
    const consentStatus = answer(ids[3]);
    if (consent) {
      const opening = repay ? "Repayment is required, and " : "";
      const consentText = consentStatus === options[ids[3]][1]
        ? "the effective lender consent or waiver should be retained with the completion evidence."
        : consentStatus === options[ids[3]][2]
          ? "agreement in principle still needs an effective written lender consent or waiver."
          : consentStatus === options[ids[3]][3]
            ? "the lender's refusal or unmet conditions leave the consent route unresolved."
            : consentStatus === options[ids[3]][4]
              ? "the required lender consent or waiver must be sought."
              : "the required lender consent or waiver remains unconfirmed.";
      implications.push(opening + (repay ? consentText : consentText.charAt(0).toUpperCase() + consentText.slice(1)));
    } else {
      implications.push("The required facility repayment or cancellation must be built into the transaction timetable.");
    }

    if (repay) {
      const payoff = answer(ids[2]);
      const funding = answer(ids[4]);
      if (funding === options[ids[4]][3]) implications.push("A funding shortfall or timing gap could prevent the required repayment.");
      else if (payoff !== options[ids[2]][1]) implications.push("The lender's full payoff and release conditions must be confirmed before the funds flow is finalised.");
      else if (funding !== options[ids[4]][1]) implications.push("Committed repayment funds and the completion funds flow remain unconfirmed.");
    }

    const sequence = answer(ids[6]);
    const sequenceOpen = sequence !== options[ids[6]][1];
    if (repay) {
      const releases = answer(ids[5]);
      const releasesOpen = ![options[ids[5]][1], options[ids[5]][2]].includes(releases);
      if (releasesOpen && sequenceOpen) implications.push("The release package and completion sequence remain open, creating a closing gap.");
      else if (releasesOpen) implications.push("Target-group security or guarantees may remain unless the release package is agreed and delivered.");
      else if (sequenceOpen) implications.push("Repayment and release steps need a final agreed completion sequence.");
    } else if (sequenceOpen) {
      implications.push("The lender consent or waiver must be effective on the agreed transaction timetable.");
    }
    return implications.slice(0, 3);
  };

  const actionCatalog = {
    D01: ["Finance schedule and trigger review", "Require a complete schedule of borrowing, guarantees and security, and identify the repayment or consent terms triggered by the transaction."],
    D02: ["Repayment covenant", "Require the seller to procure repayment or cancellation of specified facilities on or before completion."],
    D03: ["Payoff deliverable", "Require a current written lender statement covering all amounts due, payment details and release conditions."],
    D04: ["Lender consent or waiver", "Obtain effective written consent or a waiver covering the transaction where a facility will continue."],
    D05: ["Pre-completion covenant", "Govern lender engagement, changes to borrowing or security, and acceptance of lender conditions before completion."],
    D06: ["Alternative lender route", "If the proposed route fails, agree amended terms, refinancing, a different repayment route or a revised timetable."],
    D07: ["Funding and shortfall allocation", "Confirm committed repayment funds and specify who bears any payoff shortfall."],
    D08: ["Security and guarantee releases", "Require agreed releases, or a binding lender undertaking to deliver them against repayment, at completion."],
    D09: ["Completion funds flow", "Link lender payment, consent effectiveness and release delivery in a simultaneous completion process."],
    D10: ["Completion condition and longstop", "Make material lender steps conditions or completion deliverables, with an objective deadline and termination route where appropriate."],
    D11: ["Debt and price mechanism", "Define how principal, interest, fees, break costs and hedging amounts affect consideration without counting the payoff twice."],
    D12: ["Finance warranties and disclosure", "Cover facilities, security, amounts outstanding, defaults and required lender consents, with specific disclosure of exceptions."],
    D13: ["Charge-register update", "After actual repayment or release, arrange any appropriate Companies House record update."],
    D14: ["APA excluded liabilities", "In cases of asset sales, specify which finance liabilities the buyer assumes, exclude the others, and obtain any necessary creditor consent or novation."]
  };
  const priorityRank = { Required: 3, Recommended: 2, Consider: 1 };
  const actionOrder = ["D06", "D04", "D07", "D08", "D09", "D02", "D03", "D10", "D11", "D14", "D01", "D12", "D05", "D13"];
  const debtActions = (side = getTransactionSide()) => {
    const selected = new Map();
    const add = (id, buyer, seller, balanced) => {
      const priority = { Buyer: buyer, Seller: seller, Balanced: balanced }[side] || balanced;
      if (priority && (!selected.has(id) || priorityRank[priority] > priorityRank[selected.get(id)])) selected.set(id, priority);
    };
    const existence = answer(ids[0]);
    if (existence === options[ids[0]][1]) return [];
    if (existence === "Unanswered" || existence === options[ids[0]][4]) {
      add("D01", "Required", "Required", "Required");
    } else {
      const confirmed = existence === options[ids[0]][2];
      const effect = answer(ids[1]);
      const effectUnknown = effect === "Unanswered" || effect === options[ids[1]][5];
      add("D01", !confirmed || effectUnknown ? "Required" : "Recommended", !confirmed || effectUnknown ? "Required" : "Recommended", !confirmed || effectUnknown ? "Required" : "Recommended");
      if (confirmed) {
        add("D11", "Recommended", "Recommended", "Recommended");
        add("D12", "Recommended", "Required", "Recommended");
      }
      add("D14", "Recommended", "Consider", "Recommended");
      if (!effectUnknown && effect !== options[ids[1]][1]) {
        const repay = repaymentRequired(effect);
        const consent = consentRequired(effect);
        const payoff = answer(ids[2]);
        const funding = answer(ids[4]);
        const releases = answer(ids[5]);
        const sequence = answer(ids[6]);
        const consentStatus = answer(ids[3]);
        const consentOpen = consent && consentStatus !== options[ids[3]][1];
        const payoffOpen = repay && payoff !== options[ids[2]][1];
        const fundingOpen = repay && funding !== options[ids[4]][1];
        const releaseNeeded = repay && releases !== options[ids[5]][1];
        const releaseOpen = releaseNeeded && releases !== options[ids[5]][2];
        const sequenceOpen = sequence !== options[ids[6]][1];
        const hardBlock = (consent && consentStatus === options[ids[3]][3])
          || (repay && funding === options[ids[4]][3])
          || sequence === options[ids[6]][3];

        if (repay) {
          add("D02", "Required", "Required", "Required");
          add("D03", payoffOpen ? "Required" : "Recommended", payoffOpen ? "Required" : "Recommended", payoffOpen ? "Required" : "Recommended");
          if (fundingOpen) add("D07", "Required", funding === options[ids[4]][3] ? "Required" : "Recommended", funding === options[ids[4]][3] ? "Required" : "Recommended");
          if (releaseNeeded) add("D08", releaseOpen ? "Required" : "Recommended", releaseOpen ? "Required" : "Recommended", releaseOpen ? "Required" : "Recommended");
          add("D09", sequenceOpen ? "Required" : "Recommended", sequence === options[ids[6]][3] ? "Required" : "Recommended", sequence === options[ids[6]][3] ? "Required" : "Recommended");
          add("D13", "Consider", "Consider", "Consider");
          if (confirmed) add("D11", "Required", "Required", "Required");
        }
        if (consentOpen) add("D04", "Required", "Required", "Required");
        if (hardBlock) add("D06", "Required", "Required", "Required");
        if (consentOpen || payoffOpen || fundingOpen || releaseOpen || sequenceOpen) {
          add("D05", "Recommended", "Consider", "Recommended");
          add("D10", "Required", "Consider", "Recommended");
        }
      }
    }
    return [...selected.entries()]
      .map(([id, priority]) => ({ id, priority, title: actionCatalog[id][0], description: actionCatalog[id][1] }))
      .sort((left, right) => priorityRank[right.priority] - priorityRank[left.priority]
        || actionOrder.indexOf(left.id) - actionOrder.indexOf(right.id))
      .slice(0, 10);
  };

  const previousRenderPanel = renderPanel;
  renderPanel = function () {
    previousRenderPanel();
    if (!isDebt()) return;
    const card = document.querySelector(".content-grid > .card");
    if (!card) return;
    const heading = card.querySelector("h3");
    card.replaceChildren(heading);
    card.insertAdjacentHTML("beforeend", debtQuestions(current()));
    card.querySelectorAll("select").forEach(select => {
      select.onchange = event => {
        const id = event.target.id;
        answers[id] = event.target.value;
        if (id === ids[0] || id === ids[1]) {
          const index = ids.indexOf(id);
          ids.slice(index + 1).forEach(dependent => delete answers[dependent]);
        }
        DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
        renderPanel();
      };
    });
  };

  const previousRenderLogic = renderLogic;
  renderLogic = function (issue) {
    if (issue?.id !== issueId) return previousRenderLogic(issue);
    const logicCard = document.querySelector("#logic-card");
    document.querySelector("#recommendations-card")?.remove();
    logicCard.classList.add("coc-deal-logic");
    if (!debtAnswersComplete()) {
      logicCard.classList.add("logic-standby");
      logicCard.innerHTML = `<h3>Apply deal logic</h3><p>Turn the recorded facts into a clear transaction response.</p>`;
      return;
    }
    logicCard.classList.remove("logic-standby");
    const side = getTransactionSide();
    const actions = debtActions(side);
    const sidePicker = `<div class="logic-side-picker" aria-label="Transaction side selector"><button type="button" class="active" data-logic-side-toggle>${escapeLogicText(side)}</button></div>`;
    const actionMarkup = actions.length ? actions.map(({ id, priority, title, description }) => `<div class="logic-action" data-action-id="${escapeLogicText(id)}"><span class="logic-icon">◌</span><div><span class="logic-priority" data-level="${escapeLogicText(priority.toLowerCase())}">${escapeLogicText(priority)}</span><strong>${escapeLogicText(title)}</strong><span>${escapeLogicText(description)}</span></div></div>`).join("") : `<p>There are no active transaction actions on the information recorded.</p>`;
    const implications = debtImplications().map(item => `<li>${escapeLogicText(item)}</li>`).join("");
    const notes = (issue.notes || "").split(/\n\s*\n/).filter(Boolean).map(entry => `<div class="logic-note">${escapeLogicText(entry)}</div>`).join("");
    logicCard.innerHTML = `<h3>Apply deal logic</h3><section class="logic-section"><h4>Summary</h4><p class="logic-conclusion">${escapeLogicText(debtSummary())}</p></section><section class="logic-section"><h4>Key deal implications</h4><ul>${implications}</ul></section><section class="logic-section"><div class="logic-section-heading"><h4>Recommended actions</h4>${sidePicker}</div>${actionMarkup}</section>${notes ? `<section class="logic-section"><h4>Notes</h4>${notes}</section>` : ""}`;
    document.dispatchEvent(new CustomEvent("debt-facilities-logic-rendered"));
  };
})();
