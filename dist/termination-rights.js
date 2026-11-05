/* Material Contracts questionnaire using the existing Change-of-Control presentation. */
(() => {
  const issueId = "termination-rights-and-material-breaches";
  const isTermination = issue => issue?.id === issueId;
  const escape = escapeLogicText;
  const fields = {
  "contract-termination-issue": {
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
    "guidance": "Review key customer, supplier and other commercial contracts, performance records and correspondence. Include breaches by either party and rights allowing the counterparty to terminate without a breach. Transaction-triggered change-of-control provisions are covered separately."
  },
  "contract-termination-type": {
    "options": [
      [
        "breach",
        "Breach"
      ],
      [
        "termination-right",
        "Termination right"
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
    "guidance": "Select Breach for an actual or suspected failure to meet contractual obligations. Select Termination right where the counterparty has, or may have, a right to end the contract. Select Both where both apply, including termination rights arising from a breach."
  },
  "contract-termination-stage": {
    "options": [
      [
        "no-notice",
        "No formal notice"
      ],
      [
        "breach-notice",
        "Breach notice received"
      ],
      [
        "termination-notice",
        "Termination notice received"
      ],
      [
        "ended",
        "Contract ended"
      ],
      [
        "unknown",
        "Unknown"
      ]
    ],
    "guidance": "Check notices, correspondence, effective dates and any deadline to remedy a breach or respond. Where more than one answer applies, select the furthest stage reached. No formal notice does not establish that the contract is secure."
  },
  "contract-termination-impact": {
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
    "guidance": "Consider lost revenue, replacement costs, potential liabilities, business disruption and the effect on valuation or completion. Assess the consequences of both the breach and any loss of the contract."
  },
  "contract-termination-resolution": {
    "options": [
      [
        "addressed",
        "Already addressed"
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
    "guidance": "Check whether any necessary cure, waiver, settlement, continued supply or replacement arrangements can be put in place before completion. Select Already addressed only where the arrangements are effective and any remaining consequences have been addressed."
  }
};
  const ids = Object.keys(fields);
  const valid = (id, value) => fields[id].options.some(([key]) => key === value);
  function visibleIds(state) {
    const visible = [];
    for (const id of ids) {
      visible.push(id);
      if (!valid(id, state[id]) || (id === ids[0] && state[id] === "no")) break;
    }
    return visible;
  }
  function normalize(state) {
    const visible = visibleIds(state);
    Object.keys(state).forEach(id => {
      if (!visible.includes(id) || !valid(id, state[id])) delete state[id];
    });
  }
  function questionMarkup({id, question}) {
    const field = fields[id];
    return `<div class="question"><div class="question-top"><label for="${id}">${escape(question)}</label><button class="info" type="button" aria-label="Guidance: ${escape(question)}">i<span class="tooltip" id="${id}-guidance" role="tooltip">${escape(field.guidance)}</span></button></div><select id="${id}" aria-describedby="${id}-guidance"><option value="" ${!answers[id] ? "selected" : ""}>Unanswered</option>${field.options.map(([value, label]) => `<option value="${value}" ${answers[id] === value ? "selected" : ""}>${escape(label)}</option>`).join("")}</select></div>`;
  }
  // Questionnaire-only delivery: no borrowed risk formula or transaction advice.
  const previousRiskScore = riskScore;
  riskScore = function () { return isTermination(current()) ? 1 : previousRiskScore(); };
  const previousRenderLogic = renderLogic;
  renderLogic = function (issue) {
    if (!isTermination(issue)) return previousRenderLogic(issue);
    document.querySelector("#recommendations-card")?.remove();
    const card = document.querySelector("#logic-card");
    card.classList.add("coc-deal-logic", "logic-standby");
    card.innerHTML = '<h3>Apply deal logic</h3><p>Answer all relevant questions to generate your deal analysis.</p>';
  };
  const previousRenderPanel = renderPanel;
  renderPanel = function () {
    if (isTermination(current())) {
      const previous = JSON.stringify(answers);
      normalize(answers);
      if (JSON.stringify(answers) !== previous) DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
    }
    previousRenderPanel();
    const issue = current();
    if (!isTermination(issue)) return;
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
        document.getElementById(id)?.focus();
      };
    });
  };
  const previousExportReport = exportReport;
  exportReport = function () {
    const issue = current();
    if (!isTermination(issue)) return previousExportReport();
    normalize(answers);
    const visible = visibleIds(answers);
    const lines = issue.key_questions.filter(question => visible.includes(question.id)).map(({id, question}) => `- ${question}\n  Response: ${fields[id].options.find(([value]) => value === answers[id])?.[1] || "Unanswered"}`);
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, issue.summary, "", "DILIGENCE ANSWERS", ...lines, "", "NOTE", "Questionnaire only. Risk assessment and deal analysis are not yet configured. Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], {type: "text/plain"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${issue.id}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
})();
