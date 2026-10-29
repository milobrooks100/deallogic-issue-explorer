(() => {
  const registry=window.DealLogicActionRegistry;
  const library=document.querySelector(".action-library");
  if(!registry||!library)return;
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const coreItems=library.querySelector(".action-items");
  let activeArea="core",activeTopic=registry.topics[0].id;

  const areaTabs=document.createElement("div");areaTabs.className="library-tabs";areaTabs.setAttribute("role","tablist");areaTabs.setAttribute("aria-label","Action Library sections");
  areaTabs.innerHTML='<button type="button" role="tab" id="library-tab-core" aria-controls="library-panel-core" aria-selected="true" tabindex="0" data-library-area="core">Core M&amp;A toolkit</button><button type="button" role="tab" id="library-tab-playbooks" aria-controls="library-panel-playbooks" aria-selected="false" tabindex="-1" data-library-area="playbooks">Actions by issue</button>';
  const corePanel=document.createElement("section");corePanel.id="library-panel-core";corePanel.className="library-panel core-library-panel";corePanel.setAttribute("role","tabpanel");corePanel.setAttribute("aria-labelledby","library-tab-core");
  corePanel.innerHTML='<div class="library-section-heading"><h3>Core M&amp;A toolkit</h3><p>Common M&amp;A responses and their shorthand symbols.</p></div>';
  if(coreItems)corePanel.append(coreItems);
  const playbooksPanel=document.createElement("section");playbooksPanel.id="library-panel-playbooks";playbooksPanel.className="library-panel";playbooksPanel.setAttribute("role","tabpanel");playbooksPanel.setAttribute("aria-labelledby","library-tab-playbooks");playbooksPanel.hidden=true;
  playbooksPanel.innerHTML=`<div class="playbook-tabs" role="tablist" aria-label="Actions by issue">${registry.topics.map((topic,index)=>`<button type="button" role="tab" id="playbook-tab-${esc(topic.id)}" aria-controls="playbook-panel-active" aria-selected="${index===0}" tabindex="${index===0?0:-1}" data-playbook-topic="${esc(topic.id)}">${esc(topic.shortLabel)}</button>`).join("")}</div><section class="playbook-panel" id="playbook-panel-active" role="tabpanel"></section>`;
  library.replaceChildren(areaTabs,corePanel,playbooksPanel);

  const focusTab=(tabs,next)=>{tabs[next].focus();tabs[next].click();};
  const wireTabs=tablist=>{
    tablist.addEventListener("keydown",event=>{
      const tabs=[...tablist.querySelectorAll('[role="tab"]')],current=tabs.indexOf(document.activeElement);if(current<0)return;
      let next=current;if(event.key==="ArrowRight")next=(current+1)%tabs.length;else if(event.key==="ArrowLeft")next=(current-1+tabs.length)%tabs.length;else if(event.key==="Home")next=0;else if(event.key==="End")next=tabs.length-1;else return;
      event.preventDefault();focusTab(tabs,next);
    });
  };
  wireTabs(areaTabs);wireTabs(playbooksPanel.querySelector(".playbook-tabs"));

  function renderTopic(){
    const topic=registry.byTopic.get(activeTopic)||registry.topics[0];activeTopic=topic.id;
    playbooksPanel.querySelectorAll("[data-playbook-topic]").forEach(button=>{const selected=button.dataset.playbookTopic===topic.id;button.setAttribute("aria-selected",String(selected));button.tabIndex=selected?0:-1;});
    const panel=playbooksPanel.querySelector(".playbook-panel");
    panel.setAttribute("aria-labelledby",`playbook-tab-${topic.id}`);
    panel.innerHTML=`<div class="library-section-heading"><div class="playbook-title-row"><h3>${esc(topic.label)}</h3><span class="playbook-count">${topic.actions.length} actions</span></div><p>This is the full action set for this issue. Deal Map will recommend only the actions that fit the answers you have recorded.</p><p class="priority-note">Priority depends on the recorded facts and transaction side.</p></div><div class="playbook-grid">${topic.actions.map(action=>{const added=window.isActionInDealHub?.(topic.id,action.id);return `<article class="playbook-card" data-library-action="${esc(action.id)}"><span class="action-symbol" data-vector="true"><i data-lucide="${esc(action.icon)}" aria-hidden="true"></i></span><div class="playbook-card-copy"><h4>${esc(action.title)}</h4><p>${esc(action.description)}</p><div class="playbook-card-meta"><span class="phase-label">${esc(action.phase)}</span><button type="button" class="library-add" data-add-library-action="${esc(action.id)}" ${added?"disabled":""}>${added?"Added to Deal Hub":"Add to Deal Hub"}</button></div></div></article>`}).join("")}</div>`;
    window.lucide?.createIcons({attrs:{"stroke-width":1.75}});
  }
  function selectArea(area){
    activeArea=area==="playbooks"?"playbooks":"core";
    areaTabs.querySelectorAll("[data-library-area]").forEach(button=>{const selected=button.dataset.libraryArea===activeArea;button.setAttribute("aria-selected",String(selected));button.tabIndex=selected?0:-1;});
    corePanel.hidden=activeArea!=="core";playbooksPanel.hidden=activeArea!=="playbooks";
    if(activeArea==="playbooks")renderTopic();
  }
  areaTabs.addEventListener("click",event=>{const button=event.target.closest("[data-library-area]");if(button)selectArea(button.dataset.libraryArea);});
  playbooksPanel.addEventListener("click",event=>{
    const topicButton=event.target.closest("[data-playbook-topic]");if(topicButton){activeTopic=topicButton.dataset.playbookTopic;renderTopic();return;}
    const add=event.target.closest("[data-add-library-action]");if(!add)return;
    const topic=registry.byTopic.get(activeTopic),action=topic?.actions.find(item=>item.id===add.dataset.addLibraryAction);if(!action)return;
    if(window.addLibraryActionToDealHub?.(topic.id,action))renderTopic();
  });
  window.openActionPlaybook=issueId=>{if(registry.byTopic.has(issueId))activeTopic=issueId;selectArea("playbooks");window.showDealLogicView?.("action-library");requestAnimationFrame(()=>playbooksPanel.querySelector(`[data-playbook-topic="${CSS.escape(activeTopic)}"]`)?.focus());};

  const addDealMapLink=()=>{
    const issue=typeof current==="function"?current():null,topic=issue&&registry.byTopic.get(issue.id),card=document.querySelector("#logic-card");if(!topic||!card)return;
    let link=card.querySelector(".playbook-deep-link");if(link?.dataset.playbookTopic===topic.id)return;
    if(!link){link=document.createElement("a");link.className="playbook-deep-link";card.append(link);}
    link.dataset.playbookTopic=topic.id;link.href=`#action-library/playbooks/${topic.id}`;link.textContent=`View all ${topic.actions.length} actions in Action Library →`;link.onclick=event=>{event.preventDefault();window.openActionPlaybook(topic.id);};
  };
  const panel=document.querySelector("#panel");if(panel)new MutationObserver(addDealMapLink).observe(panel,{childList:true,subtree:true});addDealMapLink();
  document.addEventListener("deal-hub-actions-change",()=>{if(activeArea==="playbooks")renderTopic();});
  document.addEventListener("deal-project-change",()=>{if(activeArea==="playbooks")renderTopic();});
  renderTopic();
})();
