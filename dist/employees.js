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
        "partly",
        "Partly"
      ],
      [
        "unknown",
        "Unknown"
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
        "all-leaving",
        "All plan to leave"
      ],
      [
        "unknown",
        "Unknown"
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
        "unknown",
        "Unknown"
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
    // Preserve existing selections when consolidating the uncertainty choices.
    ids.forEach(id => {
      if (responses[id] === "not-assessed") responses[id] = id === "employee-payments" ? "unclear" : "unknown";
    });
    // Remove answers from the retired supplementary questionnaire.
    ["employee-signing-gap", "employee-specific-exposure", "employee-seller-guarantee", "employee-recovery-concern", "employee-tupe-applies", "employee-tupe-outstanding"].forEach(id => delete responses[id]);
    const visible = visibleIds(responses);
    ids.forEach(id => { if (!visible.includes(id) || !valid(id, responses[id])) delete responses[id]; });
  };
  const labelFor = id => fields[id].options.find(([key]) => key === answers[id])?.[1] || "Unanswered";
  const questionMarkup = ({ id, question }) => `<div class="question"><div class="question-top"><label for="${id}">${escape(question)}</label><button class="info" type="button" aria-label="Guidance: ${escape(question)}">i<span class="tooltip" role="tooltip">${escape(fields[id].guidance)}</span></button></div><select id="${id}"><option value="">Unanswered</option>${fields[id].options.map(([key, label]) => `<option value="${key}" ${answers[id] === key ? "selected" : ""}>${escape(label)}</option>`).join("")}</select></div>`;

  const summaryCopy = {
    "employee-dependence": {
      yes: "The target depends on particular employees for its operations or value.",
      partly: "The target depends to some extent on particular employees for its operations or value.",
      no: "No material dependence on particular employees has been identified. This does not establish that there are no wider employment liabilities or transaction payments.",
      unknown: "It is unclear whether the target depends on particular employees for its operations or value."
    },
    "employee-replacement": {
      easy: "It may be easy to replace the key employees without disrupting the business.",
      manageable: "Replacing the key employees without disrupting the business appears manageable.",
      difficult: "It may be difficult to replace the key employees without disrupting the business.",
      unknown: "The difficulty of replacing the key employees without disrupting the business is unknown."
    },
    "employee-intentions": {
      "all-staying": "All identified key employees intend to remain with the target after completion, although their intentions do not guarantee retention.",
      "some-undecided": "Some key employees remain undecided about staying after completion.",
      "some-leaving": "Some key employees plan to leave the target.",
      "all-leaving": "All identified key employees plan to leave the target.",
      unknown: "The key employees’ intentions about remaining after completion are unknown."
    },
    "employee-terms": {
      yes: "Their employment terms allow enough time for replacement and handover.",
      partly: "Their employment terms allow only some of the time needed for replacement and handover.",
      no: "Their employment terms do not allow enough time for replacement and handover.",
      unknown: "It is unclear whether their employment terms allow enough time for replacement and handover."
    },
    "employee-payments": {
      yes: "The transaction will trigger bonuses, severance or other employee payments, with the amounts and cost allocation requiring confirmation.",
      no: "No transaction-triggered bonuses, severance or other employee payments have been identified.",
      unclear: "It is unclear whether the transaction will trigger bonuses, severance or other employee payments."
    },
    "employee-arrangements": {
      "all-agreed": "All necessary retention or handover arrangements are agreed, but their implementation remains to be confirmed.",
      "some-outstanding": "Some necessary retention or handover arrangements remain outstanding.",
      "none-agreed": "None of the necessary retention or handover arrangements are agreed.",
      "not-needed": "No retention or handover arrangements are considered necessary on the recorded assessment.",
      unknown: "It is unclear whether the necessary retention or handover arrangements are agreed."
    }
  };
  // One stable consequence per theme, rather than a second account of the answers.
  const implicationCopy = {
    absent: "No key-employee continuity issue is currently indicated; wider employment matters remain outside this assessment.",
    continuity: "Loss of key people could disrupt operations or reduce transaction value; continuity planning should inform the deal timetable.",
    dependenceUnknown: "Key-person dependence needs to be established before the continuity requirements of the acquisition can be settled.",
    continuityUnknown: "Uncertainty about replacement or employee intentions prevents continuity readiness from being confirmed.",
    arrangements: "Unresolved employment terms or retention and handover arrangements remain a transaction dependency.",
    implementation: "Agreed retention and handover arrangements need to be implemented; they do not guarantee continued employment.",
    reassess: "The decision that no retention or handover arrangements are needed should be checked against the identified continuity concerns.",
    payments: "Employee transaction payments need to be quantified and allocated in the deal economics and completion funding.",
    paymentsUnknown: "Potential employee transaction payments leave an unresolved cost exposure for the acquisition.",
    clear: "No unresolved key-employee continuity issue is currently indicated by the recorded answers; intentions to stay do not guarantee retention."
  };
  const buildAnalysis = responses => {
    const visible = visibleIds(responses);
    if (!visible.every(id => valid(id, responses[id]))) return null;
    const [dependence, replacement, intentions, terms, payments, arrangements] = ids.map(id => visible.includes(id) ? responses[id] : "");
    const summary = visible.map(id => summaryCopy[id][responses[id]]).join(" ");
    if (dependence === "no") return { summary, implications: [implicationCopy.absent] };
    const implications = [];
    const continuityConcern = replacement === "difficult" || intentions === "some-undecided" || intentions === "some-leaving" || intentions === "all-leaving";
    if (dependence === "unknown") implications.push(implicationCopy.dependenceUnknown);
    else if (continuityConcern) implications.push(implicationCopy.continuity);
    else if (replacement === "unknown" || intentions === "unknown") implications.push(implicationCopy.continuityUnknown);

    if (arrangements === "not-needed" && (continuityConcern || terms !== "yes" || dependence === "unknown" || replacement === "unknown" || intentions === "unknown")) implications.push(implicationCopy.reassess);
    else if (terms !== "yes" || ["some-outstanding", "none-agreed", "unknown"].includes(arrangements)) implications.push(implicationCopy.arrangements);
    else if (arrangements === "all-agreed") implications.push(implicationCopy.implementation);

    if (payments === "yes") implications.push(implicationCopy.payments);
    else if (payments === "unclear") implications.push(implicationCopy.paymentsUnknown);
    if (!implications.length) implications.push(implicationCopy.clear);
    return { summary, implications };
  };

  const assessRisk = responses => {
    const visible = visibleIds(responses);
    const active = id => visible.includes(id) && valid(id, responses[id]) ? responses[id] : "";
    const [dependence, replacement, intentions, terms, payments, arrangements] = ids.map(active);
    if (!dependence || dependence === "no") return 1;
    let score = dependence === "yes" ? 3 : 2;
    let floor = 2;
    const atLeast = minimum => { floor = Math.max(floor, minimum); };

    if (replacement === "easy") score -= 1;
    if (replacement === "difficult") { score += 1; atLeast(3); }
    if (replacement === "unknown") atLeast(3);

    if (intentions === "all-staying") score -= 1;
    if (intentions === "some-undecided" || intentions === "unknown") atLeast(3);
    if (intentions === "some-leaving") {
      score += 1;
      atLeast(replacement === "difficult" ? 4 : 3);
    }
    if (intentions === "all-leaving") {
      score += 2;
      atLeast(replacement === "easy" ? 3 : 4);
    }

    if (terms === "partly" || terms === "unknown") atLeast(3);
    if (terms === "no") { score += 1; atLeast(3); }
    if (payments === "yes") atLeast(2);
    if (payments === "unclear") atLeast(3);

    const knownContinuity = ["yes", "partly"].includes(dependence)
      && ["easy", "manageable", "difficult"].includes(replacement)
      && ["all-staying", "some-undecided", "some-leaving", "all-leaving"].includes(intentions);
    if (arrangements === "all-agreed" && knownContinuity) score -= 1;
    if (["some-outstanding", "none-agreed", "unknown"].includes(arrangements)) atLeast(3);
    const needIndicated = ["some-undecided", "some-leaving", "all-leaving"].includes(intentions)
      || ["partly", "no"].includes(terms);
    if (arrangements === "none-agreed" && needIndicated) score += 1;

    // Only this concentrated departure/continuity combination can reach 5.
    if (dependence === "yes" && replacement === "difficult" && intentions === "all-leaving"
      && terms === "no" && arrangements && arrangements !== "all-agreed") return 5;
    return Math.min(4, Math.max(floor, score));
  };

  const priorityRank = { Required: 3, Recommended: 2, Consider: 1 };
  const actionOrder = ["ER03", "ER07", "ER13", "ER01", "ER02", "ER05", "ER04", "ER09", "ER08", "ER15", "ER14", "ER11"];
  const chooseActions = (responses, side = "Balanced", consolidate = true) => {
    if (!buildAnalysis(responses) || responses[ids[0]] === "no") return [];
    const [dependence,replacement,intentions,terms,payments,arrangements] = ids.map(id => responses[id]);
    const unresolved = ["some-outstanding", "none-agreed", "unknown"].includes(arrangements);
    const departing = ["some-leaving", "all-leaving"].includes(intentions);
    const undecided = intentions === "some-undecided";
    const choices = new Map();
    const add = (id, buyer, seller, balanced, description) => {
      const priority = {Buyer:buyer, Seller:seller, Balanced:balanced}[["Buyer","Seller","Balanced"].includes(side) ? side : "Balanced"];
      if (!priority) return;
      const previous = choices.get(id);
      if (!previous || priorityRank[priority] > priorityRank[previous.priority]) choices.set(id,{id, priority, description, constituentIds:[id]});
    };
    if (dependence === "unknown" || intentions === "unknown" || terms === "unknown") add("ER13","Required","Recommended","Required");
    else if (["no","partly"].includes(terms)) add("ER13","Required","Recommended","Recommended");
    else add("ER13","Recommended","Consider","Recommended");
    if ((departing || undecided) && unresolved) add("ER14","Consider","Consider","Consider");
    if ((departing || undecided) && unresolved) add("ER01","Required","Recommended","Required");
    else if (intentions === "all-staying" && replacement === "difficult" && unresolved) add("ER01","Recommended","Consider","Recommended");
    if (arrangements === "not-needed" && (departing || undecided || ["no","partly"].includes(terms))) add("ER01","Recommended","Recommended","Recommended", "Reassess whether retention or handover arrangements are needed and document any necessary agreements.");
    if (departing || undecided) add("ER15","Consider","Consider","Consider");
    if (terms === "no") add("ER02","Required","Recommended","Required");
    else if (terms === "partly") add("ER02","Recommended","Consider","Recommended");
    if (unresolved && replacement === "difficult" && departing) add("ER03","Required","Consider","Recommended");
    else if (unresolved && replacement === "manageable" && intentions === "all-leaving") add("ER03","Recommended","Consider","Recommended");
    add("ER04","Consider","Consider","Consider");
    const adverse = intentions !== "all-staying" || terms !== "yes" || payments !== "no" || unresolved;
    add("ER05","Recommended",adverse ? "Required" : "Recommended","Recommended");
    if (payments === "yes") add("ER07","Required","Required","Required");
    else if (payments === "unclear") add("ER07","Required","Recommended","Required", "Establish potential employee payments and agree their allocation, including employer taxes, in the price mechanism and completion payments.");
    if (payments !== "no" || ["no","partly"].includes(terms) || departing) add("ER08","Consider","Consider","Consider");
    if (departing || undecided || replacement === "difficult" || unresolved) add("ER09",null,"Consider","Consider");
    add("ER11","Consider","Consider","Consider");

    const registry = window.DealLogicActionRegistry;
    const items = [...choices.values()].map(choice => ({...registry.actionFor(issueId,"","",choice.id), ...choice, description:choice.description || registry.actionFor(issueId,"","",choice.id).description}));
    const merge = (first, second, title, description) => {
      if (items.length <= 9) return;
      const a = items.find(item => item.id === first), b = items.find(item => item.id === second);
      if (!a || !b) return;
      a.title = title;
      a.description = description;
      a.constituentIds.push(...b.constituentIds);
      if (priorityRank[b.priority] > priorityRank[a.priority]) a.priority = b.priority;
      items.splice(items.indexOf(b),1);
    };
    if (consolidate) {
      merge("ER13","ER02","Review and strengthen employment terms", "Review contracts and agree necessary changes to notice, handover, confidentiality and reasonable competition restrictions, with employee consent and regard to TUPE.");
      merge("ER01","ER14","Review pay and agree retention", "Agree retention payments linked to service or handover, with clear early-leaver terms, and consider pay improvements if remuneration contributes to departure risk, allocating the costs.");
      merge("ER04","ER09","Agree interim controls and seller limits", "If signing precedes completion, agree buyer consent controls over material employment changes, while limiting seller retention commitments to defined efforts and excluding buyer-caused departures after completion.");
    }
    return items.sort((a,b) => priorityRank[b.priority]-priorityRank[a.priority] || actionOrder.indexOf(a.id)-actionOrder.indexOf(b.id));
  };
  window.DealLogicEmploymentActions = (responses, side) => chooseActions(responses, side, false);
  const actionsMarkup = actions => actions.length ? actions.map(action => `<div class="logic-action" data-action-id="${action.id}" data-constituent-ids="${action.constituentIds.join(",")}"><span class="logic-icon" aria-hidden="true"></span><div><span class="logic-priority" data-level="${action.priority.toLowerCase()}">${action.priority}</span><strong>${escape(action.title)}</strong><span>${escape(action.description)}</span></div></div>`).join("") : `<p>There are no active transaction actions on the information recorded.</p>`;

  const legalNotes = [
  {
    "title": "Notice and handover",
    "text": "An employee’s statutory minimum resignation notice is generally only one week after one month’s service, so check whether the contract provides enough time to replace key staff. Review notice-waiver, payment-in-lieu and garden-leave arrangements before relying on a working handover.",
    "source": "Employment Rights Act 1996, s.86",
    "url": "https://www.legislation.gov.uk/ukpga/1996/18/section/86/data.html"
  },
  {
    "title": "Restrictive covenants",
    "text": "Restrictions on competing or approaching customers after employment ends must protect legitimate business interests and be reasonable in duration and scope, including the activities, customers and any geographical area covered. Tailor restrictions to the employee’s actual role rather than copying wider seller covenants; an employee’s signature alone does not establish enforceability.",
    "source": "Tillman v Egon Zehnder [2019] UKSC 32, paragraphs 26–27",
    "url": "https://supremecourt.uk/uploads/uksc_2017_0182_judgment_334bcf3f1b.pdf"
  },
  {
    "title": "Good/bad leaver terms",
    "text": "Leaver treatment depends on the articles, shareholder agreements and award documents, rather than a universal definition of “good” or “bad”. In Nosworthy, voluntary resignation triggered bad-leaver treatment under the particular documents, illustrating why definitions, notice dates and decision-making powers need careful review.",
    "source": "Nosworthy v Instinctif Partners, paragraphs 44 and 61",
    "url": "https://assets.publishing.service.gov.uk/media/5c77cc57e5274a0ec174cded/Miss_E_Nosworthy_v_Instinctif_Partners_Ltd_UKEAT_0100_18_RN.pdf"
  }
];
  const notesMarkup = () => legalNotes.map(note => `<div class="logic-note"><strong>${escape(note.title)}:</strong> ${escape(note.text)} <a href="${escape(note.url)}" target="_blank" rel="noopener noreferrer">${escape(note.source)}</a></div>`).join("");

  // Employee-specific scoring; other issues retain their own rules.
  const previousRiskScore = riskScore;
  riskScore = function () { return isEmployees(current()) ? assessRisk(answers) : previousRiskScore(); };
  const previousRenderPanel = renderPanel;
  renderPanel = function () {
    if (isEmployees(current())) {
      const previous = JSON.stringify(answers);
      normalize(answers);
      if (JSON.stringify(answers) !== previous) DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
    }
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
    card.classList.add("coc-deal-logic");
    const analysis = buildAnalysis(answers);
    if (!analysis) {
      card.classList.add("logic-standby");
      card.innerHTML = `<h3>Apply deal logic</h3><p>Answer all relevant questions to generate your deal analysis.</p>`;
      return;
    }
    card.classList.remove("logic-standby");
    const side = getTransactionSide();
    const actions = chooseActions(answers, side);
    card.innerHTML = `<h3>Apply deal logic</h3><section class="logic-section"><h4>Summary</h4><p class="logic-conclusion">${escape(analysis.summary)}</p></section><section class="logic-section"><h4>Key deal implications</h4><ul>${analysis.implications.map(text => `<li>${escape(text)}</li>`).join("")}</ul></section><section class="logic-section"><div class="logic-section-heading"><h4>Recommended actions</h4><div class="logic-side-picker" aria-label="Transaction side selector"><button type="button" class="active" data-logic-side-toggle>${side}</button></div></div>${actionsMarkup(actions)}</section><section class="logic-section"><h4>Notes</h4>${notesMarkup()}</section>`;
    document.dispatchEvent(new CustomEvent("employees-logic-rendered"));
  };
  const previousExportReport = exportReport;
  exportReport = function () {
    const issue = current();
    if (!isEmployees(issue)) return previousExportReport();
    normalize(answers);
    const visible = visibleIds(answers);
    const lines = issue.key_questions.filter(question => visible.includes(question.id)).map(({id, question}) => `- ${question}\n  Response: ${labelFor(id)}`);
    const analysis = buildAnalysis(answers);
    const analysisLines = analysis ? ["", "SUMMARY", analysis.summary, "", "KEY DEAL IMPLICATIONS", ...analysis.implications.map(text => `- ${text}`)] : [];
    const actionLines = analysis ? ["", `RECOMMENDED ACTIONS — ${getTransactionSide()}`, ...chooseActions(answers,getTransactionSide()).map(action => `- ${action.priority}: ${action.title}\n  ${action.description}`)] : [];
    const noteLines = analysis ? ["", "LEGAL NOTES", ...legalNotes.map(note => `${note.title}: ${note.text}\nSource: ${note.source} — ${note.url}`)] : [];
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, issue.summary, `Risk score: ${assessRisk(answers)}/5 — ${riskNames[assessRisk(answers) - 1]}`, "", "DILIGENCE ANSWERS", ...lines, ...analysisLines, ...actionLines, ...noteLines, "", "NOTE", "Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${issue.id}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
})();
