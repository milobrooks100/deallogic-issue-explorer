/* Presentation layer: existing issue rules, answers and project storage remain authoritative. */
(() => {
  const paths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/>',
    book: '<path d="M12 5C8 2 4 3 3 4v15c3-2 6-1 9 1 3-2 6-3 9-1V4c-3-2-6-1-9 1Zm0 0v15"/>',
    settings: '<path d="m10 3-1 3-3 1-3 3 2 2-1 4 3 1 2 4h4l1-3 4-1 3-3-2-2 1-4-3-1-2-4Z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    document: '<path d="M14 3H5v18h14V8ZM14 3v5h5M8 12h8M8 16h6"/>',
    shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    folder: '<path d="M3 6h7l2 3h9v12H3Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    scale: '<path d="M12 3v18M6 21h12M4 7h16M6 7l-4 8h8ZM18 7l-4 8h8Z"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0-5 5L3 18l3 3 6.5-6.5a4 4 0 0 0 5-5l-3 3-3-3 3-3Z"/>',
    handshake: '<path d="m8 11 3 3a2 2 0 0 0 3-3l-2-2 2 2a2 2 0 0 0 3-3l-4-4a3 3 0 0 0-4 0L7 6l-2-1-3 3 5 5 1-1Z"/><path d="m14 14 1 1a2 2 0 0 0 3-3"/>',
    circleCheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    filePenLine: '<path d="M14 3H5v18h14V8ZM14 3v5h5"/><path d="m10 16 4.5-4.5 2 2L12 18l-3 .5Z"/><path d="m13.5 12.5 2 2"/>',
    shieldCheck: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    banknote: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M7 9h.01M17 15h.01"/>',
    fileSearch: '<path d="M14 3H5v18h14V8ZM14 3v5h5"/><circle cx="10.5" cy="14.5" r="2.5"/><path d="m12.5 16.5 2 2"/>',
    lockKeyhole: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/><circle cx="12" cy="14" r="1"/>',
    arrowDownUp: '<path d="m3 8 4-4 4 4M7 4v16m14-8-4 4-4-4m4 4V4"/>',
    calendarCheck: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4"/>',
    arrowCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8m-3-3 3 3-3 3"/>',
    arrowLeftRight: '<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
    ellipsisCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>'
  };
  const lucideNames = {
    grid:'layout-grid', map:'map', book:'book-open', radar:'radar', settings:'settings', check:'check', document:'file-text', shield:'shield-check', arrow:'arrow-right', search:'search', folder:'folder', clock:'clock', scale:'scale', wrench:'wrench', handshake:'handshake', circleCheck:'circle-check', filePenLine:'file-pen-line', shieldCheck:'shield-check', banknote:'banknote', fileSearch:'file-search', lockKeyhole:'lock-keyhole', arrowDownUp:'arrow-down-up', calendarCheck:'calendar-check', arrowCircle:'circle-arrow-right', arrowLeftRight:'arrow-left-right', ellipsisCircle:'ellipsis'
  };
  const icon = name => `<i data-lucide="${lucideNames[name] || lucideNames.document}" aria-hidden="true"></i>`;
  const renderLucideIcons = () => window.lucide?.createIcons({ attrs: { 'stroke-width': 1.75 } });
  const destinations = [['deal-map','Deal Map','map'],['deal-hub','Deal Hub','grid'],['action-library','Action Library','book'],['company-radar','Company Radar','radar'],['settings','Settings','settings']];
  const sidebarPreference = (key) => DealLogicStorage.getItem(`deallogic:${key}-sidebar-collapsed`) === 'true';
  const setSidebarPreference = (key, collapsed) => DealLogicStorage.setItem(`deallogic:${key}-sidebar-collapsed`, String(collapsed));
  let currentView = 'deal-map';
  const main = document.querySelector('main');
  main.classList.toggle('workspace-rail-collapsed', sidebarPreference('workspace'));
  document.querySelector('.workspace')?.classList.toggle('map-sidebar-collapsed', sidebarPreference('map'));
  const top = document.createElement('div');
  top.className = 'workspace-context';
  top.innerHTML = '<span class="context-project"></span><span class="context-divider">/</span><span class="context-view">Deal Map</span><span class="context-status"><i></i> Saved in this browser</span>';
  main.prepend(top);
  const skip = document.createElement('a');
  skip.href = '#workspace-content'; skip.className = 'skip-content'; skip.textContent = 'Skip to content';
  top.id = 'workspace-content'; top.tabIndex = -1; document.body.prepend(skip);
  function updateContext() {
    top.querySelector('.context-project').textContent = activeDealProject().name;
    top.querySelector('.context-view').textContent = destinations.find(([id])=>id===currentView)?.[1] || 'Deal Map';
    document.querySelectorAll('[data-workspace-view]').forEach(button=> {
      const active = button.dataset.workspaceView === currentView;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    const projects=getDealProjects().projects;
    document.querySelectorAll('[data-switch-deal-project]').forEach(button=>{
      const project=projects.find(item=>item.id===button.dataset.switchDealProject);
      const detail=button.querySelector('small');
      if(project && !project.isQuick && detail){const text=`${project.side} · ${project.hub?.actions?.length||0} actions`;if(detail.textContent!==text)detail.textContent=text;}
    });
  }
  function decorateRail() {
    const rail = document.querySelector('.project-rail');
    if (!rail || rail.querySelector('.workspace-navigation')) return;
    const nav = document.createElement('div'); nav.className = 'workspace-navigation';
    nav.innerHTML = `<a class="workspace-brand" href="#deal-map" aria-label="DealLogic home"><span class="brand-mark">${icon('scale')}</span><span class="workspace-brand-name">DealLogic<small>Transaction workspace</small></span></a><div class="nav-caption"><span class="nav-caption-label">WORKSPACE</span><button type="button" class="sidebar-collapse-toggle" data-collapse-workspace aria-label="${main.classList.contains('workspace-rail-collapsed') ? 'Expand workspace sidebar' : 'Collapse workspace sidebar'}" aria-expanded="${!main.classList.contains('workspace-rail-collapsed')}" aria-controls="workspace-navigation-links" title="${main.classList.contains('workspace-rail-collapsed') ? 'Expand workspace sidebar' : 'Collapse workspace sidebar'}"><i data-lucide="chevron-left" aria-hidden="true"></i></button></div><nav id="workspace-navigation-links" aria-label="Main navigation">${destinations.map(([id,label,symbol])=>`<button type="button" data-workspace-view="${id}" aria-label="${label}" title="${label}">${icon(symbol)}<span>${label}</span></button>`).join('')}</nav>`;
    rail.prepend(nav);
    main.prepend(rail);
    nav.querySelector('.workspace-brand').onclick = event => {event.preventDefault();window.showDealLogicView('deal-map');};
    nav.querySelectorAll('button').forEach(button=>button.onclick=()=>window.showDealLogicView(button.dataset.workspaceView));
    nav.querySelector('[data-collapse-workspace]').onclick = () => {
      const collapsed = main.classList.toggle('workspace-rail-collapsed');
      setSidebarPreference('workspace', collapsed);
      const button = nav.querySelector('[data-collapse-workspace]');
      const label = `${collapsed ? 'Expand' : 'Collapse'} workspace sidebar`;
      button.setAttribute('aria-label', label); button.title = label; button.setAttribute('aria-expanded', String(!collapsed));
    };
    updateContext();
  }
  function decorateMapSidebar() {
    const map = document.querySelector('.map');
    if (!map) return;
    const heading = map.querySelector('h3');
    if (heading && !heading.querySelector('[data-collapse-map]')) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'sidebar-collapse-toggle'; button.dataset.collapseMap = '';
      button.setAttribute('aria-controls', 'mind-map');
      button.innerHTML = '<i data-lucide="chevron-left" aria-hidden="true"></i>';
      button.onclick = () => {
        const collapsed = map.closest('.workspace').classList.toggle('map-sidebar-collapsed');
        setSidebarPreference('map', collapsed);
        updateMapToggle();
      };
      heading.append(button);
    }
    const updateMapToggle = () => {
      const button = heading.querySelector('[data-collapse-map]');
      if (!button) return;
      const collapsed = map.closest('.workspace').classList.contains('map-sidebar-collapsed');
      const label = `${collapsed ? 'Expand' : 'Collapse'} Deal Map sidebar`;
      button.setAttribute('aria-label', label); button.title = label; button.setAttribute('aria-expanded', String(!collapsed));
    };
    updateMapToggle();
  }
  const originalShow = window.showDealLogicView;
  window.showDealLogicView = view => {
    originalShow?.(view); currentView=view;
    document.querySelector('.project-start')?.classList.toggle('screen-hidden', view!=='deal-map');
    if(document.querySelector('.project-start') && view==='deal-map') document.querySelector('.workspace')?.classList.add('screen-hidden');
    updateContext();
  };
  function polish() {
    decorateRail(); updateContext();
    decorateMapSidebar();
    const actionLibraryIcons = {
      'Further diligence':'search',
      'Rectification':'wrench',
      'Third-party consent':'handshake',
      'Condition precedent':'circleCheck',
      'Pre-completion covenant':'filePenLine',
      'Warranty':'shieldCheck',
      'Specific indemnity':'banknote',
      'Specific disclosure':'fileSearch',
      'Escrow or retention':'lockKeyhole',
      'Price adjustment':'arrowDownUp',
      'Completion mechanic':'calendarCheck',
      'Post-completion action':'arrowCircle',
      'Walk away or renegotiate':'arrowLeftRight',
      'Other':'ellipsisCircle'
    };
    document.querySelectorAll('.logic-icon,.action-symbol').forEach(node=>{
      if(node.dataset.vector)return;
      const label = node.parentElement.querySelector('strong')?.textContent.trim() || '';
      // Custom library symbols are user content and are preserved.
      if(node.closest('.custom-library-action'))return;
      const name = actionLibraryIcons[label] || (/diligence/i.test(label)?'search':/consent|warranty|indemnity/i.test(label)?'shield':/completion|condition/i.test(label)?'check':/price|escrow/i.test(label)?'scale':'document');
      node.closest('.logic-action')?.setAttribute('data-action-icon', name);
      node.dataset.originalIcon=node.textContent.trim();node.innerHTML=icon(name);node.dataset.vector='true';
    });
    document.querySelectorAll('.hub-item h4').forEach(heading=>{
      if(heading.dataset.vector)return;
      const actionId=heading.closest('[data-action-id]')?.dataset.actionId;
      const savedAction=activeDealProject().hub.actions.find(action=>action.id===actionId);
      if(savedAction?.manual && !["library", "company-radar"].includes(savedAction.selectionSource))return;
      const title=heading.textContent.replace(/^\S+\s/,'');
      const iconKeyMap={'file-text':'document','circle-arrow-right':'arrowCircle','file-pen-line':'filePenLine','shield-check':'shieldCheck','circle-check':'circleCheck','file-search':'fileSearch','arrow-down-up':'arrowDownUp','calendar-check':'calendarCheck','arrow-left-right':'arrowLeftRight','ellipsis':'ellipsisCircle'};
      const symbol=savedAction?.selectionSource === 'company-radar' ? 'ellipsisCircle' : iconKeyMap[savedAction?.iconKey] || savedAction?.iconKey || actionLibraryIcons[title] || (/warranty|indemnity|consent/i.test(title)?'shieldCheck':/completion|condition/i.test(title)?'circleCheck':'document');
      heading.closest('.hub-item')?.setAttribute('data-action-icon', symbol);
      const label=document.createElement('span');label.textContent=title;
      heading.replaceChildren();heading.insertAdjacentHTML('afterbegin',icon(symbol));heading.append(label);heading.dataset.vector='true';
    });
    document.querySelectorAll('.logic-priority').forEach(node=>{
      const level=node.textContent.trim().toLowerCase();
      if(node.dataset.level!==level)node.dataset.level=level;
    });
    document.querySelectorAll('.area').forEach(button=>button.setAttribute('aria-expanded',String(button.classList.contains('open'))));
    document.querySelectorAll('.issue-node').forEach(button=>button.setAttribute('aria-pressed',String(button.classList.contains('active'))));
    document.querySelectorAll('.info').forEach(button=>button.setAttribute('aria-label','More information'));
    const empty=document.querySelector('#panel > .empty-state');
    if(empty && !empty.querySelector('.explore-categories') && issues.length){
      const prompt = document.createElement('h3');prompt.textContent='Explore a legal issue';empty.prepend(prompt);
      const cards=document.createElement('div');cards.className='explore-categories';
      issues.forEach(issue=>{
        const button=document.createElement('button');button.type='button';
        const mark=document.createElement('span');mark.className='category-symbol';mark.innerHTML=icon('document');
        const label=document.createElement('span');const category=document.createElement('small');category.textContent=areas[issue.category];const title=document.createElement('strong');title.textContent=issue.title;
        label.append(category,title);button.append(mark,label);button.insertAdjacentHTML('beforeend',icon('arrow'));
        button.onclick=()=>{selectedId=issue.id;openArea=issue.category;loadAnswers();renderMap();renderPanel();};cards.append(button);
      });empty.append(cards);
    }
    const hub=document.querySelector('.deal-hub-view');
    if(hub && hub.querySelector('[data-hub-view="summary"].active') && !hub.querySelector('.workspace-metrics')){
      const data=activeDealProject().hub;const actions=data.actions||[];
      const metrics=document.createElement('div');metrics.className='workspace-metrics';metrics.setAttribute('aria-label','Deal overview');
      const values=[['Open issues',(data.issues||[]).length,'document'],['Action items',actions.length,'grid'],['Required actions',actions.filter(a=>a.priority==='Required').length,'shield'],['Satisfied / closed',actions.filter(a=>a.status==='Satisfied/Closed').length,'check']];
      metrics.innerHTML=values.map(([label,count,symbol])=>`<div class="metric"><span class="metric-label">${label}</span><span class="metric-icon">${icon(symbol)}</span><strong>${count}</strong></div>`).join('');
      hub.querySelector('.hub-content')?.prepend(metrics);
    }
    renderLucideIcons();
  }
  let queued=false;
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;observer.disconnect();polish();observer.observe(main,{childList:true,subtree:true});});});
  polish();observer.observe(main,{childList:true,subtree:true});
  document.addEventListener('deal-project-change',updateContext);
})();
