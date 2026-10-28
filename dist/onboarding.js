/* First-use guidance. The example is a preview and never writes deal data. */
(() => {
  const seenKey = view => `deallogic:guide-seen:${view}:v1`;
  const views = {
    "deal-map": ["Deal Map", "Choose an issue, record the diligence facts, then review the changing risk assessment and proposed deal response."],
    "deal-hub": ["Deal Hub", "Bring actions here from an issue or the Action Library. Use the task board to track each action through negotiation and completion."],
    "action-library": ["Action Library", "Browse transaction tools and issue playbooks, then add relevant actions to the active deal."],
    "company-radar": ["Company Radar", "Look up the correct legal entity on Companies House and review public register facts alongside your deal work."],
    settings: ["Settings", "Manage your account and workspace appearance here. A signed-in account saves your deal progress across devices."]
  };
  const main = document.querySelector("main");
  if (!main || !window.showDealLogicView || !window.DealLogicStorage) return;

  const tip = document.createElement("aside");
  tip.className = "guide-tip screen-hidden";
  tip.setAttribute("aria-label", "Getting started tip");
  main.querySelector(".workspace-context")?.insertAdjacentElement("afterend", tip);

  const railNav = document.querySelector(".workspace-navigation");
  const help = document.createElement("button");
  help.type = "button";
  help.className = "guide-help";
  help.innerHTML = '<i data-lucide="circle-help" aria-hidden="true"></i><span>Getting started</span>';
  railNav?.append(help);
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.75 } });

  const dialog = document.createElement("dialog");
  dialog.className = "guide-dialog";
  dialog.setAttribute("aria-labelledby", "guide-title");
  document.body.append(dialog);
  let returnFocus = null;
  let sample = { step: 0, clause: null, trigger: null };
  const close = () => dialog.close();
  dialog.addEventListener("close", () => returnFocus?.focus());

  const guideOverview = () => {
    dialog.innerHTML = `<div class="guide-dialog-head"><span class="eyebrow">Getting started</span><button type="button" class="guide-close" data-guide-close aria-label="Close getting started">×</button></div>
      <h2 id="guide-title">From issue to action plan</h2>
      <p class="guide-lede">Deal Logic helps you record a diligence finding, consider its risk and turn it into work for a transaction.</p>
      <ol class="guide-overview-steps"><li><strong>Explore</strong><span>Open a legal issue in Deal Map.</span></li><li><strong>Assess</strong><span>Record facts and review the risk assessment and suggested response.</span></li><li><strong>Act</strong><span>Save relevant actions to Deal Hub and track their status.</span></li></ol>
      <div class="guide-details"><p><strong>Transaction side:</strong> Choose Buyer, Seller or Balanced to shape the proposed response.</p><p><strong>Saving work:</strong> Guest progress stays in this browser. A verified account syncs saved deals and settings across devices. The quick workspace holds unassigned work.</p><p><strong>Professional review:</strong> The content is a starting point for analysis, not legal advice. Check it against the deal, documents and jurisdiction.</p></div>
      <div class="guide-dialog-actions"><button type="button" class="guide-primary" data-guide-example>Try the example</button><button type="button" class="guide-secondary" data-guide-go>Go to Deal Map</button></div>`;
  };

  const sampleRisk = () => {
    if (sample.clause === "no" || sample.trigger === "no") return { label: "No risk indicated for this clause", level: 1, action: "Record why consent is not needed" };
    return { label: "Consent position needs review", level: 3, action: "Review the consent requirement" };
  };
  const example = () => {
    const { step } = sample;
    const result = sampleRisk();
    const progress = `<span class="guide-progress">Example · ${Math.min(step + 1, 4)} of 4</span>`;
    const heading = step === 0 ? "A change-of-control clause" : step === 1 ? "Would this deal trigger it?" : step === 2 ? "See how the facts shape the response" : "An action in the task board";
    const content = step === 0
      ? `<p class="guide-lede">Imagine you are reviewing a customer agreement in an acquisition. Does it contain a change-of-control provision?</p><fieldset class="guide-choices"><legend>Clause present?</legend><label><input type="radio" name="guide-clause" value="yes" ${sample.clause === "yes" ? "checked" : ""}> Yes</label><label><input type="radio" name="guide-clause" value="no" ${sample.clause === "no" ? "checked" : ""}> No</label></fieldset>`
      : step === 1
        ? `<p class="guide-lede">The agreement has a clause. Does the proposed transaction trigger it?</p><fieldset class="guide-choices"><legend>Transaction triggers the clause?</legend><label><input type="radio" name="guide-trigger" value="yes" ${sample.trigger === "yes" ? "checked" : ""}> Yes</label><label><input type="radio" name="guide-trigger" value="no" ${sample.trigger === "no" ? "checked" : ""}> No</label><label><input type="radio" name="guide-trigger" value="unclear" ${sample.trigger === "unclear" ? "checked" : ""}> Not yet clear</label></fieldset>`
        : step === 2
          ? `<p class="guide-lede">The Deal Map uses answers like these to update its risk assessment and suggested protections.</p><div class="guide-assessment"><span>Illustrative assessment</span><strong>${result.label}</strong><div class="guide-risk-bar" aria-label="Illustrative risk level ${result.level} of 5">${[1,2,3,4,5].map(n => `<span class="s${n}${n <= result.level ? " active" : ""}"></span>`).join("")}</div><p>In the live issue, answer the remaining questions and review the full reasoning before choosing an action.</p></div>`
          : `<p class="guide-lede">Save a relevant action to Deal Hub, then assign its status as the deal progresses.</p><div class="guide-sample-board"><div class="guide-sample-column"><span>To Review <b>1</b></span><div class="guide-sample-action"><strong>${result.action}</strong><small>Change-of-Control Clause</small></div></div><div class="guide-sample-column muted"><span>In Negotiation <b>0</b></span></div></div><p class="guide-sample-note">This is a preview. Your deal and account data have not changed.</p>`;
    dialog.innerHTML = `<div class="guide-dialog-head">${progress}<button type="button" class="guide-close" data-guide-close aria-label="Close example">×</button></div><h2 id="guide-title">${heading}</h2>${content}<div class="guide-dialog-actions">${step > 0 ? '<button type="button" class="guide-secondary" data-guide-back>Back</button>' : ""}<button type="button" class="guide-primary" data-guide-next ${step === 0 && !sample.clause || step === 1 && !sample.trigger ? "disabled" : ""}>${step === 2 ? "Add sample action" : step === 3 ? "Explore Deal Map" : "Continue"}</button></div>`;
  };
  const open = mode => {
    if (!dialog.open) returnFocus = document.activeElement;
    if (mode === "example") { sample = { step: 0, clause: null, trigger: null }; example(); }
    else guideOverview();
    if (!dialog.open) dialog.showModal();
  };
  const showTip = view => {
    if (!views[view] || document.querySelector(".project-start:not(.screen-hidden)")) { tip.classList.add("screen-hidden"); return; }
    if (DealLogicStorage.getItem(seenKey(view))) { tip.classList.add("screen-hidden"); return; }
    const [title, description] = views[view];
    tip.innerHTML = `<div><span class="guide-tip-label">First time here</span><strong>${title}</strong><p>${description}</p></div><div class="guide-tip-actions"><button type="button" data-guide-open>See the guide</button><button type="button" data-guide-dismiss aria-label="Dismiss ${title} tip">Dismiss</button></div>`;
    tip.dataset.view = view;
    tip.classList.remove("screen-hidden");
  };

  document.addEventListener("click", event => {
    if (event.target.closest("[data-guide-example]")) open("example");
    if (event.target.closest("[data-guide-start]")) document.querySelector("[data-start-project] [name=name]")?.focus();
    if (event.target.closest("[data-guide-open]")) open("overview");
    if (event.target.closest("[data-guide-dismiss]")) {
      DealLogicStorage.setItem(seenKey(tip.dataset.view), "true");
      tip.classList.add("screen-hidden");
    }
  });
  help.addEventListener("click", () => open("overview"));
  dialog.addEventListener("change", event => {
    if (event.target.name === "guide-clause") { sample.clause = event.target.value; dialog.querySelector("[data-guide-next]").disabled = false; }
    if (event.target.name === "guide-trigger") { sample.trigger = event.target.value; dialog.querySelector("[data-guide-next]").disabled = false; }
  });
  dialog.addEventListener("click", event => {
    if (event.target.closest("[data-guide-close]")) close();
    if (event.target.closest("[data-guide-back]")) { sample.step = sample.step === 2 && sample.clause === "no" ? 0 : sample.step - 1; example(); }
    if (event.target.closest("[data-guide-next]")) {
      if (sample.step === 3) { if (document.querySelector(".project-start")) returnFocus = document.querySelector("[data-start-project] [name=name]"); close(); window.showDealLogicView("deal-map"); return; }
      sample.step = sample.step === 0 && sample.clause === "no" ? 2 : sample.step + 1;
      example();
    }
    if (event.target.closest("[data-guide-go]")) { if (document.querySelector(".project-start")) returnFocus = document.querySelector("[data-start-project] [name=name]"); close(); window.showDealLogicView("deal-map"); }
  });
  const originalShow = window.showDealLogicView;
  window.showDealLogicView = view => { originalShow(view); showTip(view); };
  if (getDealProjects().onboardingSeen) showTip("deal-map");
})();
