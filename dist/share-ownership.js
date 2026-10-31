/* Share ownership: Option Holders presentation with a facts-only questionnaire. */
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
  const visible = id => !fields[id].parent || fields[id].showFor.includes(answers[fields[id].parent]);
  const visibleQuestions = issue => issue.key_questions.filter(question => visible(question.id));
  const labelFor = id => fields[id].options.find(([value]) => value === answers[id])?.[1] || "Unanswered";
  const questionMarkup = ({ id, question }) => `<div class="question"><div class="question-top"><label for="${id}">${escape(question)}</label><button class="info" type="button" aria-label="${escape(`Guidance: ${question}`)}">i<span class="tooltip">${escape(fields[id].guidance)}</span></button></div><select id="${id}"><option value="" ${!answers[id] ? "selected" : ""}>Unanswered</option>${fields[id].options.map(([value, label]) => `<option value="${value}" ${answers[id] === value ? "selected" : ""}>${escape(label)}</option>`).join("")}</select></div>`;

  const previousRenderLogic = renderLogic;
  renderLogic = function (issue) {
    if (!isShareOwnership(issue)) return previousRenderLogic(issue);
    document.querySelector("#recommendations-card")?.remove();
    const card = document.querySelector("#logic-card");
    card.classList.add("coc-deal-logic", "logic-standby");
    // Keep the copied Option Holders standby tile until tailored logic is agreed.
    card.innerHTML = `<h3>Apply deal logic</h3><p>Turn the recorded facts into a clear transaction response.</p>`;
  };

  const previousRenderPanel = renderPanel;
  renderPanel = function () {
    previousRenderPanel();
    const issue = current();
    if (!isShareOwnership(issue)) return;
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
        Object.keys(fields).filter(key => !visible(key)).forEach(key => delete answers[key]);
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
    const report = ["DEALLOGIC ISSUE REPORT", "", issue.title, `${areas[issue.category]} · ${issue.jurisdiction.primary}`, "", "DILIGENCE ANSWERS", ...visibleQuestions(issue).map(({ id, question }) => `- ${question}\n  Response: ${labelFor(id)}`), "", "NOTE", "Questionnaire only. Tailored risk assessment and deal logic are not yet configured."].join("\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${issue.id}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
})();
