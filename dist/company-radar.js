(() => {
  const root = document.querySelector(".company-radar-view");
  if (!root) return;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const date = value => {
    if (!value) return "Not shown";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "Not shown" : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const status = value => { const label = String(value || "Not shown").replaceAll("-", " "); return label[0].toUpperCase() + label.slice(1); };
  const roles = ["Target", "Buyer", "Seller", "Subsidiary", "Other"];
  const cache = new Map();
  let data = null, loading = false, error = "", results = [], searchError = "", searching = false, searchTimer = 0, searchSequence = 0, searchQuery = "";
  let activeNumber = "", requestSequence = 0, filingFilter = "All", roleMenuOpen = false;
  const snapshotFields = [
    ["name", "Registered name"], ["status", "Register status"], ["address", "Registered office"],
    ["accountsDue", "Accounts due date"], ["accountsOverdue", "Accounts overdue marker"],
    ["confirmationDue", "Confirmation statement due date"], ["confirmationOverdue", "Confirmation statement overdue marker"],
    ["officers", "Current officers"], ["psc", "Current PSC entries"], ["charges", "Open charges"], ["latestFiling", "Latest filing"]
  ];

  function radarStore() {
    const project = activeDealProject();
    if (!project.companyRadar || !Array.isArray(project.companyRadar.companies)) return { companies: [], selectedNumber: "" };
    return project.companyRadar;
  }
  function saveRadar(update) {
    const store = getDealProjects();
    const project = store.projects.find(item => item.id === store.activeProjectId);
    if (!project) return;
    project.companyRadar = update;
    saveDealProjects(store);
  }
  function snapshot(item) {
    return {
      name: item.name, status: item.status, address: item.address,
      accountsDue: item.accounts?.next_accounts?.due_on || "", accountsOverdue: item.accounts?.next_accounts?.overdue === true,
      confirmationDue: item.confirmationStatement?.next_due || "", confirmationOverdue: item.confirmationStatement?.overdue === true,
      officers: (item.officers || []).map(person => person.name).sort().join("; "),
      psc: (item.psc || []).map(person => person.name).sort().join("; "),
      charges: (item.charges || []).length,
      latestFiling: item.filings?.[0]?.id || ""
    };
  }
  function saveSnapshot(item) {
    const radar = radarStore();
    const entry = radar.companies.find(company => company.number === item.number);
    if (!entry) return;
    const next = snapshot(item);
    const sectionKeys = { officers: ["officers"], psc: ["psc"], charges: ["charges"], filings: ["latestFiling"] };
    for (const [section, keys] of Object.entries(sectionKeys)) {
      if (item.sections?.[section] === "ok" || item.sections?.[section] === "not-listed") continue;
      for (const key of keys) next[key] = entry.snapshot?.[key] ?? next[key];
    }
    if (entry.snapshot) {
      const changes = snapshotFields.filter(([key]) => JSON.stringify(entry.snapshot[key]) !== JSON.stringify(next[key])).map(([, label]) => label);
      if (changes.length) entry.changes = { at: item.fetchedAt, items: changes };
    }
    entry.snapshot = next;
    entry.lastCheckedAt = item.fetchedAt;
    saveRadar(radar);
  }
  function selectedNumber() {
    const radar = radarStore();
    return radar.companies.some(item => item.number === radar.selectedNumber) ? radar.selectedNumber : radar.companies[0]?.number || "";
  }
  function sourceLink(url, label = "View on Companies House") {
    return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
  }
  function flagMarkup(flag, number, reviews = {}) {
    const actionable = flag.level === "red" || flag.level === "amber";
    const reviewed = reviews[flag.id] === `${flag.title}|${flag.detail}`;
    return `<article class="radar-flag radar-${esc(flag.level)}"><div class="radar-flag-top"><span class="radar-status"><span class="radar-dot" aria-hidden="true"></span>${esc(flag.level === "red" ? "Attention" : flag.level === "amber" ? "Review" : flag.level === "green" ? "No exception found" : "Not checked")}${reviewed ? " · Reviewed" : ""}</span><h4>${esc(flag.title)}</h4></div><p>${esc(flag.detail)}</p><div class="radar-flag-actions">${flag.source ? sourceLink(flag.source, "Source record") : ""}${actionable ? `<button type="button" data-radar-action="${esc(flag.id)}" data-company-number="${esc(number)}">Add action</button><button type="button" data-radar-review="${esc(flag.id)}">${reviewed ? "Mark unreviewed" : "Mark reviewed"}</button>` : ""}</div></article>`;
  }
  function fact(label, value) { return `<div class="radar-fact"><dt>${esc(label)}</dt><dd>${esc(value || "Not shown")}</dd></div>`; }
  function rolePicker(number, radar) {
    const role = radar.companies.find(item => item.number === number)?.role || "";
    return `<div class="radar-role-picker" aria-label="Role in this deal">${roleMenuOpen
      ? `<div class="radar-role-options" role="group" aria-label="Select role in this deal">${roles.map(option => `<button type="button" data-radar-role-option="${esc(option)}" class="${role === option ? "active" : ""}" aria-pressed="${role === option}">${esc(option)}</button>`).join("")}</div>`
      : `<button type="button" class="radar-role-toggle ${role ? "selected" : ""}" data-radar-role-toggle aria-expanded="false">${esc(role || "Select role in this deal")}</button>`}</div>`;
  }
  function sectionState(label, state) {
    if (state === "unavailable") return `<p class="radar-unavailable">${esc(label)} could not be checked. Try refreshing or use Companies House.</p>`;
    if (state === "partial") return `<p class="radar-unavailable">Only the first page of ${esc(label.toLowerCase())} was checked. Use Companies House for the full list.</p>`;
    return "";
  }
  function renderDashboard(item) {
    const saved = radarStore().companies.find(company => company.number === item.number);
    const flags = item.flags || [];
    const unavailable = Object.entries(item.sections || {}).filter(([, value]) => value === "unavailable").map(([name]) => name);
    const filingLink = `${item.url}/filing-history`;
    const peopleLink = `${item.url}/officers`;
    const pscLink = `${item.url}/persons-with-significant-control`;
    const chargesLink = `${item.url}/charges`;
    const filingCategory = row => row.category === "mortgage" ? "Charges" : row.category === "resolution" ? "Resolutions" : row.category === "accounts" ? "Accounts" : row.category === "officers" ? "Officers" : "Other";
    const filings = (item.filings || []).filter(row => ["accounts", "officers", "mortgage", "liquidation", "resolution", "capital", "change-of-name", "address", "incorporation"].includes(row.category)).filter(row => filingFilter === "All" || filingCategory(row) === filingFilter).slice(0, 8);
    return `<div class="radar-company-header"><div><div class="radar-eyebrow">${esc(saved?.role || "Company")} · Companies House record</div><h3>${esc(item.name)}</h3><p>Company number ${esc(item.number)} · ${esc(status(item.status))} · ${esc(status(item.type))}</p></div><div class="radar-company-tools"><button type="button" data-radar-refresh>Refresh record</button>${sourceLink(item.url)}</div></div>
      <p class="radar-timestamp">Retrieved ${esc(new Date(item.fetchedAt).toLocaleString("en-GB"))}. Register facts are shown as filed and should be checked against deal documents.${unavailable.length ? ` ${unavailable.length} section${unavailable.length === 1 ? "" : "s"} could not be checked.` : ""}</p>
      ${saved?.changes?.items?.length ? `<section class="radar-changes" aria-label="Changes since last check"><div><span class="radar-eyebrow">Since last check</span><h3>Register details changed</h3><p>${esc(saved.changes.items.join(", "))}</p><small>Detected ${esc(date(saved.changes.at))}. Open the source records to verify what changed.</small></div><button type="button" data-radar-clear-changes>Dismiss</button></section>` : ""}
      <section class="radar-overview" aria-label="Company overview"><div><span>Register status</span><strong>${esc(status(item.status))}</strong></div><div><span>Accounts</span><strong>${item.accounts?.next_accounts?.overdue === true ? "Marked overdue" : esc(date(item.accounts?.next_accounts?.due_on))}</strong><small>${item.accounts?.next_accounts?.overdue === true ? "Next accounts" : "Next due"}</small></div><div><span>Confirmation statement</span><strong>${item.confirmationStatement?.overdue === true ? "Marked overdue" : esc(date(item.confirmationStatement?.next_due))}</strong><small>${item.confirmationStatement?.overdue === true ? "Next statement" : "Next due"}</small></div><div><span>Open charges</span><strong>${item.sections?.charges === "ok" ? esc((item.charges || []).length) : item.sections?.charges === "not-listed" ? "0 shown" : "Not checked"}</strong></div></section>
      <section class="radar-panel"><div class="radar-panel-heading"><div><span class="radar-eyebrow">Triage</span><h3>Points to check</h3><p>Colour applies to each recorded fact, not to the company as a whole.</p></div></div><div class="radar-flags">${flags.length ? flags.map(flag => flagMarkup(flag, item.number, saved?.reviewedFlags)).join("") : '<p class="radar-empty-line">No rule-based points surfaced in the checked fields.</p>'}${unavailable.length ? flagMarkup({ id: "unavailable", level: "grey", title: "Some records were not checked", detail: `Unavailable: ${unavailable.join(", ")}.`, source: item.url }, item.number) : ""}</div></section>
      <div class="radar-two-column"><section class="radar-panel"><div class="radar-panel-heading"><div><span class="radar-eyebrow">Identity</span><h3>Company facts</h3></div>${sourceLink(item.url, "Full profile")}</div><dl class="radar-facts">${fact("Incorporated", date(item.incorporatedOn))}${fact("Registered office", item.address)}${fact("Jurisdiction", status(item.jurisdiction))}${fact("SIC codes", item.sicCodes?.length ? item.sicCodes.join(", ") : "Not shown")}${fact("Previous names", item.previousNames?.length ? item.previousNames.map(name => name.name).join("; ") : "None shown")}</dl></section>
      <section class="radar-panel"><div class="radar-panel-heading"><div><span class="radar-eyebrow">Compliance</span><h3>Filings and deadlines</h3></div>${sourceLink(filingLink, "Filing history")}</div><dl class="radar-facts">${fact("Latest accounts period", date(item.accounts?.last_accounts?.period_end_on))}${fact("Latest accounts type", status(item.accounts?.last_accounts?.type))}${fact("Next accounts due", date(item.accounts?.next_accounts?.due_on))}${fact("Latest confirmation statement", date(item.confirmationStatement?.last_made_up_to))}${fact("Next confirmation statement due", date(item.confirmationStatement?.next_due))}</dl></section></div>
      <div class="radar-two-column"><section class="radar-panel"><div class="radar-panel-heading"><div><span class="radar-eyebrow">People</span><h3>Officers and control</h3></div>${sourceLink(peopleLink, "All officers")}</div>${sectionState("Officers", item.sections?.officers)}<h4>Current officers</h4>${item.officers?.length ? `<ul class="radar-list">${item.officers.slice(0, 8).map(officer => `<li><strong>${esc(officer.name)}</strong><span>${esc(status(officer.role))} · appointed ${esc(date(officer.appointedOn))}</span></li>`).join("")}</ul>${item.officers.length > 8 ? `<p class="radar-meta">Showing 8 of ${item.officers.length} loaded officers. ${sourceLink(peopleLink, "See all")}</p>` : ""}` : '<p class="radar-empty-line">No current officers returned in the checked records.</p>'}<div class="radar-divider"></div><div class="radar-subhead"><h4>Persons with significant control</h4>${sourceLink(pscLink, "PSC register")}</div>${sectionState("PSC records", item.sections?.psc)}${item.psc?.length ? `<ul class="radar-list">${item.psc.slice(0, 8).map(person => `<li><strong>${esc(person.name)}</strong><span>${esc(person.control?.map(status).join(", ") || "Control details not shown")}</span></li>`).join("")}</ul>` : `<p class="radar-empty-line">${item.pscStatements?.length ? "A PSC statement is recorded; check the register for its meaning." : "No current PSC entries returned. This does not establish that no one controls the company."}</p>`}</section>
      <section class="radar-panel"><div class="radar-panel-heading"><div><span class="radar-eyebrow">Security and solvency</span><h3>Charges and insolvency</h3></div>${sourceLink(chargesLink, "All charges")}</div>${sectionState("Charges", item.sections?.charges)}<h4>Outstanding or part-satisfied charges</h4>${item.charges?.length ? `<ul class="radar-list">${item.charges.slice(0, 6).map(charge => `<li><strong>${esc(status(charge.status))}</strong><span>Created ${esc(date(charge.createdOn))}${charge.entitled?.length ? ` · ${esc(charge.entitled.join(", "))}` : ""}</span></li>`).join("")}</ul>` : '<p class="radar-empty-line">None returned in the checked records.</p>'}<div class="radar-divider"></div><h4>Insolvency</h4>${sectionState("Insolvency", item.sections?.insolvency)}<p class="radar-empty-line">${item.insolvency ? esc(`Status: ${status(item.insolvency.status)}. ${item.insolvency.cases?.length || 0} case(s) returned.`) : "No insolvency record returned in the checked records."}</p></section></div>
      <section class="radar-panel"><div class="radar-panel-heading"><div><span class="radar-eyebrow">Source documents</span><h3>Recent relevant filings</h3><p>Selected filings from the latest records, with access to the originals.</p></div><div class="radar-filing-tools"><label>Filter <select data-radar-filing-filter>${["All", "Accounts", "Officers", "Charges", "Resolutions", "Other"].map(category => `<option value="${category}" ${filingFilter === category ? "selected" : ""}>${category}</option>`).join("")}</select></label>${sourceLink(filingLink, "Full history")}</div></div>${sectionState("Filing history", item.sections?.filings)}${filings.length ? `<div class="radar-filings">${filings.map(filing => `<div class="radar-filing"><div><strong>${esc(status(filing.type || filing.category))}</strong><span>${esc(date(filing.date))} · ${esc(status(filing.category))}${filing.pages ? ` · ${esc(filing.pages)} pages` : ""}</span></div><div class="radar-filing-actions">${filing.documentId ? sourceLink(`/api/company-document?number=${encodeURIComponent(item.number)}&id=${encodeURIComponent(filing.documentId)}&view=1`, "View PDF") : sourceLink(filingLink, "View filing history")}${filing.documentId ? `<button type="button" data-radar-download="${esc(filing.documentId)}" data-company-number="${esc(item.number)}">Download original</button>` : ""}</div></div>`).join("")}</div>` : '<p class="radar-empty-line">No filings in this filter were returned among the latest records.</p>'}<p class="radar-meta">Downloads are requested only when clicked. If a PDF is unavailable or too large, use the Companies House filing history.</p></section>`;
  }
  function render() {
    const searchFocused = document.activeElement?.id === "radar-query";
    const selection = searchFocused ? document.activeElement.selectionStart : null;
    const radar = radarStore();
    const number = selectedNumber();
    root.innerHTML = `<div class="radar-page-heading"><div><h2>Company Radar</h2><p>A concise view of public register facts for the companies in this deal.</p></div></div><div class="radar-layout"><aside class="radar-sidebar"><div class="radar-side-heading"><h3>Deal companies</h3><span>${radar.companies.length}</span></div>${radar.companies.length ? `<div class="radar-company-list">${radar.companies.map(item => `<button type="button" class="${item.number === number ? "active" : ""}" data-radar-select="${esc(item.number)}"><strong>${esc(item.name)}</strong><span>${esc(item.role || "Role not set")} · ${esc(item.number)}</span></button>`).join("")}</div>` : '<p class="radar-side-empty">Add a company to start its register check.</p>'}<form class="radar-search" data-radar-search><label for="radar-query">Find a company</label><div><input id="radar-query" name="q" type="search" autocomplete="off" minlength="2" maxlength="100" value="${esc(searchQuery)}" placeholder="Name or company number"><button type="submit">Search</button></div></form><div class="radar-search-state" aria-live="polite">${searching ? '<p>Searching Companies House…</p>' : searchError ? `<p class="radar-error">${esc(searchError)}</p>` : results.length ? `<ul>${results.map(item => `<li><button type="button" data-radar-add="${esc(item.number)}" data-radar-name="${esc(item.name)}"><strong>${esc(item.name)}</strong><span>${esc(item.number)} · ${esc(status(item.status))}</span><small>${esc(item.address || "Address not shown")}</small></button></li>`).join("")}</ul>` : ""}</div></aside><div class="radar-main">${!number ? '<div class="radar-intro-card"><span class="radar-eyebrow">Get started</span><h3>Start with the right legal entity</h3><p>Search the Companies House register, check the company number and address, then add the entity to this deal. Company Radar will surface filing deadlines, register status and other points to review.</p></div>' : `<div class="radar-selected-controls">${rolePicker(number, radar)}<button type="button" data-radar-remove>Remove from deal</button></div>${loading ? '<div class="radar-intro-card" role="status">Checking the Companies House register…</div>' : error ? `<div class="radar-intro-card" role="alert"><h3>Company record unavailable</h3><p>${esc(error)}</p><button type="button" data-radar-refresh>Try again</button> <a href="https://find-and-update.company-information.service.gov.uk/company/${encodeURIComponent(number)}" target="_blank" rel="noopener noreferrer">View on Companies House ↗</a></div>` : data?.number === number ? renderDashboard(data) : '<div class="radar-intro-card" role="status">Preparing the company dashboard…</div>'}`}</div></div>`;
    if (searchFocused) { const input = root.querySelector("#radar-query"); input?.focus(); if (selection !== null) input?.setSelectionRange(selection, selection); }
    window.lucide?.createIcons({ attrs: { "stroke-width": 1.75 } });
  }
  async function fetchDashboard(number, force = false) {
    if (!number) return;
    activeNumber = number;
    const cached = cache.get(number);
    if (!force && cached && Date.now() - cached.storedAt < 120000) { data = cached.data; loading = false; error = ""; render(); return; }
    const sequence = ++requestSequence;
    loading = true; error = ""; data = null; render();
    try {
      const response = await fetch(`/api/company-radar?number=${encodeURIComponent(number)}`, { headers: { Accept: "application/json" } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not retrieve this company.");
      if (sequence !== requestSequence || number !== selectedNumber()) return;
      saveSnapshot(body);
      data = body; cache.set(number, { data: body, storedAt: Date.now() });
    } catch (cause) { if (sequence === requestSequence) error = cause.message; }
    if (sequence === requestSequence) { loading = false; render(); }
  }
  async function search(query) {
    const q = String(query || "").trim();
    searchQuery = String(query || "");
    if (q.length < 2) { results = []; searchError = "Enter at least two characters."; searching = false; render(); return; }
    const sequence = ++searchSequence;
    searching = true; searchError = ""; results = []; render();
    try {
      const response = await fetch(`/api/company-search?q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Search unavailable.");
      if (sequence !== searchSequence) return;
      results = body.results || [];
      if (!results.length) searchError = "No matching companies found. Try a company number or different name.";
    } catch (cause) { if (sequence === searchSequence) searchError = cause.message; }
    if (sequence === searchSequence) { searching = false; render(); }
  }
  function addCompany(number, name) {
    const radar = radarStore();
    if (!radar.companies.some(item => item.number === number)) radar.companies.push({ number, name, role: "" });
    radar.selectedNumber = number;
    saveRadar(radar); results = []; searchError = ""; searchQuery = ""; render(); fetchDashboard(number);
  }
  async function download(number, id, button) {
    button.disabled = true; const original = button.textContent; button.textContent = "Preparing…";
    try {
      const response = await fetch(`/api/company-document?number=${encodeURIComponent(number)}&id=${encodeURIComponent(id)}`);
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || "Download unavailable."); }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `${number}-${id}.pdf`; document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (cause) {
      button.closest(".radar-panel")?.querySelector("[data-radar-download-error]")?.remove();
      const message = document.createElement("p");
      message.className = "radar-unavailable"; message.dataset.radarDownloadError = ""; message.setAttribute("role", "alert");
      message.textContent = `${cause.message} You can open the filing on Companies House instead.`;
      button.closest(".radar-panel")?.append(message);
    }
    button.disabled = false; button.textContent = original;
  }
  root.addEventListener("submit", event => {
    if (!event.target.matches("[data-radar-search]")) return;
    event.preventDefault(); clearTimeout(searchTimer); search(event.target.elements.q.value);
  });
  root.addEventListener("input", event => {
    if (event.target.id !== "radar-query") return;
    const value = event.target.value; searchQuery = value; searchSequence++;
    clearTimeout(searchTimer);
    if (value.trim().length < 3) return;
    searchTimer = setTimeout(() => search(value), 400);
  });
  root.addEventListener("change", event => {
    if (event.target.matches("[data-radar-filing-filter]")) { filingFilter = event.target.value; render(); return; }
  });
  root.addEventListener("click", event => {
    if (event.target.closest("[data-radar-role-toggle]")) { roleMenuOpen = true; render(); root.querySelector("[data-radar-role-option].active, [data-radar-role-option]")?.focus(); return; }
    const roleOption = event.target.closest("[data-radar-role-option]");
    if (roleOption) { const radar = radarStore(), entry = radar.companies.find(item => item.number === selectedNumber()); if (entry) { entry.role = roleOption.dataset.radarRoleOption; saveRadar(radar); roleMenuOpen = false; render(); root.querySelector("[data-radar-role-toggle]")?.focus(); } return; }
    const add = event.target.closest("[data-radar-add]");
    if (add) { addCompany(add.dataset.radarAdd, add.dataset.radarName); return; }
    const select = event.target.closest("[data-radar-select]");
    if (select) { const radar = radarStore(); radar.selectedNumber = select.dataset.radarSelect; saveRadar(radar); roleMenuOpen = false; data = null; render(); fetchDashboard(radar.selectedNumber); return; }
    if (event.target.closest("[data-radar-refresh]")) { fetchDashboard(selectedNumber(), true); return; }
    if (event.target.closest("[data-radar-remove]")) { const radar = radarStore(), number = selectedNumber(); radar.companies = radar.companies.filter(item => item.number !== number); radar.selectedNumber = radar.companies[0]?.number || ""; saveRadar(radar); roleMenuOpen = false; data = null; render(); if (radar.selectedNumber) fetchDashboard(radar.selectedNumber); return; }
    if (event.target.closest("[data-radar-clear-changes]")) { const radar = radarStore(), entry = radar.companies.find(item => item.number === selectedNumber()); if (entry) { delete entry.changes; saveRadar(radar); render(); } return; }
    const review = event.target.closest("[data-radar-review]");
    if (review && data) { const flag = data.flags?.find(item => item.id === review.dataset.radarReview); const radar = radarStore(), entry = radar.companies.find(item => item.number === data.number); if (flag && entry) { entry.reviewedFlags ||= {}; const mark = `${flag.title}|${flag.detail}`; if (entry.reviewedFlags[flag.id] === mark) delete entry.reviewedFlags[flag.id]; else entry.reviewedFlags[flag.id] = mark; saveRadar(radar); render(); } return; }
    const action = event.target.closest("[data-radar-action]");
    if (action && data) { const flag = data.flags.find(item => item.id === action.dataset.radarAction); if (flag) window.addCompanyRadarAction?.(data, flag); return; }
    const documentButton = event.target.closest("[data-radar-download]");
    if (documentButton) download(documentButton.dataset.companyNumber, documentButton.dataset.radarDownload, documentButton);
  });
  root.addEventListener("keydown", event => { if (event.key === "Escape" && roleMenuOpen) { roleMenuOpen = false; render(); root.querySelector("[data-radar-role-toggle]")?.focus(); } });
  document.addEventListener("click", event => { if (roleMenuOpen && !event.target.closest(".radar-role-picker")) { roleMenuOpen = false; render(); } });
  document.addEventListener("deal-project-change", () => { roleMenuOpen = false; data = null; results = []; error = ""; searchError = ""; requestSequence++; render(); if (!root.classList.contains("screen-hidden")) fetchDashboard(selectedNumber()); });
  const previousShow = window.showDealLogicView;
  window.showDealLogicView = view => { previousShow?.(view); if (view === "company-radar") { render(); fetchDashboard(selectedNumber()); } };
  render();
})();
