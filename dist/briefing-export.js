/* Native Word export. docx is loaded locally on demand; no deal data leaves the browser. */
(() => {
  const assetBase = new URL('./', document.currentScript?.src || location.href);
  let library;
  let font;
  let logo;
  function loadLogo() {
    if (!logo) logo = fetch(new URL('deallogic-logo.png', assetBase)).then(response => {
      if (!response.ok) throw new Error('Unable to load the briefing logo.');
      return response.arrayBuffer();
    }).then(data => new Uint8Array(data)).catch(error => { logo = null; throw error; });
    return logo;
  }
  function loadFont() {
    if (!font) font = fetch(new URL('vendor/fonts/Inter.ttf', assetBase)).then(response => {
      if (!response.ok) throw new Error('Unable to load the briefing font.');
      return response.arrayBuffer();
    }).then(data => new Uint8Array(data)).catch(error => { font = null; throw error; });
    return font;
  }
  function loadLibrary() {
    if (globalThis.docx) return Promise.resolve(globalThis.docx);
    if (!library) library = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('vendor/docx.js', assetBase).href;
      script.onload = () => resolve(globalThis.docx);
      script.onerror = () => { script.remove(); library = null; reject(new Error('Word export could not load. Please try again.')); };
      document.head.append(script);
    });
    return library;
  }
  const riskScore = issue => Number(String(issue.risk || '').match(/([1-5])\s*\/\s*5/)?.[1]) || 0;
  const riskColours = ['647067', '38734B', '746B21', 'A85C28', 'A33238', '642C4C'];
  const labels = ['Required', 'Recommended', 'Consider'];
  async function build({ project = {}, issues = [], actions = [], date = new Date() }) {
    const [d, fontData, logoData] = await Promise.all([loadLibrary(), loadFont(), loadLogo()]);
    const { Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, Document, Packer, Header, Footer, PageNumber, ExternalHyperlink } = d;
    const text = (value, options = {}) => new TextRun({ text: String(value ?? ''), ...options });
    const p = (value, style = 'Normal', options = {}) => new Paragraph({ style, children: [text(value)], ...options });
    const heading = (value, level = 2) => p(value, `Heading${level}`);
    const cell = (value, width, header = false, colour) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: { fill: header ? 'E9EEE9' : 'FFFFFF' },
      margins: { top: 110, bottom: 110, left: 140, right: 140 },
      children: [new Paragraph({ style: 'TableText', children: [text(value, { bold: header, ...(colour ? { color: colour } : {}) })] })]
    });
    const ordered = [...issues].sort((a, b) => riskScore(b) - riskScore(a));
    // Preserve actions whose source issue is no longer present, rather than silently dropping them.
    if (actions.some(a => !issues.some(i => i.id === a.issueId))) ordered.push({ id: null, title: 'Other deal actions', risk: 'Not assessed', summary: '' });
    const actionsFor = issue => actions.filter(a => issue.id === null ? !issues.some(i => i.id === a.issueId) : a.issueId === issue.id);
    const dealName = project.name || 'Deal workspace';
    const children = [p('Deal Hub Briefing', 'Title'), p(dealName, 'Subtitle'),
      p(`Exported ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}${project.side ? `  ·  ${project.side} perspective` : ''}`, 'Metadata'),
      p(`${issues.length} saved issue${issues.length === 1 ? '' : 's'} and ${actions.length} action${actions.length === 1 ? '' : 's'}. Issues appear in descending risk order; actions are grouped by recommendation priority.`),
      heading('Deal overview')];
    if (ordered.length) children.push(new Table({
      width: { size: 9638, type: WidthType.DXA }, columnWidths: [5800, 2658, 1180],
      borders: Object.fromEntries(['top','bottom','left','right','insideHorizontal','insideVertical'].map(key => [key, { style: 'single', size: 1, color: 'DCE3DC' }])),
      rows: [new TableRow({ tableHeader: true, children: [cell('Issue',5800,true),cell('Risk',2658,true),cell('Actions',1180,true)] }),
        ...ordered.map(issue => new TableRow({ cantSplit: true, children: [cell(issue.title,5800),cell(issue.risk || 'Not assessed',2658,false,riskColours[riskScore(issue)]),cell(actionsFor(issue).length,1180)] }))]
    }));
    else children.push(p('No saved issues or actions in this deal.', 'Metadata'));
    for (const [index, issue] of ordered.entries()) {
      children.push(new Paragraph({ style: 'Heading1', pageBreakBefore: true, children: [text(`${String(index + 1).padStart(2,'0')}  ${issue.title}`)] }));
      children.push(new Paragraph({ style: 'Risk', children: [text(issue.risk || 'Not assessed', { color: riskColours[riskScore(issue)], bold: true })] }));
      if (issue.summary) children.push(heading('Position at a glance'), p(issue.summary));
      const source = [issue.sourceDocument, issue.sourceClause].filter(Boolean).join(' · ');
      if (source) children.push(p(`Source: ${source}`, 'Metadata'));
      if (/^https?:\/\//i.test(issue.sourceUrl || '')) children.push(new Paragraph({ children: [new ExternalHyperlink({ link: issue.sourceUrl, children: [text('Open source document', { style: 'Hyperlink' })] })] }));
      const items = actionsFor(issue);
      children.push(heading('Recommended actions'));
      if (!items.length) children.push(p('No actions saved for this issue.', 'Metadata'));
      const groups = [...labels, ...new Set(items.map(a => a.priority || 'Other').filter(label => !labels.includes(label)))];
      for (const label of groups) {
        const group = items.filter(a => (a.priority || 'Other') === label);
        if (!group.length) continue;
        children.push(heading(label === 'Consider' ? 'For consideration' : label, 3));
        for (const action of group) {
          children.push(p(action.title || 'Action', 'ActionTitle'));
          children.push(p([action.dealPhase, action.status && `Status: ${action.status}`, action.side && `Perspective: ${action.side}`].filter(Boolean).join('  ·  '), 'ActionMeta'));
          children.push(p(action.instruction || ''));
          if (action.notes) children.push(p(`Note: ${action.notes}`, 'Note'));
        }
      }
    }
    const style = (id, name, size, extra = {}) => ({ id, name, basedOn: 'Normal', next: 'Normal', run: { font: 'Inter', size, color: '000000' }, paragraph: { spacing: { after: 140 }, ...extra } });
    const doc = new Document({ fonts: [{ name: 'Inter', data: fontData }], creator: 'DealLogic', title: `${dealName} — Deal Hub Briefing`,
      styles: { default: { title: style('Title','Title',44,{ spacing: { before:360,after:160 },keepNext:true }),
        ...Object.fromEntries([1,2,3].map(level=>[`heading${level}`,style(`Heading${level}`,`Heading ${level}`,[0,32,25,22][level],{outlineLevel:level-1,keepNext:true,spacing:{before:260,after:140}})])), document: { run: { font: 'Inter', size: 21, color: '26372D' }, paragraph: { spacing: { after: 160, line: 288 }, widowControl: true } } }, paragraphStyles: [
        style('Subtitle','Subtitle',28,{ keepNext: true }),
        style('Metadata','Metadata',18), style('TableText','Table text',19),
        style('Risk','Risk',22,{ keepNext: true }),
        { ...style('ActionTitle','Action title',22,{ keepNext: true, spacing: { before: 180, after: 50 } }), run: { font:'Inter',size:22,bold:true } },
        { ...style('ActionMeta','Action metadata',17,{ keepNext:true, spacing:{ after:90 } }), run:{ font:'Inter',size:17,color:'526159' } },
        { ...style('Note','Note',19), run:{ font:'Inter',size:19,italics:true,color:'526159' } }
      ] },
      sections: [{ properties: { page: { size: { width:11906, height:16838 }, margin: { top:1134,bottom:1134,left:1134,right:1134,header:480,footer:480 } } },
        headers: { default: new Header({ children:[new Paragraph({ spacing: { after: 0 }, children: [new ImageRun({ type: 'png', data: logoData, transformation: { width: 119, height: 28 }, altText: { title: 'Deal Logic', description: 'Deal Logic layered mark', name: 'Deal Logic logo' } })] })] }) },
        footers: { default: new Footer({ children:[new Paragraph({ alignment:'right', children:[text(`Deal Hub Briefing · ${dealName} · `,{size:17,color:'526159'}),new TextRun({children:[PageNumber.CURRENT],size:17})] })] }) }, children }]
    });
    return Packer.toBlob(doc);
  }
  globalThis.DealLogicBriefing = { build };
})();
