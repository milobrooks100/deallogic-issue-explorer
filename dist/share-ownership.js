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

  const previousRenderLogic = renderLogic;
  renderLogic = function (issue) {
    if (!isShareOwnership(issue)) return previousRenderLogic(issue);
    document.querySelector("#recommendations-card")?.remove();
    const card = document.querySelector("#logic-card");
    const analysis = buildAnalysis(answers);
    card.classList.add("coc-deal-logic");
    card.classList.toggle("logic-standby", !analysis);
    card.innerHTML = analysis
      ? `<h3>Apply deal logic</h3><section class="logic-section"><h4>Summary</h4><p class="logic-conclusion">${escape(analysis.summary)}</p></section><section class="logic-section"><h4>Key deal implications</h4><ul>${analysis.implications.map(item => `<li>${escape(item)}</li>`).join("")}</ul></section>`
      : `<h3>Apply deal logic</h3><p>Answer all relevant questions to generate your deal analysis.</p>`;
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
      ...(analysis ? ["", "SUMMARY", analysis.summary, "", "KEY DEAL IMPLICATIONS", ...analysis.implications.map(item => `- ${item}`)] : []),
      "", "NOTE", "Prototype content only. Obtain transaction-specific legal advice."].join("\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${issue.id}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
})();
