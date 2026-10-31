/* Share ownership questionnaire and component-based risk assessment. */
(() => {
  const issueId = "share-ownership-and-transfer-restrictions";
  const isShareOwnership = issue => issue?.id === issueId;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  // Stable values keep saved responses independent of display wording.
  const fields = {
    "share-ownership-verified": {
      options: [["verified", "Verified"], ["evidence-gaps", "Evidence gaps — e.g. missing certificates or transfer records"], ["disputed", "Disputed ownership"], ["unchecked", "Unchecked"]],
      guidance: "Check the register of members, share certificates and relevant allotment or transfer documents. Confirm that they support each seller’s ownership of the shares being sold."
    },
    "share-seller-participation": {
      options: [["all-agreed", "All agreed"], ["some-undecided", "Some undecided"], ["some-refusing", "Some refusing"], ["unchecked", "Unchecked"]],
      guidance: "Check the proposed acquisition against the shareholder list and recorded seller commitments. Identify any shareholder whose participation remains uncertain; refusal may require a compulsory transfer route to be assessed."
    },
    "share-transfer-restrictions": {
      options: [["yes", "Yes"], ["no", "No"], ["partly-unclear", "Partly / unclear"], ["unchecked", "Unchecked"]],
      guidance: "Review the articles, shareholders’ agreement and any other agreement affecting transfers. Look for consent requirements, rights of first refusal and provisions requiring other shareholders to join the sale."
    },
    "share-restrictions-addressed": {
      parent: "share-transfer-restrictions",
      showFor: ["yes", "partly-unclear"],
      options: [["all-addressed", "All addressed"], ["some-outstanding", "Some outstanding"], ["not-addressed", "Not addressed"], ["unclear", "Unclear"]],
      guidance: "Check that each relevant restriction has been satisfied or validly waived, including any required approvals or notices. Confirm the supporting evidence rather than relying on an intention to resolve matters later."
    },
    "share-security-exists": {
      options: [["yes", "Yes"], ["no", "No"], ["unclear", "Unclear"], ["unchecked", "Unchecked"]],
      guidance: "Check whether a seller has pledged or charged the sale shares to a lender, reviewing security documents and seller confirmations. This concerns security over the shares themselves, rather than security over the target company’s assets."
    },
    "share-security-release": {
      parent: "share-security-exists",
      showFor: ["yes"],
      options: [["release-agreed", "Release agreed"], ["discussions-ongoing", "Discussions ongoing"], ["release-refused", "Release refused"], ["unclear", "Unclear"]],
      guidance: "Review the lender’s written release arrangements, including any repayment conditions and required documents. Confirm that the release will take effect as part of completion, rather than relying on an informal assurance."
    }
  };
  const visibleIds = responses => {
    const ids = [];
    for (const [id, field] of Object.entries(fields)) {
      if (field.parent && !field.showFor.includes(responses[field.parent])) continue;
      ids.push(id);
      if (!field.options.some(([value]) => value === responses[id])) break;
    }
    return ids;
  };
  const visibleQuestions = issue => issue.key_questions.filter(question => visibleIds(answers).includes(question.id));
  const labelFor = id => fields[id].options.find(([value]) => value === answers[id])?.[1] || "Unanswered";
  const questionMarkup = ({ id, question }) => `<div class="question"><div class="question-top"><label for="${id}">${escape(question)}</label><button class="info" type="button" aria-label="${escape(`Guidance: ${question}`)}">i<span class="tooltip">${escape(fields[id].guidance)}</span></button></div><select id="${id}"><option value="" ${!answers[id] ? "selected" : ""}>Unanswered</option>${fields[id].options.map(([value, label]) => `<option value="${value}" ${answers[id] === value ? "selected" : ""}>${escape(label)}</option>`).join("")}</select></div>`;

  const assessRisk = responses => {
    const activeIds = visibleIds(responses);
    const answer = id => activeIds.includes(id) && fields[id].options.some(([value]) => value === responses[id]) ? responses[id] : "";
    const ownership = answer("share-ownership-verified");
    const participation = answer("share-seller-participation");
    const restrictions = answer("share-transfer-restrictions");
    const addressed = ["yes", "partly-unclear"].includes(restrictions) ? answer("share-restrictions-addressed") : "";
    const security = answer("share-security-exists");
    const release = security === "yes" ? answer("share-security-release") : "";
    const activeAnswers = [ownership, participation, restrictions, security];
    if (["yes", "partly-unclear"].includes(restrictions)) activeAnswers.push(addressed);
    if (security === "yes") activeAnswers.push(release);
    if (!activeAnswers.some(Boolean)) return { score: 1 };

    const ownershipRisk = { verified: 1, "evidence-gaps": 2, disputed: 4, unchecked: 2 }[ownership] || 2;
    const participationRisk = { "all-agreed": 1, "some-undecided": 3, "some-refusing": 4, unchecked: 2 }[participation] || 2;
    const restrictionsRisk = restrictions === "yes" ? (addressed === "all-addressed" ? 1 : 3)
      : restrictions === "partly-unclear" ? 3 : restrictions === "no" ? 1 : 2;
    const securityRisk = security === "yes" ? ({ "release-agreed": 2, "discussions-ongoing": 3, "release-refused": 5, unclear: 3 }[release] || 3)
      : security === "unclear" ? 3 : security === "no" ? 1 : 2;
    let score = Math.max(ownershipRisk, participationRisk, restrictionsRisk, securityRisk);
    // Refusal and unresolved transfer restrictions may describe one obstacle.
    // Without evidence of independence, do not count that pair twice.
    let unresolvedComponents = [ownershipRisk, participationRisk, restrictionsRisk, securityRisk].filter(value => value >= 3).length;
    if (participation === "some-refusing" && restrictionsRisk >= 3) unresolvedComponents -= 1;
    if (score < 4 && unresolvedComponents >= 3) score += 1;
    return { score };
  };
  const riskText = assessment => `${assessment.score}/5 · ${riskNames[assessment.score - 1]}`;
  const previousRiskScore = riskScore;
  riskScore = function () {
    return isShareOwnership(current()) ? assessRisk(answers).score : previousRiskScore();
  };

  const summaryCopy = {
    ownership: {
      verified: "All sellers have verified ownership of their sale shares.",
      "evidence-gaps": "There are gaps in the evidence of the sellers’ ownership of their sale shares.",
      disputed: "There is an ownership dispute affecting the sale shares.",
      unchecked: "The sellers’ ownership of their sale shares has not yet been checked."
    },
    participation: {
      "all-agreed": "All shareholders needed for the acquisition have agreed to sell.",
      "some-undecided": "Some shareholders needed for the acquisition have not yet agreed to sell.",
      "some-refusing": "Some shareholders needed for the acquisition are refusing to sell.",
      unchecked: "Shareholder participation in the acquisition has not yet been checked."
    },
    restrictions: {
      no: "No restrictions on transferring the sale shares have been identified.",
      unchecked: "Restrictions on transferring the sale shares have not yet been checked.",
      yes: {
        "all-addressed": "Transfer restrictions have been identified and all have been addressed.",
        "some-outstanding": "Transfer restrictions have been identified, with some requirements still outstanding.",
        "not-addressed": "The identified transfer restrictions have not yet been addressed.",
        unclear: "Transfer restrictions have been identified, but whether they have been addressed is unclear."
      },
      "partly-unclear": {
        "all-addressed": "The scope of any transfer restrictions remains unclear, although the identified requirements are recorded as addressed.",
        "some-outstanding": "The scope of any transfer restrictions remains unclear, with some requirements still outstanding.",
        "not-addressed": "The scope of any transfer restrictions remains unclear and the potential requirements have not been addressed.",
        unclear: "The existence or scope of transfer restrictions, and whether they have been addressed, remain unclear."
      }
    },
    security: {
      no: "No security over the sale shares has been identified.",
      unclear: "It is unclear whether there is security over the sale shares.",
      unchecked: "Security over the sale shares has not yet been checked.",
      yes: {
        "release-agreed": "The sale shares are subject to security, with release arrangements agreed for completion.",
        "discussions-ongoing": "The sale shares are subject to security and discussions about its release are ongoing.",
        "release-refused": "The sale shares are subject to security and the required release has been refused.",
        unclear: "The sale shares are subject to security, but the arrangements for its release remain unclear."
      }
    }
  };
  const buildAnalysis = responses => {
    const ids = visibleIds(responses);
    if (!ids.every(id => fields[id].options.some(([value]) => value === responses[id]))) return null;
    const ownership = responses["share-ownership-verified"];
    const participation = responses["share-seller-participation"];
    const restrictions = responses["share-transfer-restrictions"];
    const addressed = responses["share-restrictions-addressed"];
    const security = responses["share-security-exists"];
    const release = responses["share-security-release"];
    const restrictionsCopy = summaryCopy.restrictions[restrictions];
    const securityCopy = summaryCopy.security[security];
    const summary = [summaryCopy.ownership[ownership], summaryCopy.participation[participation],
      typeof restrictionsCopy === "string" ? restrictionsCopy : restrictionsCopy[addressed],
      typeof securityCopy === "string" ? securityCopy : securityCopy[release]].join(" ");

    // One stable implication per theme keeps every outcome within three points.
    const implications = [];
    if (ownership === "disputed") implications.push("The ownership dispute may prevent delivery of the agreed shares and needs to be resolved before completion.");
    else if (ownership !== "verified") implications.push("The ownership evidence needs to be established before the buyer can rely on the sellers’ title.");

    const transferOpen = restrictions !== "no" && !(restrictions === "yes" && addressed === "all-addressed");
    if (participation === "some-refusing") implications.push("A valid route to acquire the agreed shareholding must address shareholder refusal and any outstanding transfer requirements.");
    else if (participation !== "all-agreed") implications.push("Acquisition of the agreed shareholding remains dependent on confirming shareholder participation and any outstanding transfer requirements.");
    else if (transferOpen) implications.push("The transfer route remains unconfirmed until applicable restrictions and required approvals or waivers are established.");

    if (security === "yes") {
      implications.push(release === "release-refused"
        ? "The refused security release is a potential completion blocker; an alternative route needs to be agreed."
        : release === "release-agreed"
          ? "Completion should link the share transfer to the effective release of security."
          : "Delivering the shares free of security remains a completion dependency until release arrangements are confirmed.");
    } else if (security !== "no") implications.push("Security checks are needed before the shares can be treated as free from third-party security rights.");
    if (!implications.length) implications.push("No ownership or transfer obstacle is currently indicated by the recorded answers.");
    return { summary, implications };
  };

  const priorityRank = { Required: 3, Recommended: 2, Consider: 1 };
  const actionOrder = ["SO01", "SO02", "SO03", "SO04", "SO05", "SO09", "SO10", "SO07", "SO06", "SO08"];
  const chooseActions = (responses, side = "Balanced") => {
    if (!buildAnalysis(responses)) return [];
    const selected = [];
    const add = (id, buyer, seller = buyer, balanced = buyer, description) => {
      const priority = { Buyer: buyer, Seller: seller, Balanced: balanced }[side] || balanced;
      selected.push({ id, priority, ...(description ? { description } : {}) });
    };
    const ownership = responses["share-ownership-verified"];
    const participation = responses["share-seller-participation"];
    const restrictions = responses["share-transfer-restrictions"];
    const addressed = responses["share-restrictions-addressed"];
    const security = responses["share-security-exists"];
    const release = responses["share-security-release"];
    const titleIssue = ["evidence-gaps", "disputed"].includes(ownership);

    if (ownership === "verified") add("SO01", "Recommended", "Consider", "Recommended");
    else add("SO01", "Required");
    if (titleIssue) add("SO02", "Required", "Required", "Required", ownership === "disputed"
      ? "Resolve the ownership dispute through corrective documents, settlement or appropriate register rectification before completion."
      : "Obtain missing ownership evidence and correct gaps in the share records before completion.");
    if (participation !== "all-agreed") add("SO03", "Required", "Required", "Required", participation === "some-refusing" ? undefined
      : "Confirm participation with outstanding shareholders and agree the steps needed to deliver the intended shareholding.");
    if (restrictions === "yes" && addressed !== "all-addressed") add("SO04", "Required");
    else if (["partly-unclear", "unchecked"].includes(restrictions)) add("SO04", "Required", "Recommended", "Required",
      "Review the transfer restrictions and confirm which approvals, waivers or other clearances are required.");
    if (security === "yes") {
      if (release === "release-agreed") add("SO05", "Recommended", "Recommended", "Recommended",
        "Confirm that the agreed security releases will take effect with the share transfer at completion.");
      else add("SO05", "Required");
    }
    add("SO06", "Required", "Recommended", "Recommended");
    if (titleIssue || ["yes", "partly-unclear"].includes(restrictions) || security === "yes") add("SO07", "Recommended", "Required", "Recommended");
    if (ownership === "disputed") add("SO08", "Recommended", "Consider", "Recommended");
    else if (ownership === "evidence-gaps") add("SO08", "Consider", "Consider", "Consider",
      "Assess whether the ownership evidence gaps expose the buyer to a specific loss requiring an indemnity or supporting security.");
    const score = assessRisk(responses).score;
    if (score >= 4) add("SO09", "Required", "Recommended", "Recommended");
    else if (score === 3) add("SO09", "Recommended", "Consider", "Recommended");
    add("SO10", "Required");
    return selected.sort((left, right) => priorityRank[right.priority] - priorityRank[left.priority]
      || actionOrder.indexOf(left.id) - actionOrder.indexOf(right.id)).slice(0, 8);
  };
  const actionsFor = (responses, side) => chooseActions(responses, side).map(choice => ({
    ...window.DealLogicActionRegistry.actionFor(issueId, "", "", choice.id), ...choice
  }));

  const legalNotes = [
    {
      title: "Ownership evidence",
      text: "The register of members provides prima facie, rather than conclusive, evidence of shareholdings. Reconcile it with the underlying allotment and transfer documents, and investigate discrepancies before relying on a seller’s title.",
      source: "Companies Act 2006, s.127",
      url: "https://www.legislation.gov.uk/ukpga/2006/46/section/127/data.html"
    },
    {
      title: "Missing certificates",
      text: "A missing share certificate does not itself establish defective ownership; Model Article 25 provides for replacement subject to conditions concerning evidence, indemnity and reasonable fees. Check the company’s actual articles and agree the replacement or lost-certificate arrangements before completion.",
      source: "Model Article 25",
      url: "https://www.gov.uk/government/publications/model-articles-for-private-companies-limited-by-shares/model-articles-for-private-companies-limited-by-shares"
    },
    {
      title: "Transfer pre-emption",
      text: "Statutory pre-emption under section 561 concerns allotments of equity securities, rather than a shareholder’s sale of existing shares. Check the articles and shareholders’ agreement for separate transfer pre-emption rights, and follow or validly waive the applicable procedure.",
      source: "Companies Act 2006, s.561",
      url: "https://www.legislation.gov.uk/ukpga/2006/46/section/561?view=extent"
    },
    {
      title: "Drag-along amendments",
      text: "In Arbuthnott v Bonnyman [2015] EWCA Civ 536, the Court of Appeal upheld amendments clarifying and facilitating an existing compulsory transfer arrangement. Review the existing shareholder bargain, company benefit and minority protections before relying on an amendment to compel an unwilling shareholder to sell.",
      source: "Judgment, paragraphs 66 and 98–100",
      url: "https://www.oeclaw.co.uk/images/uploads/judgments/Arbuthnott_v_Bonnyman_Re_Charterhouse_Capital_Limited_2015_EWCA_Civ_536.pdf"
    }
  ];
  const notesMarkup = () => legalNotes.map(note => `<div class="logic-note"><strong>${escape(note.title)}:</strong> ${escape(note.text)} <a href="${escape(note.url)}" target="_blank" rel="noopener noreferrer">${escape(note.source)}</a></div>`).join("");

  const previousRenderLogic = renderLogic;
  renderLogic = function (issue) {
    if (!isShareOwnership(issue)) return previousRenderLogic(issue);
    document.querySelector("#recommendations-card")?.remove();
    const card = document.querySelector("#logic-card");
    const analysis = buildAnalysis(answers);
    card.classList.add("coc-deal-logic");
    card.classList.toggle("logic-standby", !analysis);
    if (analysis) {
      const side = getTransactionSide();
      const actions = actionsFor(answers, side);
      const sidePicker = `<div class="logic-side-picker" aria-label="Transaction side selector"><button type="button" class="active" data-logic-side-toggle>${escape(side)}</button></div>`;
      const actionMarkup = actions.map(({ id, priority, title, description }) => `<div class="logic-action" data-action-id="${id}"><span class="logic-icon" aria-hidden="true"></span><div><span class="logic-priority" data-level="${priority.toLowerCase()}">${priority}</span><strong>${escape(title)}</strong><span>${escape(description)}</span></div></div>`).join("");
      card.innerHTML = `<h3>Apply deal logic</h3><section class="logic-section"><h4>Summary</h4><p class="logic-conclusion">${escape(analysis.summary)}</p></section><section class="logic-section"><h4>Key deal implications</h4><ul>${analysis.implications.map(item => `<li>${escape(item)}</li>`).join("")}</ul></section><section class="logic-section"><div class="logic-section-heading"><h4>Recommended actions</h4>${sidePicker}</div>${actionMarkup}</section><section class="logic-section"><h4>Notes</h4>${notesMarkup()}</section>`;
    } else card.innerHTML = `<h3>Apply deal logic</h3><p>Answer all relevant questions to generate your deal analysis.</p>`;
    document.dispatchEvent(new CustomEvent("share-ownership-logic-rendered"));
  };

  const previousRenderPanel = renderPanel;
  renderPanel = function () {
    previousRenderPanel();
    const issue = current();
    if (!isShareOwnership(issue)) return;
    const assessment = assessRisk(answers);
    const riskLabel = document.querySelector(".risk-score");
    riskLabel.textContent = riskText(assessment);
    document.querySelectorAll(".risk-step").forEach((step, index) => {
      step.classList.toggle("active", index < assessment.score);
      step.onmouseleave = () => { riskLabel.textContent = riskText(assessRisk(answers)); };
    });
    const factsCard = document.querySelector(".content-grid > .card");
    if (!factsCard) return;
    const heading = factsCard.querySelector("h3");
    factsCard.replaceChildren(heading);
    factsCard.insertAdjacentHTML("beforeend", visibleQuestions(issue).map(questionMarkup).join(""));
    factsCard.querySelectorAll("select").forEach(select => {
      select.onchange = event => {
        const { id, value } = event.target;
        if (value) answers[id] = value;
        else delete answers[id];
        const activeIds = visibleIds(answers);
        Object.keys(fields).filter(key => !activeIds.includes(key)).forEach(key => delete answers[key]);
        DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
        renderPanel();
        document.getElementById(id)?.focus();
      };
    });
  };

  const previousExportReport = exportReport;
  exportReport = function () {
    const issue = current();
    if (!isShareOwnership(issue)) return previousExportReport();
    const analysis = buildAnalysis(answers);
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, `Risk assessment: ${riskText(assessRisk(answers))}`, "", "DILIGENCE ANSWERS", ...visibleQuestions(issue).map(({ id, question }) => `- ${question}\n  Response: ${labelFor(id)}`),
      ...(analysis ? ["", "SUMMARY", analysis.summary, "", "KEY DEAL IMPLICATIONS", ...analysis.implications.map(item => `- ${item}`),
        "", `RECOMMENDED ACTIONS (${getTransactionSide()})`, ...actionsFor(answers, getTransactionSide()).map(action => `- ${action.title} (${action.priority})\n  ${action.description}`),
        "", "LEGAL NOTES", ...legalNotes.map(note => `${note.title}: ${note.text}\nSource: ${note.source} — ${note.url}`)] : []),
      "", "NOTE", "Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${issue.id}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
})();
