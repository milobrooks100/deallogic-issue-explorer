/* Data Protection questionnaire, risk assessment and deal analysis. */
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
  const summaryCopy = {
    "dp-ongoing": {
      yes: "The issue is reported to be ongoing.",
      partly: "The issue is reported to be partly ongoing.",
      no: "The issue is reported to have stopped.",
      unknown: "It is unclear whether the issue is still ongoing."
    },
    "dp-notifications": {
      "all-made": "All required breach notifications are reported to have been made.",
      "some-outstanding": "Some required breach notifications remain outstanding.",
      "none-made": "No required breach notifications have been made.",
      "none-required": "The recorded assessment is that no breach notifications are required.",
      unknown: "It is unclear whether required breach notifications have been made."
    },
    "dp-impact": {
      minimal: "The likely impact on the target or deal is assessed as minimal.",
      manageable: "The likely impact on the target or deal is assessed as manageable.",
      significant: "The likely impact on the target or deal is assessed as significant.",
      fundamental: "The likely impact on the target or deal is assessed as fundamental.",
      unknown: "The likely impact on the target or deal is unknown."
    },
    "dp-remediation": {
      completed: "All necessary remedial steps are reported to have been completed.",
      yes: "All necessary remedial steps are expected to be achievable before completion.",
      partly: "Only some necessary remedial steps can be completed before completion.",
      no: "The necessary remedial steps cannot all be completed before completion.",
      unknown: "It is unclear whether all necessary remedial steps can be completed before completion."
    }
  };
  // Reuse consequence statements by theme; answer-level detail belongs in the summary.
  const implicationCopy = {
    absent: "No specific completion protection is indicated, but wider data protection compliance has not been confirmed.",
    fundamental: "The issue may undermine the deal. Reassess whether it can proceed and on what terms.",
    significant: "The issue may materially affect value, operations or completion. Reflect this in the price and allocation of risk.",
    uncertain: "The issue or its impact needs to be clarified before the deal risk can be assessed.",
    inconsistent: "Confirm why remediation is marked complete when the issue is ongoing or notifications remain outstanding.",
    readiness: "Plan how to contain the issue, make outstanding notifications and complete remedial work. Agree who handles and pays for any work after completion.",
    readinessUnknown: "Confirm the response status and remediation timetable before deciding whether the target is ready for completion.",
    planned: "The completion timetable depends on the planned remedial work being done.",
    external: "Complaints, claims or regulatory enquiries may leave liabilities after remediation. Address these in disclosure and agree who bears the risk and costs.",
    externalUnknown: "Check for complaints, claims or regulatory enquiries before agreeing how to allocate the remaining risk.",
    clear: "No outstanding issue is shown to affect completion, but past liabilities may remain despite remediation."
  };
  const buildAnalysis = responses => {
    if (!complete(responses)) return null;
    const visible = visibleIds(responses);
    const existence = responses["dp-issue"];
    if (existence === "no") return {
      summary: "No data protection issue has been identified on the recorded assessment. This does not establish that the target is fully compliant with data protection requirements.",
      implications: [implicationCopy.absent]
    };
    const type = responses["dp-type"];
    const ongoing = responses["dp-ongoing"];
    const notifications = visible.includes("dp-notifications") ? responses["dp-notifications"] : undefined;
    const proceedings = responses["dp-proceedings"];
    const impact = responses["dp-impact"];
    const remediation = responses["dp-remediation"];
    const subject = {
      "compliance-gap": "a compliance gap",
      "personal-data-breach": "a personal data breach",
      both: "both a compliance gap and a personal data breach",
      unknown: "a data protection issue of an unknown type"
    }[type];
    const opening = existence === "yes" ? `The target has identified ${subject}.`
      : existence === "suspected" ? `The target suspects ${subject}, but this has not been confirmed.`
        : `It is unclear whether a data protection issue exists; the recorded concern relates to ${subject}.`;
    const external = fields["dp-proceedings"].options
      .filter(([key]) => proceedings.includes(key) && !["none", "unknown"].includes(key))
      .map(([, label]) => label.toLowerCase());
    const list = external.length > 1 ? `${external.slice(0, -1).join(", ")} and ${external.at(-1)}` : external[0];
    const proceedingsText = proceedings.includes("none") ? "No related complaints, claims or regulatory enquiries have been reported."
      : proceedings.includes("unknown") ? "It is unclear whether there are related complaints, claims or regulatory enquiries."
        : `Related ${list} have been reported.`;
    const summary = [opening, summaryCopy["dp-ongoing"][ongoing],
      notifications ? summaryCopy["dp-notifications"][notifications] : "",
      proceedingsText, summaryCopy["dp-impact"][impact], summaryCopy["dp-remediation"][remediation]]
      .filter(Boolean).join(" ");

    // At most one implication per theme, so no material theme is lost to truncation.
    const implications = [];
    if (impact === "fundamental") implications.push(implicationCopy.fundamental);
    else if (impact === "significant") implications.push(implicationCopy.significant);
    else if (existence !== "yes" || type === "unknown" || impact === "unknown") implications.push(implicationCopy.uncertain);

    const responseOpen = ["yes", "partly"].includes(ongoing) || ["some-outstanding", "none-made"].includes(notifications);
    if (remediation === "completed" && responseOpen) implications.push(implicationCopy.inconsistent);
    else if (responseOpen || ["partly", "no"].includes(remediation)) implications.push(implicationCopy.readiness);
    else if (ongoing === "unknown" || notifications === "unknown" || remediation === "unknown") implications.push(implicationCopy.readinessUnknown);
    else if (remediation === "yes") implications.push(implicationCopy.planned);

    if (external.length) implications.push(implicationCopy.external);
    else if (proceedings.includes("unknown")) implications.push(implicationCopy.externalUnknown);
    if (!implications.length) implications.push(implicationCopy.clear);
    return { summary, implications };
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
    const analysis = buildAnalysis(answers);
    card.classList.add("coc-deal-logic");
    card.classList.toggle("logic-standby", !analysis);
    card.innerHTML = analysis
      ? `<h3>Apply deal logic</h3><section class="logic-section"><h4>Summary</h4><p class="logic-conclusion">${escape(analysis.summary)}</p></section><section class="logic-section"><h4>Key deal implications</h4><ul>${analysis.implications.map(text => `<li>${escape(text)}</li>`).join("")}</ul></section>`
      : `<h3>Apply deal logic</h3><p>Answer all relevant questions to generate your deal analysis.</p>`;
  };
  const previousExportReport = exportReport;
  exportReport = function () {
    const issue = current();
    if (!isDataProtection(issue)) return previousExportReport();
    normalize(answers);
    const lines = issue.key_questions.filter(q => visibleIds(answers).includes(q.id)).map(({id,question}) => `${question}\n  Response: ${labelFor(id, answers[id])}`);
    const analysis = buildAnalysis(answers);
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, issue.summary, `Risk score: ${assessRisk(answers)}/5 — ${riskNames[assessRisk(answers) - 1]}`, "", "DILIGENCE ANSWERS", ...lines, "", ...(analysis ? ["SUMMARY", analysis.summary, "", "KEY DEAL IMPLICATIONS", ...analysis.implications.map(text => `- ${text}`)] : ["Answer all relevant questions to generate your deal analysis."]), "", "NOTE", "Recommended actions and legal notes are not yet configured.", "Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], {type:"text/plain"}));
    const link = document.createElement("a");link.href=url;link.download=`${issue.id}-report.txt`;link.click();URL.revokeObjectURL(url);
  };
})();
