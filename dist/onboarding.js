/* An on-demand tour of the real workspace. It does not change deal data. */
(() => {
  const navigation = document.querySelector(".workspace-navigation");
  if (!navigation || !window.showDealLogicView) return;

  const help = document.createElement("button");
  help.type = "button";
  help.className = "tour-help";
  help.innerHTML = '<i data-lucide="circle-help" aria-hidden="true"></i><span>Getting started</span>';
  navigation.append(help);
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.75 } });

  const steps = [
    { title: "Welcome to Deal Logic", body: "A quick tour of how to explore a legal issue, assess the facts and turn recommendations into a deal action plan.", kind: "welcome" },
    { title: "Keep each deal together", body: "Create a deal here to keep its answers and actions separate. The quick workspace is available when you want to explore first.", view: "deal-map", target: ".project-rail-head" },
    { title: "Explore a legal issue", body: "In Deal Map, choose an issue and record what the diligence tells you. The risk assessment and proposed protections respond to the facts.", view: "deal-map", target: ".map:not(.screen-hidden)" },
    { title: "Build an action plan", body: "Save relevant recommendations to Deal Hub. Switch between the summary, task board and table to track what happens next.", view: "deal-hub", target: ".hub-tabs" },
    { title: "Find more deal actions", body: "Action Library has core M&A responses and full issue playbooks. Add useful actions to the active deal.", view: "action-library", target: ".library-tabs" },
    { title: "Check the company record", body: "Company Radar uses public Companies House information. Search for the right legal entity and review the points that need attention.", view: "company-radar", target: ".radar-search" },
    { title: "Choose how your work is saved", body: "Guest work stays in this browser. In Settings, a verified account can sync saved deals and preferences across devices.", view: "settings", target: ".account-settings h3" },
    { title: "You’re ready to explore", body: "Start with a legal issue, review the result against the transaction documents, and add the actions you want to track in Deal Hub.", kind: "finish" }
  ];

  const overlay = document.createElement("div");
  overlay.className = "tour-overlay";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "tour-title");
  document.body.append(overlay);
  const workspace = document.querySelector("main");
  let index = -1, initialView = "deal-map", returnFocus = help, target = null, positioning = false;

  const dots = () => `<div class="tour-dots" aria-hidden="true">${steps.map((_, step) => `<span class="${step === index ? "active" : ""}"></span>`).join("")}</div>`;
  const foot = () => `<div class="tour-actions"><button type="button" class="tour-skip" data-tour-skip>${index === steps.length - 1 ? "Close" : "Skip"}</button><button type="button" class="tour-next" data-tour-next>${index === steps.length - 1 ? "Explore Deal Map" : "Next"}</button></div>`;
  const hero = () => '<div class="tour-hero" aria-hidden="true"><div class="tour-hero-icon"><img src="./deallogic-mark.svg" alt=""></div></div>';
  const card = step => `<div class="tour-card ${step.kind ? `tour-card-${step.kind}` : "tour-card-tip"}" role="document">${step.kind ? hero() : `<span class="tour-step-label">A tour of Deal Logic · ${index + 1} of ${steps.length}</span>`}<h2 id="tour-title">${step.title}</h2><p>${step.body}</p>${step.kind === "finish" ? '<p class="tour-review">Prototype content is a starting point for professional review, not legal advice.</p>' : ""}${dots()}${foot()}</div>`;
  const anchor = step => {
    const wanted = document.querySelector(step.target);
    if (wanted && wanted.getClientRects().length) return wanted;
    return document.querySelector(`[data-workspace-view="${step.view}"]`) || navigation;
  };
  const clamp = (value, low, high) => Math.max(low, Math.min(value, high));

  function position() {
    if (index < 0 || steps[index].kind || !target || positioning) return;
    positioning = true;
    requestAnimationFrame(() => {
      positioning = false;
      if (index < 0 || !target?.isConnected) return;
      const rect = target.getBoundingClientRect(), pad = 7;
      const left = clamp(rect.left - pad, 8, innerWidth - 8);
      const top = clamp(rect.top - pad, 8, innerHeight - 8);
      const right = clamp(rect.right + pad, 8, innerWidth - 8);
      const bottom = clamp(rect.bottom + pad, 8, innerHeight - 8);
      const [north, east, south, west] = overlay.querySelectorAll(".tour-shade");
      Object.assign(north.style, { left: "0px", top: "0px", width: "100vw", height: `${top}px` });
      Object.assign(south.style, { left: "0px", top: `${bottom}px`, width: "100vw", height: `${Math.max(0, innerHeight - bottom)}px` });
      Object.assign(west.style, { left: "0px", top: `${top}px`, width: `${left}px`, height: `${Math.max(0, bottom - top)}px` });
      Object.assign(east.style, { left: `${right}px`, top: `${top}px`, width: `${Math.max(0, innerWidth - right)}px`, height: `${Math.max(0, bottom - top)}px` });
      Object.assign(overlay.querySelector(".tour-ring").style, { left: `${left}px`, top: `${top}px`, width: `${Math.max(0, right - left)}px`, height: `${Math.max(0, bottom - top)}px` });
      const popover = overlay.querySelector(".tour-card"), width = popover.offsetWidth, height = popover.offsetHeight, gap = 17;
      let x, y;
      if (right + gap + width <= innerWidth - 12) { x = right + gap; y = clamp(top, 12, innerHeight - height - 12); }
      else if (left - gap - width >= 12) { x = left - gap - width; y = clamp(top, 12, innerHeight - height - 12); }
      else if (bottom + gap + height <= innerHeight - 12) { x = clamp(left, 12, innerWidth - width - 12); y = bottom + gap; }
      else { x = clamp(left, 12, innerWidth - width - 12); y = clamp(top - gap - height, 12, innerHeight - height - 12); }
      Object.assign(popover.style, { left: `${x}px`, top: `${y}px` });
    });
  }

  function show(next) {
    index = next;
    const step = steps[index];
    overlay.hidden = false;
    target = null;
    if (step.kind) {
      overlay.classList.add("tour-modal");
      overlay.innerHTML = `<div class="tour-full-shade"></div>${card(step)}`;
    } else {
      overlay.classList.remove("tour-modal");
      window.showDealLogicView(step.view);
      target = anchor(step);
      overlay.innerHTML = `<div class="tour-shade"></div><div class="tour-shade"></div><div class="tour-shade"></div><div class="tour-shade"></div><div class="tour-ring" aria-hidden="true"></div>${card(step)}`;
      target?.scrollIntoView({ block: "nearest", behavior: "instant" });
      position();
      setTimeout(position, 200);
    }
    overlay.querySelector("[data-tour-next]")?.focus();
  }
  function end(goToMap = false) {
    overlay.hidden = true;
    overlay.innerHTML = "";
    index = -1;
    target = null;
    window.showDealLogicView(goToMap ? "deal-map" : initialView);
    workspace.inert = false;
    returnFocus?.focus();
  }
  help.addEventListener("click", () => {
    if (index >= 0) return;
    initialView = document.querySelector("[data-workspace-view].active")?.dataset.workspaceView || "deal-map";
    returnFocus = document.activeElement;
    workspace.inert = true;
    show(0);
  });
  overlay.addEventListener("click", event => {
    if (event.target.closest("[data-tour-skip]")) end();
    if (event.target.closest("[data-tour-next]")) index === steps.length - 1 ? end(true) : show(index + 1);
  });
  overlay.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); end(); return; }
    if (event.key !== "Tab") return;
    const buttons = [...overlay.querySelectorAll("button:not(:disabled)")];
    if (!buttons.length) return;
    if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
  });
  window.addEventListener("resize", position);
  window.addEventListener("scroll", position, true);
})();
