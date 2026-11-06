/* Regulatory questionnaire: shared Threatened Litigation presentation; assessment deferred. */
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
  const previousRiskScore = riskScore;
  riskScore = function () { return isRegulatory(current()) ? assessRisk(answers) : previousRiskScore(); };
  const previousRenderLogic = renderLogic;
  renderLogic = function (issue) {
    if (!isRegulatory(issue)) return previousRenderLogic(issue);
    document.querySelector("#recommendations-card")?.remove();
    const card = document.querySelector("#logic-card");
    card.classList.add("coc-deal-logic", "logic-standby");
    card.innerHTML = `<h3>Apply deal logic</h3><p>${complete(answers) ? "Your responses have been recorded. Deal analysis will be added next." : "Answer all relevant questions to generate your deal analysis."}</p>`;
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
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, issue.summary, `Risk score: ${assessRisk(answers)}/5 — ${riskNames[assessRisk(answers) - 1]}`, "", "DILIGENCE ANSWERS", ...lines, "", "NOTE", "Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], {type: "text/plain"}));
    const link = document.createElement("a"); link.href = url; link.download = `${issue.id}-report.txt`; link.click(); URL.revokeObjectURL(url);
  };
})();
