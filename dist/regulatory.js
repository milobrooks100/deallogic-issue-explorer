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
      card.innerHTML = '<h3>Apply deal logic</h3><p>Answer all relevant questions to generate your deal analysis.</p>';
      return;
    }
    card.classList.remove("logic-standby");
    card.innerHTML = `<h3>Apply deal logic</h3><section class="logic-section"><h4>Summary</h4><p class="logic-conclusion">${escape(analysis.summary)}</p></section><section class="logic-section"><h4>Key deal implications</h4><ul>${analysis.implications.map(text => `<li>${escape(text)}</li>`).join("")}</ul></section>`;
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
        document.getElementById(id)?.focus();
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
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, issue.summary, `Risk score: ${assessRisk(answers)}/5 — ${riskNames[assessRisk(answers) - 1]}`, "", "DILIGENCE ANSWERS", ...lines, ...analysisLines, "", "NOTE", "Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], {type: "text/plain"}));
    const link = document.createElement("a"); link.href = url; link.download = `${issue.id}-report.txt`; link.click(); URL.revokeObjectURL(url);
  };
})();
