(() => {
  const LEGACY_KEY = "deallogic:deal-hub:v1";
  const statuses = ["To Review", "In Negotiation", "Drafted in SPA", "Satisfied/Closed"];
  const phases = ["Pre-LOI", "Due Diligence", "SPA Drafting", "Post-Signing / Integration", "Closing Condition"];
  const priorities = ["High", "Medium", "Low"];
  const sides = ["Buyer", "Seller", "Balanced"];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
  const safeUrl = value => { try { const url=new URL(value); return ["http:","https:"].includes(url.protocol)?url.href:""; } catch { return ""; } };
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const parse = (value, fallback) => { try { return JSON.parse(value) || fallback; } catch { return fallback; } };
  function activeHub(){
    const store=getDealProjects(),project=store.projects.find(item=>item.id===store.activeProjectId)||store.projects[0];
    if(!project.hub){
      const legacy=parse(DealLogicStorage.getItem(LEGACY_KEY),{issues:[],actions:[],projects:[]});
      const groups=Array.isArray(legacy.projects)?legacy.projects:(Array.isArray(legacy.workstreams)?legacy.workstreams.map(name=>({id:uid(),name})):[]);
      project.hub={issues:Array.isArray(legacy.issues)?legacy.issues:[],actions:Array.isArray(legacy.actions)?legacy.actions:[],groups};
    }
    if(!Array.isArray(project.hub.issues))project.hub.issues=[];
    if(!Array.isArray(project.hub.actions))project.hub.actions=[];
    if(!Array.isArray(project.hub.groups))project.hub.groups=[];
    return project.hub;
  }
  let state=activeHub();
  let view = "summary", filter = "All issues", search = "", picking = false, creatingProject = false;
  const picks = new Map();
  const save = () => {const store=getDealProjects(),project=store.projects.find(item=>item.id===store.activeProjectId)||store.projects[0];project.hub=state;saveDealProjects(store);};
  const currentIssue = () => typeof current === "function" ? current() : null;
  const issueById = id => state.issues.find(issue => issue.id === id);
  const actionById = id => state.actions.find(action => action.id === id);
  const answerSnapshot = () => JSON.parse(JSON.stringify(typeof answers === "object" ? answers : {}));
  const riskLabel = () => document.querySelector(".risk-score")?.textContent.trim() || "Not assessed";
  const liveSummary = () => document.querySelector(".logic-conclusion")?.textContent.trim() || document.querySelector(".issue-header .summary")?.textContent.trim() || "";
  const phaseFor = (title, instruction) => {
    const text = `${title} ${instruction}`.toLowerCase();
    if (/post.clos|post.completion|integration/.test(text)) return "Post-Signing / Integration";
    if (/condition precedent|closing|completion mechanic|longstop/.test(text)) return "Closing Condition";
    if (/spa|warranty|indemnity|covenant|disclos|price/.test(text)) return "SPA Drafting";
    return "Due Diligence";
  };
  const actionKey = (issueId, side, title, instruction, stableActionId="") => stableActionId ? `${issueId}|action|${stableActionId}` : `${issueId}|${side}|${title}|${instruction}`;
  const stableActionIdFor = (issueId, title, instruction, explicitId="") => window.DealLogicActionRegistry?.resolveActionId(issueId,title,instruction,explicitId) || explicitId;
  const hasEquivalentAction = item => state.actions.some(action => {
    if (action.issueId !== item.issueId) return false;
    const existingId = action.stableActionId || stableActionIdFor(action.issueId,action.originalTitle||action.title,action.originalInstruction||action.instruction);
    if (item.actionId && existingId) return item.actionId === existingId;
    return action.sourceKey === actionKey(item.issueId,item.side,item.title,item.instruction,item.actionId);
  });
  const available = () => {
    const issue = currentIssue();
    if (!issue) return [];
    const card = document.querySelector("#logic-card");
    if (["customer-change-of-control", "missing-ip-assignment", "option-holders", "threatened-litigation"].includes(issue.id) && card?.querySelector(".logic-section-heading")) {
      return [...card.querySelectorAll(".logic-action")].map(row => ({
        issueId: issue.id, side: getTransactionSide(), icon: row.querySelector(".logic-icon")?.dataset.originalIcon || row.querySelector(".logic-icon")?.textContent.trim() || "◌",
        actionId: stableActionIdFor(issue.id,row.querySelector("strong")?.textContent.trim(),row.querySelector("span:last-child")?.textContent.trim(),row.dataset.actionId),
        priority: row.querySelector(".logic-priority")?.textContent.trim() || "Recommended",
        title: row.querySelector("strong")?.textContent.trim() || "Action",
        instruction: row.querySelector("span:last-child")?.textContent.trim() || ""
      }));
    }
    return [...document.querySelectorAll("#recommendations-card .recommendation")].map(row => ({
      issueId: issue.id, side: getTransactionSide(), icon: "◌", actionId: stableActionIdFor(issue.id,row.querySelector("strong")?.textContent.trim(),row.querySelector("p")?.textContent.trim()), priority: row.querySelector(".pill")?.textContent.trim() || "Recommended",
      title: row.querySelector("strong")?.textContent.trim() || "Action",
      instruction: row.querySelector("p")?.textContent.trim() || ""
    }));
  };
  const snapshot = issue => ({
    id: issue.id, title: issue.title, category: (typeof areas === "object" && areas[issue.category]) || issue.category,
    risk: riskLabel(), summary: liveSummary(), answers: answerSnapshot(), capturedAt: new Date().toISOString(),
    sourceDocument: "", sourceClause: "", sourceUrl: ""
  });
  const isStale = issue => JSON.stringify(issue.answers) !== JSON.stringify(parse(DealLogicStorage.getItem(`deallogic:deal-project:${activeDealProjectId()}:issue:${issue.id}`), {}));
  const toast = message => { document.querySelector(".hub-toast")?.remove(); const node = document.createElement("div"); node.className="hub-toast"; node.setAttribute("role","status"); node.textContent=message; document.body.append(node); setTimeout(()=>node.remove(),3000); };
  const hub = document.createElement("section");
  hub.className = "deal-hub-view screen-hidden";
  document.querySelector(".library-view")?.insertAdjacentElement("beforebegin", hub);

  function renderProjectRail(){
    let rail=document.querySelector(".project-rail");
    if(!rail){
      rail=document.createElement("aside");rail.className="project-rail";rail.setAttribute("aria-label","Deal projects");
      document.querySelector(".workspace")?.insertAdjacentElement("beforebegin",rail);
    }
    const store=getDealProjects(),active=activeDealProject();
    rail.innerHTML=`<div class="project-rail-head"><div><span class="eyebrow">Workspace</span><h3>Projects</h3></div><button type="button" class="project-new" data-new-deal-project aria-label="Create a new project">＋</button></div>${creatingProject?`<form class="project-rail-create" data-create-deal-project><label>Project name<input name="name" maxlength="80" placeholder="e.g. Project Redwood" required autofocus></label><label>Transaction side<select name="side"><option>Buyer</option><option>Seller</option><option selected>Balanced</option></select></label><div><button class="hub-button primary">Create project</button><button type="button" class="hub-button" data-cancel-deal-project>Cancel</button></div></form>`:""}<button class="project-rail-item ${active.isQuick?"active":""}" data-switch-deal-project="quick-workspace"><span class="project-dot"></span><span><strong>Quick workspace</strong><small>Unassigned work</small></span></button><div class="project-rail-list">${store.projects.filter(project=>!project.isQuick).map(project=>`<button class="project-rail-item ${project.id===active.id?"active":""}" data-switch-deal-project="${esc(project.id)}"><span class="project-dot"></span><span><strong>${esc(project.name)}</strong><small>${esc(project.side)} · ${project.hub?.actions?.length||0} actions</small></span></button>`).join("")||'<p class="project-rail-empty">Create a project to keep a deal’s analysis, actions and reports together.</p>'}</div><p class="project-rail-note">Saved in this browser</p>`;
  }
  function showProjectStart(){
    const store=getDealProjects();if(store.onboardingSeen)return;
    document.querySelector(".workspace")?.classList.add("screen-hidden");
    let start=document.querySelector(".project-start");
    if(!start){start=document.createElement("section");start.className="project-start";document.querySelector(".workspace")?.insertAdjacentElement("beforebegin",start);}
    start.innerHTML=`<div class="project-start-card"><span class="eyebrow">Start a workspace</span><h2>Organise this deal from the outset</h2><p>Create a project to keep its Deal Map answers, risk analysis and Deal Hub actions together. You can also explore first without creating one.</p><form data-start-project><label>Project name<input name="name" maxlength="80" placeholder="e.g. Project Redwood" required></label><label>Transaction side<select name="side"><option>Buyer</option><option>Seller</option><option selected>Balanced</option></select></label><div><button class="hub-button primary">Create project</button><button type="button" class="hub-button" data-continue-quick>Continue without a project</button></div></form></div>`;
    start.addEventListener("submit",event=>{if(!event.target.matches("[data-start-project]"))return;event.preventDefault();createDealProject(event.target.elements.name.value,event.target.elements.side.value);start.remove();document.querySelector(".workspace")?.classList.remove("screen-hidden");renderProjectRail();window.showDealLogicView?.("deal-map");});
    start.querySelector("[data-continue-quick]").onclick=()=>{const next=getDealProjects();next.onboardingSeen=true;next.activeProjectId="quick-workspace";saveDealProjects(next);start.remove();document.querySelector(".workspace")?.classList.remove("screen-hidden");renderProjectRail();switchDealProject("quick-workspace");};
  }
  document.addEventListener("click",event=>{
    const change=event.target.closest("[data-switch-deal-project]");if(change){switchDealProject(change.dataset.switchDealProject);return;}
    if(event.target.closest("[data-new-deal-project]")){creatingProject=true;renderProjectRail();document.querySelector("[data-create-deal-project] [name=name]")?.focus();return;}
    if(event.target.closest("[data-cancel-deal-project]")){creatingProject=false;renderProjectRail();}
  });
  document.addEventListener("submit",event=>{
    if(!event.target.matches("[data-create-deal-project]"))return;
    event.preventDefault();
    const name=String(event.target.elements.name.value||"").trim();
    if(!name)return;
    createDealProject(name,event.target.elements.side.value);creatingProject=false;renderProjectRail();
  });
  document.addEventListener("deal-project-change",()=>{
    state=activeHub();filter="All issues";search="";picks.clear();picking=false;loadAnswers();renderMap();renderPanel();renderHub();renderProjectRail();document.dispatchEvent(new CustomEvent("transaction-side-change"));
  });

  function decorateRecommendations() {
    const issue = currentIssue();
    if (!issue) return;
    const cocHeading = document.querySelector("#logic-card .logic-section-heading");
    const genericHeading = document.querySelector("#recommendations-card h3");
    const heading = cocHeading || genericHeading;
    if (!heading) return;
    const availableActions = available();
    if (!availableActions.length) return;
    if (genericHeading) genericHeading.classList.add("logic-section-heading");
    heading.querySelector(".hub-pin")?.remove();
    const pin = document.createElement("button");
    pin.type="button"; pin.className=`hub-pin${picking?" active":""}`; pin.textContent=picking?"Selecting":"＋ Add to Deal Hub";
    pin.title="Select recommended actions for Deal Hub"; pin.setAttribute("aria-label","Select recommended actions for Deal Hub");
    (cocHeading || genericHeading).append(pin);
    pin.onclick = () => {
      if (!picking) picking = true;
      for (const item of availableActions) picks.set(actionKey(item.issueId,item.side,item.title,item.instruction,item.actionId), {...item, issueSnapshot:snapshot(issue)});
      decorateRecommendations();
    };
    const rows = cocHeading ? [...document.querySelectorAll("#logic-card .logic-action")] : [...document.querySelectorAll("#recommendations-card .recommendation")];
    rows.forEach((row, index) => {
      row.querySelector(".hub-pick")?.remove();
      if (!picking) return;
      const item = availableActions[index];
      const key = actionKey(item.issueId,item.side,item.title,item.instruction,item.actionId);
      const checkbox = document.createElement("input"); checkbox.type="checkbox"; checkbox.className="hub-pick"; checkbox.checked=picks.has(key); checkbox.setAttribute("aria-label",`Add ${item.title} for Deal Hub`);
      checkbox.onchange=()=>{ if (checkbox.checked) picks.set(key,{...item,issueSnapshot:snapshot(issue)}); else picks.delete(key); updatePickbar(); };
      row.append(checkbox);
    });
    document.querySelector(".hub-pickbar")?.remove();
    if (picking) {
      const bar=document.createElement("div"); bar.className="hub-pickbar";
      bar.innerHTML='<span class="hub-pick-count"></span><div class="hub-pick-actions"><button type="button" data-hub-cancel>Cancel</button><button type="button" data-hub-add>Add to Deal Hub</button></div>';
      (cocHeading ? cocHeading.closest(".logic-section") : document.querySelector("#recommendations-card"))?.append(bar);
      bar.querySelector("[data-hub-add]").onclick=commitPicks;
      bar.querySelector("[data-hub-cancel]").onclick=()=>{picking=false;picks.clear();decorateRecommendations();};
      updatePickbar();
    }
  }
  function updatePickbar() {
    const count = picks.size;
    const label = document.querySelector(".hub-pick-count");
    if (label) label.textContent=`${count} action${count===1?"":"s"} selected`;
    const button = document.querySelector("[data-hub-add]"); if (button) button.disabled=!count;
  }
  function commitPicks() {
    if (!picks.size) return;
    const selected = [...picks.values()];
    const grouped = new Set(selected.map(item=>item.issueId));
    for (const id of grouped) {
      if (!issueById(id)) {
        const source = (typeof issues !== "undefined" ? issues : []).find(issue=>issue.id===id);
        if (source) state.issues.push(selected.find(item=>item.issueId===id)?.issueSnapshot || snapshot(source));
      }
    }
    let added=0;
    for (const item of selected) {
      const key=actionKey(item.issueId,item.side,item.title,item.instruction,item.actionId);
      if (hasEquivalentAction(item)) continue;
      state.actions.push({id:uid(),sourceKey:key,stableActionId:item.actionId||"",issueId:item.issueId,side:item.side,icon:item.icon,priority:item.priority,
        title:item.title,instruction:item.instruction,originalTitle:item.title,originalInstruction:item.instruction,
        status:statuses[0],dealPhase:phaseFor(item.title,item.instruction),
        urgency:"Medium",notes:"",createdAt:new Date().toISOString(),manual:false});
      added++;
    }
    save(); picking=false;picks.clear();decorateRecommendations();renderHub();document.dispatchEvent(new CustomEvent("deal-hub-actions-change"));
    toast(added?`${added} action${added===1?"":"s"} added to Deal Hub`:"These actions are already in Deal Hub");
  }
  const libraryPhase = phase => ({"Due diligence":"Due Diligence","SPA drafting":"SPA Drafting","Signing":"Post-Signing / Integration","Closing condition":"Closing Condition","Post-completion":"Post-Signing / Integration"}[phase] || "Due Diligence");
  window.isActionInDealHub = (issueId, actionId) => hasEquivalentAction({issueId,actionId,side:getTransactionSide(),title:"",instruction:""});
  window.addLibraryActionToDealHub = (issueId, action) => {
    const item={issueId,actionId:action.id,side:getTransactionSide(),title:action.title,instruction:action.description};
    if (hasEquivalentAction(item)) {toast("This action is already in Deal Hub");return false;}
    const source=(typeof issues!=="undefined"?issues:[]).find(issue=>issue.id===issueId);
    if(source && !issueById(issueId)){
      const storedAnswers=parse(DealLogicStorage.getItem(`deallogic:deal-project:${activeDealProjectId()}:issue:${issueId}`),{});
      state.issues.push({id:source.id,title:source.title,category:(typeof areas==="object"&&areas[source.category])||source.category,risk:currentIssue()?.id===issueId?riskLabel():"Not assessed",summary:source.summary||"Manually selected from the Action Library.",answers:storedAnswers,capturedAt:new Date().toISOString(),sourceDocument:"",sourceClause:"",sourceUrl:""});
    }
    state.actions.push({id:uid(),sourceKey:actionKey(issueId,item.side,item.title,item.instruction,action.id),stableActionId:action.id,issueId,side:item.side,icon:"◌",iconKey:action.icon,priority:"Consider",title:item.title,instruction:item.instruction,originalTitle:item.title,originalInstruction:item.instruction,status:statuses[0],dealPhase:libraryPhase(action.phase),urgency:"Medium",notes:"",createdAt:new Date().toISOString(),manual:true,selectionSource:"library"});
    save();renderHub();renderProjectRail();document.dispatchEvent(new CustomEvent("deal-hub-actions-change"));toast("Action added to Deal Hub");return true;
  };
  function issueMarkup(issue) {
    const actionCount=state.actions.filter(action=>action.issueId===issue.id).length;
    const answerEntries=Object.entries(issue.answers||{}).filter(([,value])=>value && value!=="Unanswered");
    const sourceLabel=issue.sourceDocument || issue.sourceClause || "Source document or clause not recorded";
    const riskLevel=String(issue.risk||"").match(/^(\d)\/5/)?.[1]||"1";
    return `<article class="hub-issue" data-issue-id="${esc(issue.id)}"><div class="hub-issue-head"><div><div class="eyebrow">${esc(issue.category)}</div><h3>${esc(issue.title)}</h3><div class="hub-meta"><span class="hub-risk hub-risk-${riskLevel}">${esc(issue.risk)}</span> · ${actionCount} action${actionCount===1?"":"s"} · Saved ${new Date(issue.capturedAt).toLocaleDateString()}</div></div><div><button class="hub-text-button" data-open-issue="${esc(issue.id)}">Open issue</button></div></div><p class="hub-summary">${esc(issue.summary)}</p><div class="hub-meta">Source: ${safeUrl(issue.sourceUrl)?`<a class="hub-source-link" href="${esc(safeUrl(issue.sourceUrl))}" target="_blank" rel="noopener noreferrer">${esc(sourceLabel)}</a>`:esc(sourceLabel)}</div>${isStale(issue)?`<p class="hub-meta hub-confirm">Answers have changed since this was saved. <button class="hub-text-button" data-refresh-issue="${esc(issue.id)}">Refresh snapshot</button></p>`:""}<details><summary>Saved responses (${answerEntries.length})</summary><div class="hub-answers">${answerEntries.map(([key,value])=>`<div><strong>${esc(key.replaceAll("-"," "))}:</strong> ${esc(Array.isArray(value)?value.join(", "):value)}</div>`).join("")}</div></details><div class="hub-issue-fields"><label>Source document<input data-issue-field="sourceDocument" value="${esc(issue.sourceDocument||"")}" placeholder="e.g. Customer Agreement"></label><label>Clause / finding<input data-issue-field="sourceClause" value="${esc(issue.sourceClause||"")}" placeholder="e.g. clause 14.2"></label><label>Document link<input type="url" data-issue-field="sourceUrl" value="${esc(issue.sourceUrl||"")}" placeholder="https://..."></label></div></article>`;
  }
  function compactIssueMarkup(issue) {
    const actionCount=state.actions.filter(action=>action.issueId===issue.id).length;
    return `<article class="hub-issue hub-issue-compact"><div class="hub-issue-head"><div><div class="eyebrow">${esc(issue.category)}</div><h3>${esc(issue.title)}</h3><div class="hub-meta"><span class="hub-risk hub-risk-${String(issue.risk||"").match(/^(\d)\/5/)?.[1]||"1"}">${esc(issue.risk)}</span> · ${actionCount} action${actionCount===1?"":"s"}</div></div><button class="hub-text-button" data-open-issue="${esc(issue.id)}">Open issue</button></div><p class="hub-summary">${esc(issue.summary)}</p>${isStale(issue)?`<p class="hub-meta hub-confirm">Answers have changed. <button class="hub-text-button" data-refresh-issue="${esc(issue.id)}">Refresh snapshot</button></p>`:""}</article>`;
  }
  function actionMarkup(action, expanded=false) {
    const issue=issueById(action.issueId);
    const actionLevel = ["Required", "Recommended", "Consider"].includes(action.priority) ? action.priority : "Consider";
    const editControl = view === "board"
      ? `<button class="hub-item-edit" type="button" data-edit-action="${esc(action.id)}" aria-label="Edit ${esc(action.title)}" title="Edit action"><i data-lucide="pencil" aria-hidden="true"></i></button>`
      : `<button class="hub-text-button" data-edit-action="${esc(action.id)}">${expanded?"Close":"Edit"}</button>`;
    return `<article class="hub-item" draggable="true" data-action-id="${esc(action.id)}"><div class="hub-item-top"><div><h4>${esc(action.icon||"◌")} ${esc(action.title)}</h4><div class="hub-tags"><span class="hub-tag hub-level-${actionLevel.toLowerCase()}">${esc(actionLevel)}</span><span class="hub-tag hub-stage">${esc(action.dealPhase)}</span></div></div>${editControl}</div><p>${esc(action.instruction)}</p><div class="hub-meta">${esc(issue?.title||"Custom action")} · ${esc(action.status)}</div>${action.notes?`<p class="hub-meta">Note: ${esc(action.notes)}</p>`:""}${expanded?editorMarkup(action):""}</article>`;
  }
  const options=(values,currentValue)=>values.map(value=>`<option ${value===currentValue?"selected":""}>${esc(value)}</option>`).join("");
  function editorMarkup(action) {
    return `<div class="hub-editor"><label>Action title<input data-action-field="title" maxlength="120" value="${esc(action.title)}"></label><label>Recommended action<textarea data-action-field="instruction">${esc(action.instruction)}</textarea></label><label>Deal notes<textarea data-action-field="notes" placeholder="Add deal-specific context or drafting notes">${esc(action.notes||"")}</textarea></label><div class="hub-editor-grid"><label>Status<select data-action-field="status">${options(statuses,action.status)}</select></label><label>Deal phase<select data-action-field="dealPhase">${options(phases,action.dealPhase)}</select></label><label>Priority<select data-action-field="urgency">${options(priorities,action.urgency)}</select></label></div><div><button data-save-action="${esc(action.id)}">Save changes</button> <button class="hub-text-button danger" data-delete-action="${esc(action.id)}">Remove from Hub</button></div><div class="hub-meta">Original suggestion: ${esc(action.originalTitle)} — ${esc(action.originalInstruction)}</div></div>`;
  }
  function tableEditorMarkup(action) {
    return `<tr class="hub-table-editor" data-table-editor-for="${esc(action.id)}"><td colspan="9">${editorMarkup(action)}</td></tr>`;
  }
  function filteredActions() {
    return state.actions.filter(action=>{
      if (filter!=="All issues" && action.issueId!==filter) return false;
      const issue=issueById(action.issueId);
      return `${action.title} ${action.instruction} ${action.notes} ${issue?.title||""}`.toLowerCase().includes(search.toLowerCase());
    });
  }
  function renderHub() {
    const items=filteredActions();
    const issueOptions=state.issues.map(issue=>`<option value="${esc(issue.id)}" ${filter===issue.id?"selected":""}>${esc(issue.title)}</option>`).join("");
    hub.innerHTML=`<div class="hub-header"><div><h2>Deal Hub</h2><p>Build a deal-specific briefing and action plan from saved issues and recommendations.</p></div><div class="hub-toolbar"><button class="primary" data-new-action>＋ Custom action</button><div class="hub-export"><button data-export-csv>Export table</button><button data-export-doc>Export briefing</button></div></div></div><form class="hub-new-action screen-hidden" data-new-action-form><h3>Add custom action</h3><div class="hub-editor-grid"><label>Title<input name="title" maxlength="120" required></label><label>Related issue<select name="issueId"><option value="custom-actions">General deal action</option>${state.issues.filter(issue=>issue.id!=="custom-actions").map(issue=>`<option value="${esc(issue.id)}">${esc(issue.title)}</option>`).join("")}</select></label><label>Deal phase<select name="dealPhase">${options(phases,"Due Diligence")}</select></label></div><label>Action details<textarea name="instruction" required></textarea></label><div><button class="hub-button primary">Add action</button> <button class="hub-button" type="button" data-cancel-new-action>Cancel</button></div></form><div class="hub-tabs" role="tablist" aria-label="Deal Hub views">${[["summary","Summary"],["board","Task board"],["table","Table"],["projects","Project settings"]].map(([name,label])=>`<button role="tab" aria-selected="${view===name}" class="${view===name?"active":""}" data-hub-view="${name}">${label}</button>`).join("")}</div>${view!=="projects"?`<div class="hub-filter-row"><label>Issue <select data-filter-issue><option>All issues</option>${issueOptions}</select></label><input data-hub-search type="search" placeholder="Search actions" value="${esc(search)}" aria-label="Search Deal Hub actions"><span class="hub-meta">${state.issues.length} open issues · ${state.actions.length} actions · saved in this browser</span></div>`:""}<div class="hub-content"></div>`;
    const content=hub.querySelector(".hub-content");
    if (!state.issues.length && !state.actions.length && view!=="projects") {
      content.innerHTML='<div class="hub-empty"><h3>Your Deal Hub is ready</h3><p>Open a legal issue, use the pin beside Recommended Actions, and select the actions to bring here. You can also create a custom action.</p><button class="hub-button primary" data-go-map>Explore Deal Map</button></div>';
    } else if (view==="summary") {
      const shownIssues=state.issues.filter(issue=>filter==="All issues"||issue.id===filter);
      const recent=[...items].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8);
      content.innerHTML=`<div class="hub-summary-grid"><section class="hub-summary-tile"><div class="hub-tile-heading"><div><h3>Open issues</h3><p>${shownIssues.length} saved issue${shownIssues.length===1?"":"s"} with their recorded analysis.</p></div><span class="hub-count">${shownIssues.length}</span></div><div class="hub-summary-list">${shownIssues.map(issue=>compactIssueMarkup(issue)).join("")}</div></section><section class="hub-summary-tile"><div class="hub-tile-heading"><div><h3>Recent action items</h3><p>The latest recommended and custom actions added to the Hub.</p></div><span class="hub-count">${recent.length}</span></div><div class="hub-summary-list">${recent.length?recent.map(action=>actionMarkup(action)).join(""):'<p class="hub-meta">No action items match this filter.</p>'}</div></section></div>`;
    } else if (view==="board") {
      content.innerHTML=`<div class="hub-columns">${statuses.map(status=>`<section class="hub-column" data-drop-status="${esc(status)}"><h3>${esc(status)} <small>(${items.filter(action=>action.status===status).length})</small></h3>${items.filter(action=>action.status===status).map(action=>actionMarkup(action)).join("")}</section>`).join("")}</div>`;
    } else if (view==="table") {
      content.innerHTML=`<div class="hub-table-wrap"><table class="hub-table"><thead><tr><th>Issue</th><th>Risk</th><th>Action</th><th>Side</th><th>Phase</th><th>Priority</th><th>Status</th><th>Notes</th><th></th></tr></thead><tbody>${items.map(action=>{const issue=issueById(action.issueId);const riskLevel=String(issue?.risk||"").match(/^(\d)\/5/)?.[1]||"1";return `<tr data-action-id="${esc(action.id)}"><td>${esc(issue?.title||"Custom")}</td><td><span class="hub-risk hub-risk-${riskLevel}">${esc(issue?.risk||"")}</span></td><td><strong>${esc(action.title)}</strong><br>${esc(action.instruction)}</td><td>${esc(action.side||"Custom")}</td><td>${esc(action.dealPhase)}</td><td>${esc(action.urgency)}</td><td><select data-quick-status="${esc(action.id)}">${options(statuses,action.status)}</select></td><td>${esc(action.notes)}</td><td><button class="hub-table-edit" type="button" data-edit-action="${esc(action.id)}" aria-label="Edit ${esc(action.title)}" title="Edit action"><i data-lucide="pencil" aria-hidden="true"></i></button></td></tr>`}).join("")}</tbody></table></div>`;
    } else {
      const active=activeDealProject();
      content.innerHTML=`<section class="hub-projects"><div class="hub-projects-intro"><div><h3>Project settings</h3><p>Update this deal’s name and transaction side. Deleting a project removes its Deal Map answers and Deal Hub actions from this browser.</p></div></div>${active.isQuick?`<div class="hub-project-empty"><p>This is the quick workspace. Create a project from the Projects rail to save this work as a separate deal.</p><button class="hub-button primary" data-new-deal-project>＋ Create project</button></div>`:`<form class="hub-project-settings" data-save-deal-project><label>Project name<input name="name" maxlength="80" required value="${esc(active.name)}"></label><label>Transaction side<select name="side">${options(sides,active.side)}</select></label><div class="hub-project-actions"><button class="hub-button primary">Save project changes</button><button type="button" class="hub-text-button danger" data-delete-deal-project="${esc(active.id)}">Delete project</button></div></form>`}</section>`;
    }
  }
  function download(name,mime,body) {
    const blob=new Blob([body],{type:mime}); const url=URL.createObjectURL(blob); const link=document.createElement("a");
    link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const csvCell=value=>`"${String(value??"").replaceAll('"','""')}"`;
  function exportCsv() {
    const rows=[["Issue","Risk","Source document","Clause / finding","Document link","Action","Recommendation","Transaction side","Action label","Deal phase","Priority","Status","Notes"]];
    state.actions.forEach(action=>{const issue=issueById(action.issueId);rows.push([issue?.title,issue?.risk,issue?.sourceDocument,issue?.sourceClause,issue?.sourceUrl,action.title,action.instruction,action.side,action.priority,action.dealPhase,action.urgency,action.status,action.notes]);});
    download("deal-hub-actions.csv","text/csv;charset=utf-8","\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n"));
  }
  function exportDoc() {
    const body=state.issues.map(issue=>`<h2>${esc(issue.title)}</h2><p><b>Risk:</b> ${esc(issue.risk)}<br><b>Source:</b> ${esc(issue.sourceDocument||"Not recorded")} ${esc(issue.sourceClause||"")}</p><p>${esc(issue.summary)}</p><h3>Recorded responses</h3>${Object.entries(issue.answers||{}).map(([key,value])=>`<p><b>${esc(key.replaceAll("-"," "))}:</b> ${esc(Array.isArray(value)?value.join(", "):value)}</p>`).join("")}<h3>Recommended actions</h3>${state.actions.filter(action=>action.issueId===issue.id).map(action=>`<p><b>${esc(action.title)}</b> (${esc(action.side)}, ${esc(action.priority)}, ${esc(action.dealPhase)}, ${esc(action.status)})<br>${esc(action.instruction)}${action.notes?`<br><i>Note: ${esc(action.notes)}</i>`:""}</p>`).join("")}`).join("");
    download("deal-hub-briefing.doc","application/msword;charset=utf-8",`<!doctype html><html><head><meta charset="utf-8"><title>Deal Hub Briefing</title></head><body><h1>Deal Hub Briefing</h1><p>Exported ${new Date().toLocaleDateString()}</p>${body}</body></html>`);
  }
  function refreshIssue(id) {
    const issue=issueById(id), source=(typeof issues!=="undefined"?issues:[]).find(item=>item.id===id);
    if (!issue||!source) return;
    const retained={sourceDocument:issue.sourceDocument,sourceClause:issue.sourceClause,sourceUrl:issue.sourceUrl};
    const previousId=selectedId, previousArea=openArea, previousAnswers=answers;
    selectedId=id; openArea=source.category; loadAnswers(); renderPanel();
    Object.assign(issue,snapshot(source),retained);
    selectedId=previousId; openArea=previousArea; answers=previousAnswers; renderPanel(); renderMap();
    save();renderHub();toast("Issue snapshot refreshed");
  }
  function addCustomAction(form) {
    const data=new FormData(form), title=String(data.get("title")||"").trim(), instruction=String(data.get("instruction")||"").trim();
    if (!title||!instruction) return;
    const issueId=String(data.get("issueId")||"custom-actions");
    if (!issueById(issueId)) state.issues.push({id:issueId,title:"Custom actions",category:"Deal Hub",risk:"Not assessed",summary:"Manually added deal actions.",answers:{},capturedAt:new Date().toISOString(),sourceDocument:"",sourceClause:"",sourceUrl:""});
    state.actions.push({id:uid(),issueId,side:"Custom",icon:"＋",priority:"Consider",title,instruction,originalTitle:title,originalInstruction:instruction,status:statuses[0],dealPhase:String(data.get("dealPhase")),urgency:"Medium",notes:"",createdAt:new Date().toISOString(),manual:true});
    save();renderHub();toast("Custom action added");
  }
  hub.addEventListener("click", event=>{
    const tab=event.target.closest("[data-hub-view]");if(tab){view=tab.dataset.hubView;renderHub();return;}
    if(event.target.closest("[data-new-action]")){hub.querySelector("[data-new-action-form]")?.classList.remove("screen-hidden");hub.querySelector('[data-new-action-form] [name="title"]')?.focus();return;}
    if(event.target.closest("[data-cancel-new-action]")){hub.querySelector("[data-new-action-form]")?.classList.add("screen-hidden");return;}
    if(event.target.closest("[data-export-csv]")){exportCsv();return;}
    if(event.target.closest("[data-export-doc]")){exportDoc();return;}
    if(event.target.closest("[data-go-map]")){window.showDealLogicView?.("deal-map");return;}
    const open=event.target.closest("[data-open-issue]");if(open){selectedId=open.dataset.openIssue;const source=(typeof issues!=="undefined"?issues:[]).find(item=>item.id===selectedId);if(source){openArea=source.category;loadAnswers();renderMap();renderPanel();window.showDealLogicView?.("deal-map");}return;}
    const refresh=event.target.closest("[data-refresh-issue]");if(refresh){refreshIssue(refresh.dataset.refreshIssue);return;}
    const edit=event.target.closest("[data-edit-action]");if(edit){const card=edit.closest(".hub-item");if(card){card.outerHTML=actionMarkup(actionById(edit.dataset.editAction),!card.querySelector(".hub-editor"));}else{const row=edit.closest("tr[data-action-id]");if(row?.closest(".hub-table")){const editor=row.nextElementSibling?.matches(`[data-table-editor-for="${CSS.escape(edit.dataset.editAction)}"]`)?row.nextElementSibling:null;if(editor){editor.remove();}else{row.insertAdjacentHTML("afterend",tableEditorMarkup(actionById(edit.dataset.editAction)));}}}return;}
    const saveButton=event.target.closest("[data-save-action]");if(saveButton){const action=actionById(saveButton.dataset.saveAction),editor=saveButton.closest(".hub-item,.hub-table-editor");if(!action||!editor)return;editor.querySelectorAll("[data-action-field]").forEach(field=>{action[field.dataset.actionField]=field.value;});save();renderHub();toast("Action updated");return;}
    const remove=event.target.closest("[data-delete-action]");if(remove){if(remove.dataset.confirm!=="yes"){remove.dataset.confirm="yes";remove.textContent="Click again to remove";return;}state.actions=state.actions.filter(action=>action.id!==remove.dataset.deleteAction);save();renderHub();document.dispatchEvent(new CustomEvent("deal-hub-actions-change"));toast("Action removed from Deal Hub");}
    const deleteProject=event.target.closest("[data-delete-deal-project]");if(deleteProject){
      if(deleteProject.dataset.confirm!=="yes"){deleteProject.dataset.confirm="yes";deleteProject.textContent="Click again to delete";return;}
      const store=getDealProjects(),id=deleteProject.dataset.deleteDealProject;
      store.projects=store.projects.filter(project=>project.id!==id);
      store.activeProjectId="quick-workspace";
      saveDealProjects(store);
      DealLogicStorage.removeItem(`deallogic:deal-project:${id}:issue:customer-change-of-control`);
      document.dispatchEvent(new CustomEvent("deal-project-change",{detail:{id:"quick-workspace"}}));
      toast("Project deleted");
    }
  });
  hub.addEventListener("change",event=>{
    const target=event.target;
    if(target.matches("[data-filter-issue]")){filter=target.value;renderHub();return;}
    if(target.matches("[data-issue-field]")){const issue=issueById(target.closest("[data-issue-id]")?.dataset.issueId);if(issue){issue[target.dataset.issueField]=target.dataset.issueField==="sourceUrl"?safeUrl(target.value):target.value;save();}return;}
    if(target.matches("[data-quick-status]")){const action=actionById(target.dataset.quickStatus);if(action){action.status=target.value;save();renderHub();}}
  });
  hub.addEventListener("input",event=>{if(event.target.matches("[data-hub-search]")){search=event.target.value;const pos=event.target.selectionStart;renderHub();const field=hub.querySelector("[data-hub-search]");field.focus();field.setSelectionRange(pos,pos);}});
  hub.addEventListener("submit",event=>{
    if(event.target.matches("[data-new-action-form]")){event.preventDefault();addCustomAction(event.target);return;}
    if(event.target.matches("[data-save-deal-project]")){
      event.preventDefault();
      const store=getDealProjects(),project=store.projects.find(item=>item.id===store.activeProjectId),name=String(event.target.elements.name.value||"").trim();
      if(!project||!name)return;
      project.name=name;project.side=event.target.elements.side.value;saveDealProjects(store);renderProjectRail();renderHub();toast("Project updated");
    }
  });
  hub.addEventListener("dragstart",event=>{const item=event.target.closest("[data-action-id]");if(item)event.dataTransfer.setData("text/plain",item.dataset.actionId);});
  hub.addEventListener("dragover",event=>{const target=event.target.closest("[data-drop-status]");if(target){event.preventDefault();target.classList.add("drag-over");}});
  hub.addEventListener("dragleave",event=>event.target.closest("[data-drop-status]")?.classList.remove("drag-over"));
  hub.addEventListener("drop",event=>{const target=event.target.closest("[data-drop-status]");if(!target)return;event.preventDefault();const action=actionById(event.dataTransfer.getData("text/plain"));if(action){action.status=target.dataset.dropStatus;save();renderHub();}});
  const priorRender=renderLogic;
  renderLogic=function(issue){priorRender(issue);decorateRecommendations();};
  document.addEventListener("missing-ip-logic-rendered",decorateRecommendations);
  document.addEventListener("option-holders-logic-rendered",decorateRecommendations);
  document.addEventListener("threatened-litigation-logic-rendered",decorateRecommendations);
  renderProjectRail();
  showProjectStart();
  renderHub();
  if(currentIssue())decorateRecommendations();
})();
