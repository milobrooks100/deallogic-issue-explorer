/* Shared deal-logic tile for issue areas whose substantive rules are pending. */
(() => {
  const issueIds = new Set([
    "threatened-litigation",
    "debt-facilities-repayment"
  ]);
  const priorRenderLogic = renderLogic;
  const actionPriority = relevance => ({
    required: "Required",
    recommended: "Recommended"
  }[relevance] || "Consider");

  const actionMarkup = actions => actions.length
    ? actions.map(action => {
      const priority = actionPriority(action.relevance);
      const title = escapeLogicText(titleCase(action.type || "Action"));
      const description = escapeLogicText(action.recommendation || "Filler — action detail to be confirmed.");
      return `<div class="logic-action"><span class="logic-icon">◌</span><div><span class="logic-priority" data-level="${priority.toLowerCase()}">${priority}</span><strong>${title}</strong><span>${description}</span></div></div>`;
    }).join("")
    : `<p>Filler — recommended actions will be added once this issue’s deal logic is finalised.</p>`;

  renderLogic = function (issue) {
    if (!issueIds.has(issue?.id)) return priorRenderLogic(issue);

    const logicCard = document.querySelector("#logic-card");
    const protectionsCard = document.querySelector("#recommendations-card");
    protectionsCard?.remove();
    logicCard.classList.add("coc-deal-logic");

    const actions = (issue.recommended_actions || []).slice(0, 3);
    const summary = escapeLogicText(issue.summary || "Filler — issue summary to be confirmed.");
    const implication = "Draft template — the tailored trigger analysis and transaction response will be added once the substantive deal logic is finalised.";
    const notes = escapeLogicText(issue.notes || "Filler — issue-specific legal notes will be added during content finalisation.");

    logicCard.innerHTML = `<h3>Apply deal logic</h3><section class="logic-section"><h4>Summary</h4><p class="logic-conclusion">${summary}</p></section><section class="logic-section"><h4>Key deal implications</h4><ul><li>${implication}</li></ul></section><section class="logic-section"><div class="logic-section-heading"><h4>Recommended actions</h4></div>${actionMarkup(actions)}</section><section class="logic-section"><h4>Notes</h4><div class="logic-note">${notes}</div></section>`;
  };
})();
