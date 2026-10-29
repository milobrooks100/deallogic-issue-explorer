/* Share ownership: one rule engine drives risk, prose and SPA actions. */
(() => {
  const issueId = "share-ownership-transfer-restrictions";
  const rank = { Required: 3, Recommended: 2, Consider: 1 };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const join = items => items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
  const isShare = issue => issue?.id === issueId;
  const topic = () => window.DealLogicActionRegistry.byTopic.get(issueId);

  // Persist human-readable choices, matching existing Hub response snapshots.
  // Ignore obsolete values; positive facts take precedence over stale "none".
  const readAnswers = (input, issue) => Object.fromEntries(issue.key_questions.map(question => {
    const choices = question.answer_options;
    const raw = input[question.id];
    const stateFor = label => Object.keys(choices).find(key => choices[key] === label);
    if (!question.multiple) return [question.id, stateFor(raw) || "unanswered"];
    if (!Array.isArray(raw) || !raw.length) return [question.id, []];
    const states = [...new Set(raw.map(stateFor).filter(Boolean))];
    const positives = states.filter(state => !["none", "unknown"].includes(state));
    return [question.id, positives.length ? positives : states.includes("unknown") ? ["unknown"] : states.includes("none") ? ["none"] : ["unknown"]];
  }));

  const sellerCopy = {
    SO08: "Give seller-specific SPA warranties reflecting each seller's actual title and signing capacity. Identify any nominee or trust arrangement and negotiate appropriate scope without promising another seller's ownership.",
    SO09: "Disclose the specific gaps, arrangements and restrictions clearly against the SPA warranties, with the evidence and agreed solution. Do not rely on disclosure to cure title or bind a third-party right holder.",
    SO11: "Limit SPA conditions to material unresolved title or transfer dependencies, with objective evidence of satisfaction, proportionate efforts obligations and an agreed longstop and termination route.",
    SO12: "If an identified title conflict or claim needs indemnity protection, limit the SPA indemnity to that exposure, with agreed losses, cap, duration and claim conduct. Resist double recovery and overlapping price deductions; resolve the ability to transfer title first."
  };
  const balancedCopy = {
    SO11: "Use objective SPA conditions or completion deliverables for material unresolved title, release or transfer steps. Agree who progresses each step, the evidence of satisfaction, a realistic longstop and a defined termination route.",
    SO12: "Allocate any identified residual title conflict or claim through a targeted SPA indemnity with agreed losses, limits and claim conduct. Avoid double recovery and use security only where justified; first resolve the ability to transfer title."
  };

  const assess = (input = {}, side = "Balanced", issue = current()) => {
    const values = readAnswers(input, issue);
    const register = values["share-register"], evidence = values["share-evidence"];
    const interests = values["share-interests"], restrictions = values["share-restrictions"], readiness = values["share-readiness"];
    const ready = readiness === "ready";
    const interestUnknown = !interests.length || interests.includes("unknown");
    const restrictionUnknown = !restrictions.length || restrictions.includes("unknown");
    const authorityNeeded = interests.includes("nominee") || interests.includes("representative");
    const securityPresent = interests.includes("security");
    const adverseClaim = interests.includes("claim");
    const titleConflict = register === "conflict" || evidence === "conflict" || adverseClaim;
    const certificateMissing = ["certificate", "both"].includes(evidence);
    const evidenceGap = ["incomplete", "missing"].includes(register) || ["gaps", "both"].includes(evidence);
    const restrictionsPresent = restrictions.some(state => !["none", "unknown"].includes(state));
    const holderMechanics = restrictions.includes("tagdrag") || restrictions.includes("other");
    const blocked = readiness === "blocked";
    const unverified = ["unknown", "unanswered"].includes(register) || ["unknown", "unanswered"].includes(evidence) || interestUnknown || restrictionUnknown;
    const expresslyUnchecked = register === "unknown" || evidence === "unknown" || interests.includes("unknown") || restrictions.includes("unknown");
    const dependency = authorityNeeded || securityPresent || restrictionsPresent;
    const facts = {
      always: true, titleConflict, certificateMissing, authorityNeeded, securityPresent, restrictionsPresent, holderMechanics,
      reviewNeeded: titleConflict || evidenceGap || unverified || blocked,
      disclosureNeeded: titleConflict || evidenceGap || certificateMissing || dependency,
      materialOpen: titleConflict || evidenceGap || blocked || (!ready && (dependency || unverified))
    };
    const complete = issue.key_questions.every(question => question.multiple ? values[question.id].length > 0 : values[question.id] !== "unanswered");
    let risk = 2;
    let rationale = "Ownership and transfer requirements have not yet been fully verified.";
    if (adverseClaim || blocked) {
      risk = 5;
      rationale = adverseClaim ? "An adverse ownership claim or disputed authority needs resolution before relying on the transfer." : "A required ownership or transfer step currently blocks the proposed completion timetable.";
    } else if (titleConflict) {
      risk = 4;
      rationale = "Ownership records conflict; certificate replacement or a readiness answer cannot resolve that conflict.";
    } else if (evidenceGap || expresslyUnchecked || (complete && unverified) || (!ready && dependency) || (readiness === "pending" && !certificateMissing)) {
      risk = 3;
      rationale = "Evidence or transfer steps remain open; verify and resolve the actual completion dependencies.";
    } else if (complete && ready && !certificateMissing && !unverified) {
      risk = 1;
      rationale = "The recorded ownership evidence agrees and the identified transfer steps are ready for completion.";
    } else if (certificateMissing) {
      rationale = "Missing certificates are an evidence gap; the other recorded facts do not establish conflicting title.";
    }

    const sentences = [];
    const registerCopy = {
      clear: "The register of members reconciles with the sellers, share classes and numbers in the sale schedule.",
      incomplete: "The ownership records are incomplete or out of date, so the sale schedule still needs verification.",
      missing: "No current register of members is available, so the registered ownership position remains unverified.",
      conflict: "The ownership records conflict over the sale shares; the sellers' title needs to be resolved.",
      unknown: "The register of members has not yet been checked against the sale schedule.",
      unanswered: "The registered ownership position has not yet been recorded."
    };
    const evidenceCopy = {
      clear: "The certificates or applicable ownership evidence are reported to reconcile with those records.",
      certificate: titleConflict ? "Share certificates are also missing; that evidence gap is separate from the recorded title conflict and does not resolve it." : "Only share certificates are missing; the other title evidence agrees, so the certificate gap alone does not establish invalid ownership.",
      gaps: "Supporting ownership evidence is missing or incomplete; that gap does not itself establish invalid ownership.",
      both: "Share certificates and other supporting evidence are missing; these are evidence gaps, not proof of invalid ownership.",
      conflict: "The supporting ownership documents conflict with the ownership records and need substantive reconciliation.",
      unknown: "The supporting ownership evidence has not yet been checked.",
      unanswered: "The supporting ownership evidence has not yet been recorded."
    };
    sentences.push(registerCopy[register], evidenceCopy[evidence]);
    const arrangements = [];
    if (interests.includes("nominee")) arrangements.push("a nominee, trust or separate beneficial owner");
    if (interests.includes("representative")) arrangements.push("a personal representative, attorney or other authorised signatory");
    if (interests.includes("security")) arrangements.push("security over the sale shares");
    if (interests.includes("claim")) arrangements.push("an adverse ownership claim or disputed authority");
    if (arrangements.length) sentences.push(`The recorded position involves ${join(arrangements)}.`);
    else sentences.push(interestUnknown ? "Beneficial interests, seller authority and third-party claims remain unverified." : "The sellers are recorded as legal and beneficial owners, with no identified claims or security over the sale shares.");
    const engaged = restrictions.filter(state => !["none", "unknown"].includes(state)).map(state => ({
      board: "board approval or registration discretion", preemption: "transfer pre-emption or first-refusal rights", consent: "shareholder or investor consent", tagdrag: "tag-along or drag-along procedures", other: "lock-in, permitted-transfer or adherence conditions"
    }[state]));
    sentences.push(engaged.length ? `The proposed transfer engages ${join(engaged)}.` : restrictionUnknown ? "The articles and shareholder agreement have not yet been cleared for this transfer." : "Review of the articles and shareholder agreement has identified no engaged transfer restriction.");
    if (ready) sentences.push(titleConflict || evidenceGap || unverified ? "Completion readiness is recorded, but the unresolved title evidence or transfer analysis still needs verification." : "All identified evidence and transfer steps are recorded as effective or documented for completion.");
    else if (readiness === "pending") sentences.push("Required documents, notices or approvals remain outstanding for completion.");
    else if (blocked) sentences.push("A required ownership or transfer step is refused, disputed or cannot be completed on the proposed timetable.");
    else sentences.push("Readiness of the required ownership and transfer steps has not yet been assessed.");

    const implications = [];
    if (titleConflict) implications.push("Resolve the actual title conflict before completion; a lost-certificate indemnity, disclosure or SPA warranty does not cure it.");
    else if (evidenceGap || unverified) implications.push("Verify the registered holders and supporting evidence before finalising the SPA sale schedule; missing documents alone do not prove invalid ownership.");
    else if (certificateMissing) implications.push("Agree the certificate replacement or loss-evidence package as a completion deliverable without presuming defective ownership.");
    if (blocked) implications.push("Revisit the completion timetable and objective conditions; an indemnity cannot supply a missing transfer right.");
    else if (dependency) implications.push(ready ? "Carry the documented authority, releases and transfer steps into the SPA completion schedule and deliver the agreed evidence." : "Obtain the necessary authority, releases and right-holder approvals before the transfer deadline; agreed-in-principle steps remain open.");
    if (restrictions.includes("preemption") || restrictions.includes("tagdrag")) implications.push("Check the actual right holders, thresholds and notice periods; board approval alone cannot waive another holder's rights.");
    if (implications.length < 3) implications.push("Coordinate executed transfers, board registration steps and applicable Stamp Duty formalities, including any lawful interim rights pending registration.");

    // The structured issue rules are executable; no answer-permutation table.
    const matchedRules = issue.decision_rules.filter(rule => rule.when.operator === "equals" && facts[rule.when.fact_id] === rule.when.value);
    const selected = new Map();
    for (const rule of matchedRules) {
      let priority = rule.then.priority_by_side[side] || rule.then.priority_by_side.Balanced;
      if (ready && ["replace-missing-certificates", "document-seller-authority", "release-sale-share-security", "clear-transfer-restrictions", "implement-holder-mechanics"].includes(rule.id)) priority = "Recommended";
      for (const id of rule.then.action_ids) if (!selected.has(id) || rank[priority] > rank[selected.get(id)]) selected.set(id, priority);
    }
    const actions = topic().actions.filter(action => selected.has(action.id)).map(action => ({
      ...action, priority: selected.get(action.id), description: (side === "Seller" ? sellerCopy[action.id] : side === "Balanced" ? balancedCopy[action.id] : null) || action.description
    })).sort((a, b) => rank[b.priority] - rank[a.priority]);
    return { risk, rationale, summary: sentences.join(" "), implications: implications.slice(0, 3), actions, complete, values, facts, matchedRuleIds: matchedRules.map(rule => rule.id) };
  };

  const previousRisk = riskScore;
  riskScore = function () { return isShare(current()) ? assess(answers).risk : previousRisk(); };

  const questionMarkup = (question, result) => {
    const state = result.values[question.id];
    const info = `<button class="info" type="button" aria-label="Guidance for ${esc(question.question)}">i<span class="tooltip">${esc(question.purpose)}</span></button>`;
    if (question.multiple) return `<fieldset class="question share-choice-question"><legend>${esc(question.question)}</legend>${info}<div class="choice-grid">${Object.entries(question.answer_options).map(([key, label]) => `<label><input type="checkbox" data-share-question="${question.id}" value="${key}" ${state.includes(key) ? "checked" : ""}> ${esc(label)}</label>`).join("")}</div><p class="response-note">Select all that apply, or choose one of the exclusive responses.</p></fieldset>`;
    return `<div class="question"><div class="question-top"><label for="${question.id}">${esc(question.question)}</label>${info}</div><select id="${question.id}"><option value="Unanswered">Unanswered</option>${Object.entries(question.answer_options).map(([key, label]) => `<option value="${esc(label)}" ${state === key ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></div>`;
  };

  const updateAnswer = (input, issue, id, value, checked = true) => {
    const question = issue.key_questions.find(item => item.id === id);
    if (!question) return input;
    const next = { ...input };
    if (!question.multiple) {
      next[id] = Object.values(question.answer_options).includes(value) ? value : "Unanswered";
    } else {
      if (!question.answer_options[value]) return input;
      const existing = readAnswers(input, issue)[id];
      const remaining = existing.filter(key => key !== value && !["none", "unknown"].includes(key));
      const keys = checked ? ["none", "unknown"].includes(value) ? [value] : [...remaining, value] : existing.filter(key => key !== value);
      next[id] = keys.map(key => question.answer_options[key]);
    }
    // A changed factual basis invalidates the earlier completion-readiness answer.
    if (id !== "share-readiness") delete next["share-readiness"];
    return next;
  };

  const previousPanel = renderPanel;
  renderPanel = function () {
    previousPanel();
    if (!isShare(current())) return;
    const issue = current(), result = assess(answers);
    const card = document.querySelector(".content-grid > .card");
    if (!card) return;
    card.replaceChildren(card.querySelector("h3"));
    card.insertAdjacentHTML("beforeend", issue.key_questions.map(question => questionMarkup(question, result)).join(""));
    const saveAnswer = (id, value, checked) => {
      answers = updateAnswer(answers, issue, id, value, checked);
      DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
      renderPanel();
      // Re-rendering preserves current risk, logic and Hub selection. Restore focus.
      const control = value && issue.key_questions.find(q => q.id === id)?.multiple
        ? cardSelector(id, value) : `#${id}`;
      document.querySelector(control)?.focus();
    };
    card.querySelectorAll("select").forEach(select => { select.onchange = event => saveAnswer(event.target.id, event.target.value); });
    card.querySelectorAll("[data-share-question]").forEach(checkbox => { checkbox.onchange = event => saveAnswer(event.target.dataset.shareQuestion, event.target.value, event.target.checked); });
    const wrap = document.querySelector(".risk-wrap");
    if (wrap) {
      const note = document.createElement("p"); note.className = "risk-outcome"; note.textContent = result.rationale; wrap.append(note);
    }
  };
  const cardSelector = (id, value) => `[data-share-question="${id}"][value="${value}"]`;

  const previousLogic = renderLogic;
  renderLogic = function (issue) {
    if (!isShare(issue)) return previousLogic(issue);
    const result = assess(answers, getTransactionSide(), issue);
    const card = document.querySelector("#logic-card");
    document.querySelector("#recommendations-card")?.remove();
    card.classList.add("coc-deal-logic");
    card.classList.toggle("logic-standby", !result.complete);
    if (!result.complete) {
      card.innerHTML = '<h3>Apply deal logic</h3><p>Turn the recorded facts into a clear transaction response.</p>';
      return;
    }
    const side = getTransactionSide();
    const picker = `<div class="logic-side-picker" aria-label="Transaction side selector"><button type="button" class="active" data-logic-side-toggle>${esc(side)}</button></div>`;
    const actions = result.actions.map(action => `<div class="logic-action" data-action-id="${action.id}" data-action-key="${action.id}"><span class="logic-icon" data-original-icon="◌" data-vector="true"><i data-lucide="${action.icon}" aria-hidden="true"></i></span><div><span class="logic-priority" data-level="${action.priority.toLowerCase()}">${action.priority}</span><strong>${esc(action.title)}</strong><span>${esc(action.description)}</span></div></div>`).join("");
    const notes = issue.notes.split(/\n\s*\n/).map(note => `<div class="logic-note">${esc(note)}</div>`).join("");
    card.innerHTML = `<h3>Apply deal logic</h3><section class="logic-section"><h4>Summary</h4><p class="logic-conclusion">${esc(result.summary)}</p></section><section class="logic-section"><h4>Key deal implications</h4><ul>${result.implications.map(text => `<li>${esc(text)}</li>`).join("")}</ul></section><section class="logic-section"><div class="logic-section-heading"><h4>Recommended actions</h4>${picker}</div>${actions}</section><section class="logic-section"><h4>Notes</h4><div class="logic-note">Priorities describe transaction recommendations for the selected side, rather than statutory requirements.</div>${notes}</section>`;
    document.dispatchEvent(new CustomEvent("share-ownership-logic-rendered"));
  };

  const previousExport = exportReport;
  exportReport = function () {
    if (!isShare(current())) return previousExport();
    const issue = current(), side = getTransactionSide(), result = assess(answers, side, issue);
    const responses = issue.key_questions.map(question => `- ${question.question}\n  Response: ${Array.isArray(answers[question.id]) ? answers[question.id].join("; ") || "Unanswered" : answers[question.id] || "Unanswered"}`);
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, issue.jurisdiction.primary, `Perspective: ${side}`, `Risk score: ${result.risk}/5 — ${riskNames[result.risk - 1]}`, result.rationale, "", "DILIGENCE ANSWERS", ...responses, "", "DEAL SUMMARY", result.summary, "", "KEY DEAL IMPLICATIONS", ...result.implications, "", result.complete ? "RECOMMENDED ACTIONS" : "PROVISIONAL ACTIONS — complete the five questions before relying on these recommendations", ...result.actions.map(action => `- ${action.priority}: ${action.title}\n  ${action.description}`), "", "LEGAL NOTES", issue.notes, "", "SOURCES", ...issue.sources.map(source => `${source.title}: ${source.url}`), "", "Prototype content only. Review and tailor for the transaction."].join("\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain" }));
    const link = document.createElement("a"); link.href = url; link.download = `${issueId}-report.txt`; link.click(); URL.revokeObjectURL(url);
  };
  window.DealLogicShareOwnership = { assess, readAnswers, updateAnswer };
})();
