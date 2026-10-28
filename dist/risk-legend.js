(() => {
  const levels = Object.freeze(["No risk", "Low risk", "Medium risk", "High risk", "Very high risk"]);
  const items = () => `<ul class="risk-legend-items">${levels.map((label, index) => `<li><span class="risk-legend-swatch" data-risk-level="${index + 1}" aria-hidden="true"></span><span>${index + 1}/5 · ${label}</span></li>`).join("")}</ul>`;
  const markup = (collapsible = false) => collapsible
    ? `<details class="risk-legend hub-risk-legend"><summary>Risk colour guide</summary>${items()}</details>`
    : `<div class="risk-legend" role="group" aria-label="Risk colour legend">${items()}</div>`;
  window.DealLogicRiskLegend = Object.freeze({ levels, markup });
})();
