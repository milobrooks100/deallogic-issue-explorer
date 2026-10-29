/* An on-demand tour of the real workspace. It does not change deal data. */
(() => {
  const navigation = document.querySelector(".workspace-navigation");
  const settingsPanel = document.querySelector(".settings-panel");
  if (!navigation || !settingsPanel || !window.showDealLogicView) return;
  const dismissalKey = "deallogic:tour-sidebar-dismissed";

  const settingsHelp = document.createElement("button");
  settingsHelp.type = "button";
  settingsHelp.className = "tour-settings-button";
  settingsHelp.innerHTML = '<i data-lucide="circle-help" aria-hidden="true"></i><span>Getting started with Deal Logic</span>';
  const settingsSection = document.createElement("section");
  settingsSection.className = "settings-section tour-settings";
  settingsSection.append(settingsHelp);
  settingsPanel.append(settingsSection);
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.75 } });

  function mountSidebarHelp() {
    const slot = document.querySelector(".project-rail-account");
    if (!slot || slot.previousElementSibling?.classList.contains("tour-launcher") || DealLogicStorage.getItem(dismissalKey) === "true") return;
    const launcher = document.createElement("div");
    launcher.className = "tour-launcher";
    launcher.innerHTML = '<div class="tour-launcher-row"><button type="button" class="tour-help"><i data-lucide="circle-help" aria-hidden="true"></i><span>Getting started</span></button><button type="button" class="tour-dismiss" aria-label="Remove Getting started from sidebar" title="Remove Getting started from sidebar">&times;</button></div>';
    slot.before(launcher);
    launcher.querySelector(".tour-help").addEventListener("click", startTour);
    launcher.querySelector(".tour-dismiss").addEventListener("click", () => {
      DealLogicStorage.setItem(dismissalKey, "true");
      launcher.classList.add("is-dismissing");
      const finish = () => { launcher.remove(); document.querySelector(".project-rail-account .account-entry")?.focus(); };
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
      else setTimeout(finish, 380);
    });
    window.lucide?.createIcons({ attrs: { "stroke-width": 1.75 } });
  }
  mountSidebarHelp();
  document.addEventListener("deal-project-rail-rendered", mountSidebarHelp);

  const steps = [
    { title: "Welcome to Deal Logic", body: "Built for lawyers, advisers and dealmakers, Deal Logic brings the moving parts of an M&A deal into focus. Explore legal issues, uncover company insights and turn what you find into a clear plan of action.", kind: "welcome" },
    { title: "Keep each deal together", body: "Create a deal here to keep its answers and actions separate. The quick workspace is available when you want to explore first.", view: "deal-map", target: ".project-rail-head" },
    { title: "Explore a legal issue", body: "In Deal Map, choose a common legal issue and answer a few questions. You’ll see a risk assessment and recommended actions tailored to the facts you enter.", view: "deal-map", target: ".map:not(.screen-hidden)" },
    { title: "Choose a transaction perspective", body: "Switch transaction perspective at any time to tailor the recommended actions.", view: "deal-map", target: ".transaction-side-options button:first-child", fallbackTarget: ".transaction-side" },
    { title: "Build an action plan", body: "Save recommended actions to Deal Hub. Use the summary, task board and table to review and track your action items.", view: "deal-hub", target: ".hub-tabs button:first-child", targetEnd: ".hub-tabs button:last-child" },
    { title: "Find more deal actions", body: "In the Action Library view common M&A responses or browse all available actions for each legal issue. Add useful actions to Deal Hub.", view: "action-library", target: ".library-tabs button:first-child", targetEnd: ".library-tabs button:last-child" },
    { title: "Check the company record", body: "Search Companies House data in Company Radar to find the right legal entity, review key points and add actions to Deal Hub.", view: "company-radar", target: ".radar-search" },
    { title: "Choose how your work is saved", body: "Guest work stays in your browser. Create an account to save your work to the cloud, customise the app and more.", view: "settings", target: ".project-rail-account .account-entry", fallbackTarget: ".project-rail-account" },
    { title: "You're ready to explore", kind: "finish" }
  ];

  const overlay = document.createElement("div");
  overlay.className = "tour-overlay";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "tour-title");
  document.body.append(overlay);
  const workspace = document.querySelector("main");
  let index = -1, initialView = "deal-map", returnFocus = settingsHelp, target = null, targetEnd = null, positioning = false;

  const dots = () => `<div class="tour-dots" aria-hidden="true">${steps.map((_, step) => `<span class="${step === index ? "active" : ""}"></span>`).join("")}</div>`;
  const foot = () => `<div class="tour-footer">${dots()}<div class="tour-actions">${index === 0 ? '<button type="button" class="tour-back" data-tour-skip>Skip</button>' : '<button type="button" class="tour-back" data-tour-back>Back</button>'}<button type="button" class="tour-next" data-tour-next>${index === steps.length - 1 ? "Explore Deal Logic" : "Next"}</button></div></div>`;
  const hero = () => '<div class="tour-hero" aria-hidden="true"><div class="tour-hero-icon"><img src="./deallogic-mark.svg" alt=""></div></div>';
  const card = step => `<div class="tour-card ${step.kind ? `tour-card-${step.kind}` : "tour-card-tip"}" role="document">${step.kind ? "" : '<button type="button" class="tour-close" data-tour-close aria-label="Close tour">&times;</button>'}${step.kind ? hero() : ""}<h2 id="tour-title">${step.title}</h2>${step.body ? `<p>${step.body}</p>` : ""}${foot()}</div>`;
  const anchor = step => {
    const wanted = document.querySelector(step.target);
    if (wanted && wanted.getClientRects().length) return wanted;
    const fallback = step.fallbackTarget && document.querySelector(step.fallbackTarget);
    if (fallback && fallback.getClientRects().length) return fallback;
    return document.querySelector(`[data-workspace-view="${step.view}"]`) || navigation;
  };
  const clamp = (value, low, high) => Math.max(low, Math.min(value, high));

  function position() {
    if (index < 0 || steps[index].kind || !target || positioning) return;
    positioning = true;
    requestAnimationFrame(() => {
      positioning = false;
      if (index < 0 || !target?.isConnected) return;
      const rect = target.getBoundingClientRect();
      const endRect = targetEnd?.isConnected ? targetEnd.getBoundingClientRect() : rect;
      const pad = 7;
      const left = clamp(Math.min(rect.left, endRect.left) - pad, 8, innerWidth - 8);
      const top = clamp(Math.min(rect.top, endRect.top) - pad, 8, innerHeight - 8);
      const right = clamp(Math.max(rect.right, endRect.right) + pad, 8, innerWidth - 8);
      const bottom = clamp(Math.max(rect.bottom, endRect.bottom) + pad, 8, innerHeight - 8);
      Object.assign(overlay.querySelector(".tour-spotlight").style, { left: `${left}px`, top: `${top}px`, width: `${Math.max(0, right - left)}px`, height: `${Math.max(0, bottom - top)}px` });
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
    targetEnd = null;
    if (step.kind) {
      overlay.classList.add("tour-modal");
      overlay.innerHTML = `<div class="tour-full-shade"></div>${card(step)}`;
    } else {
      overlay.classList.remove("tour-modal");
      window.showDealLogicView(step.view);
      target = anchor(step);
      targetEnd = step.targetEnd ? document.querySelector(step.targetEnd) : null;
      overlay.innerHTML = `<div class="tour-spotlight" aria-hidden="true"></div>${card(step)}`;
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
    targetEnd = null;
    window.showDealLogicView(goToMap ? "deal-map" : initialView);
    workspace.inert = false;
    returnFocus?.focus();
  }
  function startTour() {
    if (index >= 0) return;
    initialView = document.querySelector("[data-workspace-view].active")?.dataset.workspaceView || "deal-map";
    returnFocus = document.activeElement;
    workspace.inert = true;
    show(0);
  }
  settingsHelp.addEventListener("click", startTour);
  overlay.addEventListener("click", event => {
    if (event.target.closest("[data-tour-close]")) end();
    if (event.target.closest("[data-tour-skip]")) end();
    if (event.target.closest("[data-tour-back]") && index > 0) show(index - 1);
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
