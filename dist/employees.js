/* Employment questionnaire: Threatened Litigation presentation and progressive reveal. */
(() => {
  const issueId = "key-employee-retention-and-employment-terms";
  const isEmployees = issue => issue?.id === issueId;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  const fields = {
  "employee-dependence": {
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
      ],
      [
        "not-assessed",
        "Not assessed"
      ]
    ],
    "guidance": "Consider employees who hold key customer relationships, specialist knowledge or essential leadership roles. Assess whether their departure would materially affect the target."
  },
  "employee-replacement": {
    "options": [
      [
        "easy",
        "Easy"
      ],
      [
        "manageable",
        "Manageable"
      ],
      [
        "difficult",
        "Difficult"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Consider available successors, recruitment time and the knowledge or relationships a replacement would need to develop. Include the time needed for an effective handover."
  },
  "employee-intentions": {
    "options": [
      [
        "all-staying",
        "All intend to stay"
      ],
      [
        "some-undecided",
        "Some undecided"
      ],
      [
        "some-leaving",
        "Some plan to leave"
      ],
      [
        "unknown",
        "Unknown"
      ],
      [
        "not-assessed",
        "Not assessed"
      ]
    ],
    "guidance": "Review any recorded discussions or commitments about their future plans. Do not assume that silence, an existing contract or a retention payment confirms an intention to stay."
  },
  "employee-terms": {
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
      ],
      [
        "not-assessed",
        "Not assessed"
      ]
    ],
    "guidance": "Review notice periods, fixed-term expiry dates and any rights to leave on the acquisition. Consider whether these allow enough time to recruit a replacement and transfer responsibilities."
  },
  "employee-payments": {
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
        "unclear",
        "Unclear"
      ],
      [
        "not-assessed",
        "Not assessed"
      ]
    ],
    "guidance": "Check employment contracts, bonus plans and side agreements for payments triggered by the sale or a related departure. Confirm the amounts, conditions and who bears the cost; assess share options in Option Holders."
  },
  "employee-arrangements": {
    "options": [
      [
        "all-agreed",
        "All agreed"
      ],
      [
        "some-outstanding",
        "Some still outstanding"
      ],
      [
        "none-agreed",
        "None agreed"
      ],
      [
        "not-needed",
        "Not needed"
      ],
      [
        "not-assessed",
        "Not assessed"
      ]
    ],
    "guidance": "Check whether required incentives, revised terms, succession plans or handover arrangements are documented and agreed with the relevant people. Distinguish agreed arrangements from proposals or ongoing discussions."
  }
};
  const ids = Object.keys(fields);
  const valid = (id, value) => fields[id].options.some(([key]) => key === value);
  const visibleIds = responses => {
    const visible = [];
    for (const id of ids) {
      visible.push(id);
      if (!valid(id, responses[id]) || (id === ids[0] && responses[id] === "no")) break;
    }
    return visible;
  };
  const normalize = responses => {
    const visible = visibleIds(responses);
    ids.forEach(id => { if (!visible.includes(id) || !valid(id, responses[id])) delete responses[id]; });
  };
  const labelFor = id => fields[id].options.find(([key]) => key === answers[id])?.[1] || "Unanswered";
  const questionMarkup = ({ id, question }) => `<div class="question"><div class="question-top"><label for="${id}">${escape(question)}</label><button class="info" type="button" aria-label="Guidance: ${escape(question)}">i<span class="tooltip" role="tooltip">${escape(fields[id].guidance)}</span></button></div><select id="${id}"><option value="">Unanswered</option>${fields[id].options.map(([key, label]) => `<option value="${key}" ${answers[id] === key ? "selected" : ""}>${escape(label)}</option>`).join("")}</select></div>`;

  // Keep this questionnaire independent of the litigation scoring and protections.
  const previousRiskScore = riskScore;
  riskScore = function () { return isEmployees(current()) ? 1 : previousRiskScore(); };
  const previousRenderPanel = renderPanel;
  renderPanel = function () {
    if (isEmployees(current())) normalize(answers);
    previousRenderPanel();
    const issue = current();
    if (!isEmployees(issue)) return;
    const card = document.querySelector(".content-grid > .card");
    if (!card) return;
    const heading = card.querySelector("h3");
    card.replaceChildren(heading);
    const visible = visibleIds(answers);
    card.insertAdjacentHTML("beforeend", issue.key_questions.filter(question => visible.includes(question.id)).map(questionMarkup).join(""));
    visible.forEach(id => {
      document.getElementById(id).onchange = event => {
        answers[id] = event.target.value;
        ids.slice(ids.indexOf(id) + 1).forEach(next => delete answers[next]);
        normalize(answers);
        DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
        renderPanel();
      };
    });
    renderLogic(issue);
  };
  const previousRenderLogic = renderLogic;
  renderLogic = function (issue) {
    if (!isEmployees(issue)) return previousRenderLogic(issue);
    document.querySelector("#recommendations-card")?.remove();
    const card = document.querySelector("#logic-card");
    card.classList.add("coc-deal-logic", "logic-standby");
    card.innerHTML = `<h3>Apply deal logic</h3><p>Answer all relevant questions to generate your deal analysis.</p>`;
  };
  const previousExportReport = exportReport;
  exportReport = function () {
    const issue = current();
    if (!isEmployees(issue)) return previousExportReport();
    const visible = visibleIds(answers);
    const lines = issue.key_questions.filter(question => visible.includes(question.id)).map(({id, question}) => `- ${question}\n  Response: ${labelFor(id)}`);
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, issue.summary, "", "DILIGENCE ANSWERS", ...lines, "", "Assessment and recommended actions are not yet configured for this questionnaire.", "", "NOTE", "Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${issue.id}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
})();
