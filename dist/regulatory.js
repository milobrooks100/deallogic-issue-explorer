/* Regulatory questionnaire, risk and analysis using shared Deal Map presentation. */
(() => {
  const issueId = "regulatory-licences-and-transaction-approvals";
  const isRegulatory = issue => issue?.id === issueId;
  const escape = escapeLogicText;
  const fields = {
  "reg-permissions": {
    "options": [
      [
        "yes",
        "Yes"
      ],
      [
        "no",
        "No"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Check licences, authorisations, registrations and permits for the relevant entities, activities and locations. Select No only after reviewing the requirements."
  },
  "reg-permission-issues": {
    "options": [
      [
        "none",
        "None identified"
      ],
      [
        "gaps",
        "Permission gaps"
      ],
      [
        "compliance",
        "Compliance issues"
      ],
      [
        "both",
        "Both"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Permission gaps include missing, expired or inadequate permissions, or the wrong licence holder. Compliance issues include breached conditions, threatened suspension or revocation, investigations and enforcement."
  },
  "reg-transaction-steps": {
    "options": [
      [
        "approval",
        "Prior approval"
      ],
      [
        "notification",
        "Mandatory notification"
      ],
      [
        "voluntary",
        "Voluntary clearance"
      ],
      [
        "none",
        "None identified"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "multiple": true,
    "guidance": "Check operating-permission changes, change of control, NSI and merger control, including overseas requirements. Prior approval means clearance before proceeding; Mandatory notification means a separate required filing; Voluntary clearance means an optional filing pursued or considered. None identified and Unknown are exclusive."
  },
  "reg-step-status": {
    "options": [
      [
        "completed",
        "All completed"
      ],
      [
        "progress",
        "In progress"
      ],
      [
        "not-started",
        "Not started"
      ],
      [
        "blocked",
        "Blocked"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "All completed means approvals are effective, filings made, and applicable waiting periods and conditions satisfied. Select Blocked for refusal, prohibition or an unmet condition preventing progress; otherwise use the least advanced step. Post-completion filings may not yet be due."
  },
  "reg-impact": {
    "options": [
      [
        "minimal",
        "Minimal"
      ],
      [
        "manageable",
        "Manageable"
      ],
      [
        "significant",
        "Significant"
      ],
      [
        "fundamental",
        "Fundamental"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Consider operating restrictions, penalties, costs, conditions and delays, including continuing effects of resolved issues. Fundamental means lawful completion or essential operations are threatened."
  },
  "reg-deadlines": {
    "options": [
      [
        "completed",
        "Already completed"
      ],
      [
        "yes",
        "Yes"
      ],
      [
        "partly",
        "Partly"
      ],
      [
        "no",
        "No"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Check outstanding steps, owners and dependencies against deadlines before completion, before operations start or after completion. Expected approval is not approval obtained."
  }
};
  const ids = Object.keys(fields);
  const exclusive = ["none", "unknown"];
  function valid(id, value) {
    const values = fields[id].options.map(([key]) => key);
    if (!fields[id].multiple) return values.includes(value);
    return Array.isArray(value) && value.length > 0 && new Set(value).size === value.length
      && value.every(item => values.includes(item))
      && (!value.some(item => exclusive.includes(item)) || value.length === 1);
  }
  function visibleIds(state) {
    const visible = [ids[0]];
    if (!valid(ids[0], state[ids[0]])) return visible;
    if (state[ids[0]] !== "no") {
      visible.push(ids[1]);
      if (!valid(ids[1], state[ids[1]])) return visible;
    }
    visible.push(ids[2]);
    if (!valid(ids[2], state[ids[2]])) return visible;
    const noSteps = state[ids[2]][0] === "none";
    if (!noSteps) {
      visible.push(ids[3]);
      if (!valid(ids[3], state[ids[3]])) return visible;
    }
    // A confirmed clean route can finish; uncertainty must continue.
    if (noSteps && (state[ids[0]] === "no" || (state[ids[0]] === "yes" && state[ids[1]] === "none"))) return visible;
    visible.push(ids[4]);
    if (!valid(ids[4], state[ids[4]])) return visible;
    visible.push(ids[5]);
    return visible;
  }
  const complete = state => visibleIds(state).every(id => valid(id, state[id]));
  function normalize(state) {
    const visible = visibleIds(state);
    Object.keys(state).forEach(id => {
      if (!visible.includes(id) || !valid(id, state[id])) delete state[id];
    });
  }
  function questionMarkup({id, question}) {
    const field = fields[id];
    const info = `<button class="info" type="button" aria-label="Guidance: ${escape(question)}">i<span class="tooltip" id="${id}-guidance" role="tooltip">${escape(field.guidance)}</span></button>`;
    if (field.multiple) return `<div class="question"><div class="question-top"><label id="${id}-label">${escape(question)}</label>${info}</div><div class="choice-grid" role="group" aria-labelledby="${id}-label" aria-describedby="${id}-guidance">${field.options.map(([value,label]) => `<label><input type="checkbox" data-reg-step value="${value}" ${(answers[id] || []).includes(value) ? "checked" : ""}> ${escape(label)}</label>`).join("")}</div></div>`;
    return `<div class="question"><div class="question-top"><label for="${id}">${escape(question)}</label>${info}</div><select id="${id}" aria-describedby="${id}-guidance"><option value="" ${!answers[id] ? "selected" : ""}>Unanswered</option>${field.options.map(([value,label]) => `<option value="${value}" ${answers[id] === value ? "selected" : ""}>${escape(label)}</option>`).join("")}</select></div>`;
  }
  // Draft rules: adjustments cannot erase protected minimums.
  function assessRisk(state) {
    const visible = visibleIds(state);
    const active = id => visible.includes(id) && valid(id, state[id]) ? state[id] : undefined;
    const [permissions, issues, steps = [], status, impact, deadlines] = ids.map(active);
    let score = 1, floor = 1;
    const minimum = n => { floor = Math.max(floor, n); };
    if (["gaps", "compliance", "both"].includes(issues)) {
      score = 3;
      minimum(issues === "compliance" ? 2 : 3);
    }
    if (steps.some(step => ["approval", "notification", "voluntary"].includes(step))) {
      score = Math.max(score, 2);
      minimum(2);
    }
    if (status === "not-started") {
      score += 1;
      if (steps.some(step => ["approval", "notification"].includes(step))) minimum(3);
    }
    if (status === "blocked") { score += 1; minimum(4); }
    if (impact === "minimal") score -= 1;
    if (impact === "significant") minimum(4);
    if (impact === "fundamental") minimum(5);
    if (deadlines === "partly") minimum(3);
    if (deadlines === "no") {
      score += 1;
      minimum(steps.includes("approval") || ["gaps", "both"].includes(issues) ? 4 : 3);
    }
    // A forecast earns no reduction. Completed steps need a fully assessed,
    // consistent record; a current permission gap retains its protected floor.
    const known = visible.every(id => valid(id, state[id])
      && (Array.isArray(state[id]) ? !state[id].includes("unknown") : state[id] !== "unknown"));
    const stepsAddressed = steps[0] === "none" || status === "completed";
    if (deadlines === "completed" && known && stepsAddressed) score -= 1;
    return Math.max(floor, Math.min(4, Math.max(1, score)));
  }
  const summaryCopy = {
    permissions: {
      yes: "The target requires regulatory permissions to operate.",
      no: "The recorded review identifies no regulatory permissions required for the target to operate.",
      unknown: "It is unknown whether the target requires regulatory permissions to operate."
    },
    issues: {
      none: "No issues with those permissions have been identified.",
      gaps: "Gaps in the target’s operating permissions have been identified.",
      compliance: "Compliance issues concerning the target’s operating permissions have been identified.",
      both: "Both permission gaps and compliance issues have been identified.",
      unknown: "The position under the target’s operating permissions is unknown."
    },
    status: {
      completed: "The identified transaction steps are reported to be completed, with applicable waiting periods and conditions for proceeding satisfied.",
      progress: "The identified transaction steps are in progress.",
      "not-started": "The identified transaction steps have not started.",
      blocked: "At least one identified transaction step is blocked.",
      unknown: "The status of the transaction steps is unknown."
    },
    impact: {
      minimal: "The likely impact on the target or deal is assessed as minimal.",
      manageable: "The likely impact on the target or deal is assessed as manageable.",
      significant: "The likely impact on the target or deal is assessed as significant.",
      fundamental: "The likely impact on the target or deal is assessed as fundamental.",
      unknown: "The likely impact on the target or deal is unknown."
    },
    deadlines: {
      completed: "All necessary steps are reported to have been completed.",
      yes: "All outstanding steps are expected to be completed by their applicable deadlines.",
      partly: "Only some outstanding steps are expected to be completed by their applicable deadlines.",
      no: "The outstanding steps cannot all be completed by their applicable deadlines.",
      unknown: "It is unknown whether all outstanding steps can be completed by their applicable deadlines."
    }
  };
  const implicationCopy = {
    clean: "No regulatory obstacle is identified on the reviewed facts; business or deal changes may require reassessment.",
    fundamental: "The deal may not deliver a lawfully operating business, putting its structure or viability in question.",
    significant: "Regulatory exposure may affect valuation, business continuity or deal terms.",
    gaps: "Affected activities may need to pause, reducing the business available at completion.",
    compliance: "Enforcement or operating restrictions may leave costs and liabilities to allocate between the parties.",
    scopeUnknown: "It remains unclear whether the business can continue under its existing permissions.",
    blocked: "The proposed deal may need an alternative structure unless the regulatory block is removed.",
    transactionUnknown: "Unconfirmed regulatory steps leave completion requirements and timing unclear.",
    approval: "Approval timing and conditions may determine completion timing or require changes to the deal.",
    notification: "Filing deadlines need clear ownership, including obligations falling after completion.",
    voluntary: "The parties must weigh clearance delays against the risk of proceeding without regulatory comfort.",
    stepsCompleted: "Approvals must cover the final deal structure, with all conditions for proceeding satisfied.",
    reconcile: "Conflicting answers prevent reliance on the reported resolution when assessing readiness.",
    missed: "Timing or operating plans may need to change; contractual protections cannot replace required approval.",
    partial: "Separate steps that prevent completion from those that can properly follow it.",
    planned: "Delivery remains a completion dependency, requiring clear responsibility, evidence and a fallback for delay.",
    timingUnknown: "The timetable remains untested until regulatory lead times and dependencies are established.",
    residual: "Remaining losses, restrictions or claims may still affect price and risk allocation.",
    verified: "Resolution needs evidence of implementation and any continuing conditions or monitoring obligations."
  };
  function buildAnalysis(state) {
    if (!complete(state)) return null;
    const visible = visibleIds(state);
    const [permissions, issues, steps, status, impact, deadlines] = ids.map(id => visible.includes(id) ? state[id] : undefined);
    const sentences = [summaryCopy.permissions[permissions]];
    if (visible.includes(ids[1])) sentences.push(summaryCopy.issues[issues]);
    if (steps[0] === "none") sentences.push("No regulatory steps for the transaction have been identified.");
    else if (steps[0] === "unknown") sentences.push("The regulatory steps applicable to the transaction are unknown.");
    else {
      const stepCopy = {approval: "prior regulatory approval", notification: "mandatory notification", voluntary: "voluntary clearance being pursued or considered"};
      const items = fields[ids[2]].options.filter(([key]) => steps.includes(key)).map(([key]) => stepCopy[key]);
      const listed = items.length === 1 ? items[0] : items.slice(0, -1).join(", ") + " and " + items.at(-1);
      sentences.push(`The transaction involves ${listed}.`);
    }
    if (visible.includes(ids[3])) sentences.push(summaryCopy.status[status]);
    if (!visible.includes(ids[4])) return {summary: sentences.join(" "), implications: [implicationCopy.clean]};
    sentences.push(summaryCopy.impact[impact], summaryCopy.deadlines[deadlines]);
    const inconsistent = deadlines === "completed" && (["gaps", "compliance", "both"].includes(issues)
      || (steps[0] !== "none" && status !== "completed"));
    if (inconsistent) sentences.push("The reported completion needs to be reconciled with the unresolved or unconfirmed position recorded above.");
    // Select at most one canonical implication per theme, rather than truncating
    // an arbitrary list and risking the loss of a serious finding.
    const implications = [];
    if (impact === "fundamental") implications.push(implicationCopy.fundamental);
    else if (impact === "significant") implications.push(implicationCopy.significant);
    else if (["gaps", "both"].includes(issues)) implications.push(implicationCopy.gaps);
    else if (issues === "compliance") implications.push(implicationCopy.compliance);
    else if (permissions === "unknown" || issues === "unknown") implications.push(implicationCopy.scopeUnknown);

    if (status === "blocked") implications.push(implicationCopy.blocked);
    else if (steps[0] === "unknown" || status === "unknown") implications.push(implicationCopy.transactionUnknown);
    else if (status === "completed") implications.push(implicationCopy.stepsCompleted);
    else if (steps.includes("approval")) implications.push(implicationCopy.approval);
    else if (steps.includes("notification")) implications.push(implicationCopy.notification);
    else if (steps.includes("voluntary")) implications.push(implicationCopy.voluntary);

    if (inconsistent) implications.push(implicationCopy.reconcile);
    else if (deadlines === "no") implications.push(implicationCopy.missed);
    else if (deadlines === "partly") implications.push(implicationCopy.partial);
    else if (deadlines === "yes") implications.push(implicationCopy.planned);
    else if (deadlines === "unknown") implications.push(implicationCopy.timingUnknown);
    else implications.push(["significant", "fundamental"].includes(impact) ? implicationCopy.residual : implicationCopy.verified);
    return {summary: sentences.join(" "), implications};
  }
  const priorityRank = { Required: 3, Recommended: 2, Consider: 1 };
  // Legal delivery and viability take precedence within the same priority label.
  const actionOrder = ["RG03", "RG04", "RG06", "RG12", "RG02", "RG01", "RG07", "RG08", "RG09", "RG10", "RG11", "RG05", "RG13"];
  function chooseActions(responses, side = "Balanced", limit = true) {
    if (!complete(responses)) return [];
    side = ["Buyer", "Seller", "Balanced"].includes(side) ? side : "Balanced";
    const visible = visibleIds(responses);
    const [permissions, issues, steps, status, impact, deadlines] = ids.map(id => visible.includes(id) ? responses[id] : undefined);
    if (!visible.includes(ids[4])) return []; // Confirmed clean early exits.
    const uncertain = visible.some(id => responses[id] === "unknown" || (Array.isArray(responses[id]) && responses[id].includes("unknown")));
    const knownIssue = ["gaps", "compliance", "both"].includes(issues);
    const material = ["significant", "fundamental"].includes(impact), fundamental = impact === "fundamental";
    const blocked = status === "blocked";
    const substantiveSteps = steps.some(step => ["approval", "notification", "voluntary"].includes(step));
    const stepsOpen = substantiveSteps && status !== "completed";
    const statutoryOpen = stepsOpen && steps.some(step => ["approval", "notification"].includes(step));
    const approvalOpen = steps.includes("approval") && status !== "completed";
    const voluntaryOpen = steps.includes("voluntary") && status !== "completed";
    const conflict = deadlines === "completed" && (knownIssue || (steps[0] !== "none" && status !== "completed"));
    // A reported cure cannot erase a still-recorded gap or an uncompleted approval.
    const workOpen = knownIssue || stepsOpen;
    const carryOver = ["partly", "no"].includes(deadlines) && workOpen;
    const provisional = uncertain && (steps[0] === "unknown" || deadlines !== "completed");
    const registry = window.DealLogicActionRegistry;
    const copy = (buyer, seller, balanced) => ({Buyer:buyer, Seller:seller, Balanced:balanced}[side]);
    const actions = [];
    const add = (id, buyer, seller = buyer, balanced = buyer) => {
      const base = registry.actionFor(issueId, "", "", id);
      if (base.availableSides && !base.availableSides.includes(side)) return;
      actions.push({...registry.forSide(base, side), priority:copy(buyer,seller,balanced)});
    };
    add("RG01", uncertain || material || blocked ? "Required" : "Recommended");
    if (status === "completed" || deadlines === "completed") add("RG02", "Required", conflict || material ? "Required" : "Recommended", conflict || material ? "Required" : "Recommended");
    if (knownIssue) add("RG03", "Required");
    if (stepsOpen || workOpen || provisional) add("RG04", statutoryOpen ? "Required" : "Recommended");
    if (voluntaryOpen) add("RG05", material || blocked ? "Required" : "Recommended", material || blocked ? "Required" : "Consider", material || blocked ? "Required" : "Recommended");
    if (approvalOpen || (knownIssue && material) || (fundamental && stepsOpen)) add("RG06", "Required", approvalOpen || fundamental ? "Required" : "Consider", approvalOpen || fundamental ? "Required" : "Recommended");
    if (workOpen) add("RG07", statutoryOpen || carryOver ? "Required" : "Recommended");
    if (stepsOpen || (knownIssue && ["partly", "no", "unknown"].includes(deadlines))) {
      const required = blocked || fundamental || deadlines === "no";
      add("RG08", "Required", required ? "Required" : "Recommended", required ? "Required" : "Recommended");
    }
    add("RG09", "Required", "Required", "Recommended");
    if (knownIssue && material) add("RG10", "Required", "Consider", "Recommended");
    if (material) add("RG11", fundamental ? "Required" : "Recommended");
    if (blocked || fundamental) add("RG12", "Required");
    if (stepsOpen && (steps.includes("approval") || steps.includes("voluntary")) && (material || blocked || ["partly", "no"].includes(deadlines))) add("RG13", "Consider");
    const sort = list => list.sort((a,b) => priorityRank[b.priority] - priorityRank[a.priority] || actionOrder.indexOf(a.id) - actionOrder.indexOf(b.id));
    if (!limit) return sort(actions);

    // Remove substantive overlap before priority trimming so useful Consider
    // actions can survive; the retained card includes the overlapping task.
    const absorb = (keepId, removeId, title, buyer, seller, balanced) => {
      const keep = actions.find(action => action.id === keepId), remove = actions.find(action => action.id === removeId);
      if (!keep || !remove) return;
      keep.title = title; keep.description = copy(buyer,seller,balanced);
      if (priorityRank[remove.priority] > priorityRank[keep.priority]) keep.priority = remove.priority;
      actions.splice(actions.indexOf(remove), 1);
    };
    absorb("RG06", "RG08", "Completion conditions and failed clearance",
      "Require objective regulatory completion conditions, a realistic longstop and defined withdrawal rights, distinguishing statutory requirements from protections the buyer may lawfully waive.",
      "Preserve mandatory approval conditions, limit additional milestones and buyer withdrawal rights, and set a realistic longstop with controlled extensions.",
      "Agree objective regulatory completion conditions, a realistic longstop and proportionate termination rights, distinguishing statutory requirements from waivable protections.");
    if (conflict) absorb("RG03", "RG02", "Verify and remedy regulatory issues",
      "Verify approvals and claimed remediation against the final transaction, reconcile conflicting records and require completion of outstanding permission or compliance work.",
      "Substantiate approvals and claimed remediation against the final transaction, correct conflicting records and arrange outstanding permission or compliance work.",
      "Verify approvals and claimed remediation against the final transaction, reconcile conflicting records and complete outstanding permission or compliance work.");
    // Stable sorting makes the cap deterministic: Consider is removed first,
    // then Recommended, and only then Required if more than nine remain.
    return sort(actions).slice(0, 9);
  }
  window.DealLogicRegulatoryActions = (responses, side) => chooseActions(responses, side);
  const actionsMarkup = actions => actions.length ? actions.map(action => `<div class="logic-action" data-action-id="${action.id}"><span class="logic-icon" aria-hidden="true"></span><div><span class="logic-priority" data-level="${action.priority.toLowerCase()}">${action.priority}</span><strong>${escape(action.title)}</strong><span>${escape(action.description)}</span></div></div>`).join("") : '<p>No issue-specific actions are indicated by the recorded answers.</p>';

  const legalNotes = [
  {
    "title": "Controller approval",
    "text": "Where the statutory controller regime applies, acquiring or increasing control before regulatory approval can be a criminal offence, even if the target’s operating permissions remain unchanged.",
    "source": "Financial Services and Markets Act 2000, section 191F",
    "url": "https://www.legislation.gov.uk/ukpga/2000/8/section/191F/data.html"
  },
  {
    "title": "NSI completion risk",
    "text": "A notifiable acquisition completed without approval, or contrary to the terms of a final order, is void; treat applicable approval and completion conditions as statutory requirements.",
    "source": "National Security and Investment Act 2021, section 13",
    "url": "https://www.legislation.gov.uk/ukpga/2021/25/section/13/data.html"
  },
  {
    "title": "Post-completion merger intervention",
    "text": "The absence of a mandatory notification requirement does not prevent a Competition and Markets Authority (CMA) investigation; the CMA may restrict integration or require the businesses to remain separate after completion.",
    "source": "CMA: interim measures in merger investigations",
    "url": "https://www.gov.uk/government/publications/interim-measures-and-derogations-guidance-and-templates/interim-measures-in-merger-investigations-summary-for-businesses"
  }
];
  const notesMarkup = () => legalNotes.map(note => `<div class="logic-note"><strong>${escape(note.title)}:</strong> ${escape(note.text)} <a href="${escape(note.url)}" target="_blank" rel="noopener noreferrer">${escape(note.source)}</a></div>`).join("");
  const previousRiskScore = riskScore;
  riskScore = function () { return isRegulatory(current()) ? assessRisk(answers) : previousRiskScore(); };
  const previousRenderLogic = renderLogic;
  renderLogic = function (issue) {
    if (!isRegulatory(issue)) return previousRenderLogic(issue);
    document.querySelector("#recommendations-card")?.remove();
    const card = document.querySelector("#logic-card");
    card.classList.add("coc-deal-logic");
    const analysis = buildAnalysis(answers);
    if (!analysis) {
      card.classList.add("logic-standby");
      card.innerHTML = '<h3>Apply Deal Lens</h3><p>Answer all relevant questions to generate your deal analysis.</p>';
      document.dispatchEvent(new CustomEvent("regulatory-logic-rendered"));
      return;
    }
    card.classList.remove("logic-standby");
    const side = getTransactionSide();
    card.innerHTML = `<h3>Apply Deal Lens</h3><section class="logic-section"><h4>Summary</h4><p class="logic-conclusion">${escape(analysis.summary)}</p></section><section class="logic-section"><h4>Key deal implications</h4><ul>${analysis.implications.map(text => `<li>${escape(text)}</li>`).join("")}</ul></section><section class="logic-section"><div class="logic-section-heading"><h4>Recommended actions</h4><div class="logic-side-picker" aria-label="Transaction side selector"><button type="button" class="active" data-logic-side-toggle>${escape(side)}</button></div></div>${actionsMarkup(chooseActions(answers, side))}</section><section class="logic-section"><h4>Notes</h4>${notesMarkup()}</section>`;
    document.dispatchEvent(new CustomEvent("regulatory-logic-rendered"));
  };
  function saveAnswer(id, value) {
    answers[id] = value;
    ids.slice(ids.indexOf(id) + 1).forEach(next => delete answers[next]);
    normalize(answers);
    DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
    renderPanel();
  }
  const previousRenderPanel = renderPanel;
  renderPanel = function () {
    if (isRegulatory(current())) {
      const before = JSON.stringify(answers);
      normalize(answers);
      if (before !== JSON.stringify(answers)) DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
    }
    previousRenderPanel();
    const issue = current();
    if (!isRegulatory(issue)) return;
    const card = document.querySelector(".content-grid > .card");
    if (!card) return;
    card.replaceChildren(card.querySelector("h3"));
    const visible = visibleIds(answers);
    card.insertAdjacentHTML("beforeend", issue.key_questions.filter(q => visible.includes(q.id)).map(questionMarkup).join(""));
    visible.filter(id => !fields[id].multiple).forEach(id => {
      document.getElementById(id).onchange = event => {
        saveAnswer(id, event.target.value);
      };
    });
    document.querySelectorAll("[data-reg-step]").forEach(input => input.onchange = () => {
      const value = input.value;
      let selected = [...(answers[ids[2]] || [])];
      if (input.checked) selected = exclusive.includes(value) ? [value] : [...selected.filter(v => !exclusive.includes(v)), value];
      else selected = selected.filter(v => v !== value);
      saveAnswer(ids[2], fields[ids[2]].options.map(([key]) => key).filter(key => selected.includes(key)));
      document.querySelector(`[data-reg-step][value="${value}"]`)?.focus();
    });
  };
  const previousExportReport = exportReport;
  exportReport = function () {
    const issue = current();
    if (!isRegulatory(issue)) return previousExportReport();
    normalize(answers);
    const visible = visibleIds(answers);
    const lines = issue.key_questions.filter(q => visible.includes(q.id)).map(({id, question}) => {
      const selected = fields[id].multiple ? answers[id] || [] : [answers[id]];
      const labels = fields[id].options.filter(([key]) => selected.includes(key)).map(([,label]) => label);
      return `- ${question}\n  Response: ${labels.join("; ") || "Unanswered"}`;
    });
    const analysis = buildAnalysis(answers);
    const analysisLines = analysis ? ["", "SUMMARY", analysis.summary, "", "KEY DEAL IMPLICATIONS", ...analysis.implications.map(text => `- ${text}`)] : [];
    const selected = analysis ? chooseActions(answers, getTransactionSide()) : [];
    const actionLines = analysis ? ["", `RECOMMENDED ACTIONS — ${getTransactionSide()}`, ...(selected.length ? selected.map(action => `- ${action.priority}: ${action.title}\n  ${action.description}`) : ["No issue-specific actions are indicated by the recorded answers."])] : [];
    const noteLines = analysis ? ["", "LEGAL NOTES", ...legalNotes.map(note => `${note.title}: ${note.text}\nSource: ${note.source} — ${note.url}`)] : [];
    const report = ["DEAL LENS ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, issue.summary, `Risk score: ${assessRisk(answers)}/5 — ${riskNames[assessRisk(answers) - 1]}`, "", "DILIGENCE ANSWERS", ...lines, ...analysisLines, ...actionLines, ...noteLines, "", "NOTE", "Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], {type: "text/plain"}));
    const link = document.createElement("a"); link.href = url; link.download = `${issue.id}-report.txt`; link.click(); URL.revokeObjectURL(url);
  };
})();
