/* Data Protection questionnaire: Threatened Litigation form and shared panel template. */
(() => {
  const issueId = "compliance-gaps-and-personal-data-breaches";
  const isDataProtection = issue => issue?.id === issueId;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fields = {
  "dp-issue": {
    "options": [
      [
        "yes",
        "Yes"
      ],
      [
        "suspected",
        "Suspected"
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
    "guidance": "Examples include data leaks, unlawful marketing, excessive retention, unanswered access requests or missing supplier terms. Check diligence findings, incident logs and compliance reviews."
  },
  "dp-type": {
    "options": [
      [
        "compliance-gap",
        "Compliance gap"
      ],
      [
        "personal-data-breach",
        "Personal data breach"
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
    "guidance": "A compliance gap concerns how data is managed; a personal data breach involves its loss, destruction, alteration, unauthorised disclosure or access. Check the findings and incident records."
  },
  "dp-ongoing": {
    "options": [
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
    "guidance": "Check whether the affected processing has stopped and any exposed or unavailable data has been secured or restored. Confirm the position with those managing the response."
  },
  "dp-notifications": {
    "options": [
      [
        "all-made",
        "All made"
      ],
      [
        "some-outstanding",
        "Some outstanding"
      ],
      [
        "none-made",
        "None made"
      ],
      [
        "none-required",
        "None required"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Check the notification assessment and records of notices to the Information Commissioner’s Office (ICO), affected individuals or relevant controllers, including dates. Select None required only following an assessment."
  },
  "dp-proceedings": {
    "options": [
      [
        "complaints",
        "Complaints"
      ],
      [
        "claims",
        "Claims"
      ],
      [
        "regulatory-enquiries",
        "Regulatory enquiries"
      ],
      [
        "none",
        "None"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Review complaints logs, legal correspondence and communications with the Information Commissioner’s Office (ICO) or other regulators. Include resolved matters with outstanding obligations or exposure.",
    "multiple": true
  },
  "dp-impact": {
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
    "guidance": "Review estimated costs, potential liabilities, business disruption and restrictions on using data. Assess their effect on the target’s operations, value and the completion timetable."
  },
  "dp-remediation": {
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
    "guidance": "Review the remediation plan, outstanding tasks, responsible owners and deadlines. Check that the necessary resources and any third-party cooperation are available."
  }
};
  const ids = Object.keys(fields);
  const valid = (id, value) => fields[id].multiple
    ? Array.isArray(value) && value.length > 0 && value.every(v => fields[id].options.some(([key]) => key === v)) && new Set(value).size === value.length && (!value.some(v => ["none", "unknown"].includes(v)) || value.length === 1)
    : fields[id].options.some(([key]) => key === value);
  const visibleIds = responses => {
    const visible = [];
    for (const id of ids) {
      if (id === "dp-notifications" && !["yes", "partly"].includes(responses["dp-ongoing"]) && !["personal-data-breach", "both", "unknown"].includes(responses["dp-type"])) continue;
      visible.push(id);
      if (!valid(id, responses[id]) || (id === "dp-issue" && responses[id] === "no")) break;
    }
    return visible;
  };
  const normalize = responses => {
    const visible = visibleIds(responses);
    ids.forEach(id => { if (!visible.includes(id) || !valid(id, responses[id])) delete responses[id]; });
  };
  const complete = responses => visibleIds(responses).every(id => valid(id, responses[id]));
  const labelFor = (id, value) => {
    const label = key => fields[id].options.find(([v]) => key === v)?.[1] || "Unanswered";
    return fields[id].multiple ? (Array.isArray(value) && value.length ? value.map(label).join(", ") : "Unanswered") : label(value);
  };
  // Use the litigation question/top/info/select structure with the shared styles.
  const questionMarkup = ({id, question}) => {
    const field = fields[id], label = question;
    const info = `<button class="info" type="button" aria-label="${escape(`Guidance: ${question}`)}">i<span class="tooltip" role="tooltip">${escape(field.guidance)}</span></button>`;
    if (field.multiple) return `<div class="question" role="group" aria-labelledby="${id}-label"><div class="question-top"><label id="${id}-label">${escape(label)}</label>${info}</div><div class="choice-grid">${field.options.map(([key,text]) => `<label><input type="checkbox" data-dp-choice value="${key}" ${(answers[id] || []).includes(key) ? "checked" : ""}> ${escape(text)}</label>`).join("")}</div></div>`;
    return `<div class="question"><div class="question-top"><label for="${id}">${escape(label)}</label>${info}</div><select id="${id}"><option value="">Unanswered</option>${field.options.map(([key,text]) => `<option value="${key}" ${answers[id] === key ? "selected" : ""}>${escape(text)}</option>`).join("")}</select></div>`;
  };
  // Recompute from reachable valid answers; Unknown never adds points or a floor.
  const assessRisk = responses => {
    const visible = visibleIds(responses);
    const active = id => visible.includes(id) && valid(id, responses[id]) ? responses[id] : undefined;
    const existence = active("dp-issue");
    if (!existence || existence === "no") return 1;
    const ongoing = active("dp-ongoing");
    const notifications = active("dp-notifications");
    const proceedings = active("dp-proceedings") || [];
    const impact = active("dp-impact");
    const remediation = active("dp-remediation");
    let score = existence === "yes" ? 3 : existence === "suspected" ? 2 : 1;
    let floor = ["yes", "suspected"].includes(existence) ? 2 : 1;
    const atLeast = value => { floor = Math.max(floor, value); };
    if (ongoing === "yes") { score += 1; atLeast(3); }
    if (ongoing === "partly") atLeast(3);
    if (["some-outstanding", "none-made"].includes(notifications)) { score += 1; atLeast(3); }
    if (proceedings.some(value => ["complaints", "claims", "regulatory-enquiries"].includes(value))) atLeast(3);
    if (impact === "minimal") score -= 1;
    if (impact === "significant") atLeast(4);
    if (impact === "fundamental") atLeast(5);
    if (["partly", "no"].includes(remediation)) atLeast(3);
    const notificationsAddressed = !visible.includes("dp-notifications") || ["all-made", "none-required"].includes(notifications);
    if (remediation === "completed" && ongoing === "no" && notificationsAddressed && proceedings.includes("none")) score -= 1;
    // Only an explicit Fundamental impact can produce 5; reductions cannot erase floors.
    return Math.max(floor, Math.min(4, score));
  };
  const previousRiskScore = riskScore;
  riskScore = function () { return isDataProtection(current()) ? assessRisk(answers) : previousRiskScore(); };
  const previousRenderPanel = renderPanel;
  renderPanel = function () {
    if (isDataProtection(current())) {
      const before = JSON.stringify(answers);
      normalize(answers);
      if (JSON.stringify(answers) !== before) DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
    }
    previousRenderPanel();
    const issue = current();
    if (!isDataProtection(issue)) return;
    const factsCard = document.querySelector(".content-grid > .card");
    if (!factsCard) return;
    const heading = factsCard.querySelector("h3");
    factsCard.replaceChildren(heading);
    factsCard.insertAdjacentHTML("beforeend", issue.key_questions.filter(q => visibleIds(answers).includes(q.id)).map(questionMarkup).join(""));
    const save = (id, value) => {
      answers[id] = value;
      ids.slice(ids.indexOf(id) + 1).forEach(next => delete answers[next]);
      normalize(answers);
      DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
      renderPanel();
    };
    visibleIds(answers).filter(id => !fields[id].multiple).forEach(id => {
      document.getElementById(id).onchange = event => save(id, event.target.value);
    });
    document.querySelectorAll("[data-dp-choice]").forEach(input => input.onchange = () => {
      const previous = answers["dp-proceedings"] || [];
      const value = input.checked
        ? (["none", "unknown"].includes(input.value) ? [input.value] : [...previous.filter(v => !["none", "unknown"].includes(v)), input.value])
        : previous.filter(v => v !== input.value);
      save("dp-proceedings", value);
    });
    renderLogic(issue);
  };
  const previousRenderLogic = renderLogic;
  renderLogic = function (issue) {
    if (!isDataProtection(issue)) return previousRenderLogic(issue);
    document.querySelector("#recommendations-card")?.remove();
    const card = document.querySelector("#logic-card");
    card.classList.add("coc-deal-logic", "logic-standby");
    const message = complete(answers)
      ? 'Your answers are recorded. Deal analysis and recommendations are not yet configured for this issue.'
      : 'Answer all relevant questions to generate your deal analysis.';
    card.innerHTML = `<h3>Apply deal logic</h3><p>${message}</p>`;
  };
  const previousExportReport = exportReport;
  exportReport = function () {
    const issue = current();
    if (!isDataProtection(issue)) return previousExportReport();
    normalize(answers);
    const lines = issue.key_questions.filter(q => visibleIds(answers).includes(q.id)).map(({id,question}) => `${question}\n  Response: ${labelFor(id, answers[id])}`);
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, issue.summary, `Risk score: ${assessRisk(answers)}/5 — ${riskNames[assessRisk(answers) - 1]}`, "", "DILIGENCE ANSWERS", ...lines, "", "NOTE", "Deal analysis, recommended actions and legal notes are not yet configured.", "Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], {type:"text/plain"}));
    const link = document.createElement("a");link.href=url;link.download=`${issue.id}-report.txt`;link.click();URL.revokeObjectURL(url);
  };
})();
