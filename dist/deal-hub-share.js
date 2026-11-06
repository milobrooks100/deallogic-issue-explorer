/* Local file sharing; the receiving app controls how title/text are used. */
(() => {
  const formats = {
    briefing: { label: 'Briefing (.docx)', name: 'deal-hub-briefing.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', subject: 'Deal Hub briefing', noun: 'briefing' },
    table: { label: 'Action table (.csv)', name: 'deal-hub-actions.csv', type: 'text/csv;charset=utf-8', subject: 'Deal Hub action table', noun: 'action table' }
  };
  const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  function csvBlob({ issues = [], actions = [] }) {
    const rows = [['Issue','Risk','Source document','Clause / finding','Document link','Action','Recommendation','Transaction side','Action label','Deal phase','Priority','Status','Notes']];
    for (const action of actions) {
      const issue = issues.find(item => item.id === action.issueId);
      rows.push([issue?.title,issue?.risk,issue?.sourceDocument,issue?.sourceClause,issue?.sourceUrl,action.title,action.instruction,action.side,action.priority,action.dealPhase,action.urgency,action.status,action.notes]);
    }
    return new Blob(['\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: formats.table.type });
  }
  function message(kind, snapshot) {
    const format = formats[kind], name = snapshot.project?.name || 'Deal workspace';
    const title = `${name} — ${format.subject}`;
    const text = `Hi,\n\nPlease find attached the ${format.noun} for ${name}, exported from DealLogic.\n\nPlease review and let me know if you have any comments.\n\nThanks`;
    return { title, text, mailto: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}` };
  }
  function canShareFile(file, device = navigator) {
    try { return typeof device.share === 'function' && typeof device.canShare === 'function' && device.canShare({ files: [file] }); }
    catch { return false; }
  }
  function mount(root, { getSnapshot, download }) {
    let expanded = false, generation = 0, pending = false, ready = {}, snapshot, key;
    const make = (tag, text, attrs = {}) => {
      const element = document.createElement(tag); element.textContent = text;
      for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
      return element;
    };
    const group = document.createElement('div'); group.className = 'hub-share-options transaction-side-options';
    group.setAttribute('role','group'); group.setAttribute('aria-label','Share Deal Hub file');
    const notice = document.createElement('div'); notice.setAttribute('aria-label','Share by email'); notice.className = 'hub-share-notice'; notice.hidden = true;
    root.append(group, notice);
    const button = (label, action) => { const element = make('button',label,{type:'button'}); element.onclick = action; return element; };
    function close(focus = true) { expanded = false; generation++; ready = {}; draw(); if(focus)group.querySelector('button')?.focus(); }
    function fallback(kind, file, error = false) {
      notice.replaceChildren(); notice.hidden = false;
      notice.append(make('p', error ? 'This file could not be shared directly. Download it and attach it to the prefilled email.' : 'This browser cannot share this file directly. Download it and attach it to the prefilled email.', {role:'status'}));
      notice.append(button('Download file', () => download(file.name,file.type,file)));
      const email = make('a','Open email',{href:message(kind,snapshot).mailto});
      notice.append(email, button('Dismiss',()=>{notice.hidden=true;}));
    }
    function share(kind) {
      const entry = ready[kind];
      if (pending || !entry?.file) return;
      // Never reuse a file after a deal change or edit while the options were open.
      if (JSON.stringify(getSnapshot()) !== key) { prepare(); return; }
      const file = entry.file, data = message(kind,snapshot);
      if (!canShareFile(file)) { fallback(kind,file); close(); return; }
      pending = true;
      // Call synchronously in the click handler: iOS requires fresh user activation.
      let operation;
      try { operation = navigator.share({ files:[file], title:data.title, text:data.text }); }
      catch (error) { operation = Promise.reject(error); }
      draw();
      Promise.resolve(operation).then(() => { close(); }).catch(error => {
        // Cancelling the sheet must not download files or launch an email draft.
        if(error.name !== 'AbortError') fallback(kind,file,true);
        close();
      }).finally(()=>{pending=false;if(root.isConnected)draw();});
    }
    function draw() {
      group.replaceChildren();
      if (!expanded) {
        const toggle=button(pending?'Sharing…':'Share',()=>{expanded=true;notice.hidden=true;prepare();});
        toggle.disabled=pending;toggle.setAttribute('aria-expanded','false');group.append(toggle);return;
      }
      for(const [kind,format] of Object.entries(formats)) {
        const entry=ready[kind];
        const option=button(entry?.error?`Retry ${format.label}`:format.label,()=>entry?.error?prepare():share(kind));
        option.disabled=pending||!entry;option.setAttribute('aria-expanded','true');option.setAttribute('aria-label',`Share ${format.label}`);group.append(option);
      }
      group.append(button('Cancel',()=>close()));
      if(!ready.briefing||!ready.table)group.append(make('span','Preparing files…',{role:'status'}));
      if(Object.values(ready).some(entry=>entry.error))group.append(make('span','A file could not be prepared. Select Retry to try again.',{role:'status'}));
    }
    function prepare() {
      const token=++generation;
      snapshot=JSON.parse(JSON.stringify(getSnapshot()));key=JSON.stringify(snapshot);ready={};draw();
      // Preparation happens on expanding Share, before the file selection click.
      for(const [kind,format] of Object.entries(formats)) {
        Promise.resolve().then(()=>kind==='table'?csvBlob(snapshot):window.DealLogicBriefing.build(snapshot)).then(blob=>{
          if(token!==generation||!root.isConnected)return;
          ready[kind]={file:new File([blob],format.name,{type:format.type})};
          const hadFocus=group.contains(document.activeElement), selected=document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent;
          draw();
          if(hadFocus)([...group.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label')||b.textContent)===selected)||group.querySelector('button:not(:disabled)'))?.focus();
        }).catch(()=>{if(token===generation&&root.isConnected){ready[kind]={error:true};draw();}});
      }
      group.querySelector('button:not(:disabled)')?.focus();
    }
    function outside(event){if(expanded&&!root.contains(event.target)&&!event.composedPath?.().includes(root))close(false);}
    function escape(event){if(event.key==='Escape'&&expanded){event.preventDefault();close();}}
    document.addEventListener('click',outside);root.addEventListener('keydown',escape);draw();
    return {destroy(){generation++;document.removeEventListener('click',outside);root.removeEventListener('keydown',escape);}};
  }
  window.DealLogicSharing={mount,csvBlob,message,canShareFile};
})();
