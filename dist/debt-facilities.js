/* Debt facilities: diligence questions and risk only. Deal logic remains a draft template. */
(() => {
  const issueId = "debt-facilities-repayment";
  const ids = ["debt-obligations", "debt-transaction-effect", "debt-payoff", "debt-consent", "debt-funding", "debt-releases", "debt-completion-sequence"];
  const options = {
    "debt-obligations": ["Unanswered", "No — confirmed from finance documents and charge records", "Yes — finance obligations or security exist", "Possibly — records are incomplete", "Not yet checked"],
    "debt-transaction-effect": ["Unanswered", "None — no repayment, consent or waiver required", "Repayment or cancellation required", "Lender consent or waiver required to continue", "Both repayment and lender consent or waiver required", "Unclear — documents or transaction analysis incomplete"],
    "debt-payoff": ["Unanswered", "Yes — current written payoff covers all amounts and release conditions", "Partly — figures or conditions remain open", "No — no written payoff obtained", "Not yet requested"],
    "debt-consent": ["Unanswered", "Yes — written consent or waiver is effective", "Agreed in principle, but not signed", "No — lender has declined or required terms are unmet", "Not yet sought"],
    "debt-funding": ["Unanswered", "Yes — sufficient committed funds and agreed funds flow", "Expected, but funding or funds flow is not final", "No — shortfall or timing gap", "Not yet assessed"],
    "debt-releases": ["Unanswered", "No target-group security or guarantees to release — confirmed", "Yes — all required releases are agreed for completion", "Partly — some releases remain outstanding", "No — required releases are unresolved", "Not yet mapped"],
    "debt-completion-sequence": ["Unanswered", "Yes — all required steps are coordinated for completion", "Partly — steps agreed in principle", "No — a completion dependency is unresolved", "Not yet agreed"]
  };
  const guidance = {
    "debt-obligations": "Check facility and security documents, guarantees, hedging documents and Companies House charge records for each target-group company.",
    "debt-transaction-effect": "Read the change-of-control, mandatory prepayment, cancellation, default and consent terms against the proposed share sale.",
    "debt-payoff": "Obtain the lender's current written figure, including principal, interest, fees, break costs and any hedging close-out, plus the release conditions.",
    "debt-consent": "Confirm that a signed lender consent or waiver covers the transaction and is effective before the relevant deadline.",
    "debt-funding": "Check that committed completion funds cover the full payoff and can reach the lender when required.",
    "debt-releases": "Map each target-group charge, guarantee and other credit support to an agreed release. Record any post-completion register update separately.",
    "debt-completion-sequence": "Check the agreed funds flow, payment instructions, release delivery and any escrow or undertaking so no step depends on an unsecured promise."
  };
  const repaymentRequired = effect => effect === options["debt-transaction-effect"][2] || effect === options["debt-transaction-effect"][4];
  const consentRequired = effect => effect === options["debt-transaction-effect"][3] || effect === options["debt-transaction-effect"][4];
  const isDebt = () => current()?.id === issueId;
  const answer = id => answers[id] || "Unanswered";
  const isKnown = value => value !== "Unanswered";

  const debtRiskScore = () => {
    const existence = answer(ids[0]);
    if (existence === options[ids[0]][1]) return 1;
    if (existence === "Not yet checked") return 2;
    if (!isKnown(existence)) return 1;
    const possible = existence === options[ids[0]][3];
    const effect = answer(ids[1]);
    if (effect === options[ids[1]][1]) return possible ? 3 : 1;
    if (effect === options[ids[1]][5]) return 3;
    if (!isKnown(effect)) return possible ? 3 : 2;

    let score = 3;
    if (repaymentRequired(effect)) {
      const payoff = answer(ids[2]);
      const funding = answer(ids[4]);
      const releases = answer(ids[5]);
      if (payoff === options[ids[2]][2] || payoff === options[ids[2]][3] || payoff === options[ids[2]][4]) score = Math.max(score, 4);
      if (funding === options[ids[4]][2]) score = Math.max(score, 3);
      if (funding === options[ids[4]][3]) score = 5;
      if (funding === options[ids[4]][4]) score = Math.max(score, 4);
      if (releases === options[ids[5]][3] || releases === options[ids[5]][5]) score = Math.max(score, 4);
      if (releases === options[ids[5]][4]) score = 5;
    }
    if (consentRequired(effect)) {
      const consent = answer(ids[3]);
      if (consent === options[ids[3]][2]) score = Math.max(score, 3);
      if (consent === options[ids[3]][4]) score = Math.max(score, 4);
      if (consent === options[ids[3]][3]) score = 5;
    }
    const sequence = answer(ids[6]);
    if (sequence === options[ids[6]][2]) score = Math.max(score, 3);
    if (sequence === options[ids[6]][4]) score = Math.max(score, 4);
    if (sequence === options[ids[6]][3]) score = 5;

    const payoffReady = !repaymentRequired(effect) || answer(ids[2]) === options[ids[2]][1];
    const fundingReady = !repaymentRequired(effect) || answer(ids[4]) === options[ids[4]][1];
    const releasesReady = !repaymentRequired(effect) || [options[ids[5]][1], options[ids[5]][2]].includes(answer(ids[5]));
    const consentReady = !consentRequired(effect) || answer(ids[3]) === options[ids[3]][1];
    if (!possible && payoffReady && fundingReady && releasesReady && consentReady && sequence === options[ids[6]][1]) return 2;
    return score;
  };

  const previousRiskScore = riskScore;
  riskScore = function () { return isDebt() ? debtRiskScore() : previousRiskScore(); };

  const question = (issue, id) => {
    const detail = issue.key_questions.find(item => item.id === id);
    if (!detail) return "";
    return `<div class="question"><div class="question-top"><label for="${id}">${detail.question}</label><button class="info" type="button" aria-label="Guidance for this question">i<span class="tooltip">${guidance[id]}</span></button></div><select id="${id}">${options[id].map(value => `<option ${answer(id) === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>`;
  };
  const debtQuestions = issue => {
    const existence = answer(ids[0]);
    const effect = answer(ids[1]);
    const showEffect = existence === options[ids[0]][2] || existence === options[ids[0]][3];
    const showFollowUp = showEffect && isKnown(effect) && effect !== options[ids[1]][1] && effect !== options[ids[1]][5];
    return [
      question(issue, ids[0]),
      showEffect ? question(issue, ids[1]) : "",
      showFollowUp && repaymentRequired(effect) ? question(issue, ids[2]) : "",
      showFollowUp && consentRequired(effect) ? question(issue, ids[3]) : "",
      showFollowUp && repaymentRequired(effect) ? question(issue, ids[4]) : "",
      showFollowUp && repaymentRequired(effect) ? question(issue, ids[5]) : "",
      showFollowUp ? question(issue, ids[6]) : ""
    ].join("");
  };

  const previousRenderPanel = renderPanel;
  renderPanel = function () {
    previousRenderPanel();
    if (!isDebt()) return;
    const card = document.querySelector(".content-grid > .card");
    if (!card) return;
    const heading = card.querySelector("h3");
    card.replaceChildren(heading);
    card.insertAdjacentHTML("beforeend", debtQuestions(current()));
    card.querySelectorAll("select").forEach(select => {
      select.onchange = event => {
        const id = event.target.id;
        answers[id] = event.target.value;
        if (id === ids[0] || id === ids[1]) {
          const index = ids.indexOf(id);
          ids.slice(index + 1).forEach(dependent => delete answers[dependent]);
        }
        DealLogicStorage.setItem(storedKey(), JSON.stringify(answers));
        renderPanel();
      };
    });
  };
})();
