import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../dist/employees.js', import.meta.url), 'utf8');
const issues = JSON.parse(await readFile(new URL('../dist/issues.json', import.meta.url), 'utf8'));
const employee = issues.find(issue => issue.category === 'employees');
const registrySource = await readFile(new URL('../dist/action-registry.js', import.meta.url), 'utf8');
function setup() {
  const card = { innerHTML: '', querySelector() {return null;}, classList: { add() {}, remove() {} } };
  let report;
  const context = vm.createContext({
    window: {}, getTransactionSide: () => 'Balanced', CustomEvent: class {}, answers: {}, current: () => employee, areas: {employees: 'Employment'},
    riskScore: () => 4, riskNames: ['No risk','Low risk','Medium risk','High risk','Very high risk'], renderPanel() {}, renderLogic() { card.innerHTML = 'Existing issue'; },
    exportReport() { report = 'Existing export'; },
    Blob: class { constructor(parts) { report = parts.join(''); } },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    document: { dispatchEvent() {}, getElementById() {return null;}, querySelector: selector => selector === '#logic-card' ? card : null, createElement: () => ({click() {}}) }
  });
  vm.runInContext(registrySource, context);
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'globalThis.employeeTest = { fields, ids, visibleIds, normalize, buildAnalysis, summaryCopy, implicationCopy, assessRisk, chooseActions, contextFields, contextIds }; })();'), context);
  return { context, card, getReport: () => report, ...context.employeeTest };
}
test('progressive reveal stops at unanswered, invalid or confirmed absence', () => {
  const { ids, visibleIds } = setup();
  assert.deepEqual(Array.from(visibleIds({})), [ids[0]]);
  assert.equal(visibleIds({[ids[0]]:'yes'}).length, 2);
  assert.equal(visibleIds({[ids[0]]:'no', [ids[1]]:'difficult'}).length, 1);
  assert.equal(visibleIds({[ids[0]]:'unknown'}).length, 2);
  assert.equal(visibleIds({[ids[0]]:'partly'}).length, 2);
  assert.equal(visibleIds({[ids[0]]:'invalid'}).length, 1);
});
test('obsolete dependent answers are removed from saved context', () => {
  const {ids, normalize} = setup();
  const responses = Object.fromEntries(ids.map(id => [id, 'yes']));
  responses[ids[0]] = 'no';
  normalize(responses);
  assert.deepEqual(responses, {[ids[0]]:'no'});
});
test('exports use visible current labels and never borrow litigation analysis', () => {
  const {context, ids, getReport, card} = setup();
  context.answers = {[ids[0]]:'no', [ids[1]]:'difficult'};
  context.exportReport();
  assert.match(getReport(), /Response: No/);
  assert.doesNotMatch(getReport(), /Difficult|litigation/i);
  context.renderLogic(employee);
  assert.match(card.innerHTML, /Key deal implications/);
  assert.doesNotMatch(card.innerHTML, /Limitation periods/);
  context.renderLogic({id:'other'});
  assert.equal(card.innerHTML, 'Existing issue');
});

test('legacy uncertainty selections migrate without losing later answers', () => {
  const {ids, normalize} = setup();
  const responses = Object.fromEntries(ids.map(id => [id, 'not-assessed']));
  responses[ids[1]] = 'manageable';
  normalize(responses);
  assert.deepEqual(responses, {
    [ids[0]]: 'unknown', [ids[1]]: 'manageable', [ids[2]]: 'unknown',
    [ids[3]]: 'unknown', [ids[4]]: 'unclear', [ids[5]]: 'unknown'
  });
});

test('all answer permutations produce complete prose or standby with at most three stable implications', () => {
  const {ids, fields, buildAnalysis, summaryCopy, implicationCopy} = setup();
  const stable = new Set(Object.values(implicationCopy));
  let checked = 0;
  function visit(index, responses) {
    if (index < ids.length) {
      const id = ids[index];
      for (const value of ['', ...fields[id].options.map(pair => pair[0])]) visit(index + 1, {...responses, [id]:value});
      return;
    }
    checked++;
    const result = buildAnalysis(responses);
    const complete = responses[ids[0]] === 'no' || ids.every(id => responses[id]);
    assert.equal(Boolean(result), Boolean(complete));
    if (!result) return;
    assert.ok(result.implications.length >= 1 && result.implications.length <= 3);
    assert.equal(new Set(result.implications).size, result.implications.length);
    result.implications.forEach(text => assert.ok(stable.has(text)));
    assert.doesNotMatch(result.summary, /undefined|Unanswered|not-assessed/);
    const active = responses[ids[0]] === 'no' ? ids.slice(0,1) : ids;
    assert.equal(result.summary, active.map(id => summaryCopy[id][responses[id]]).join(' '));
  }
  visit(0, {});
  assert.equal(checked, 18000);
});
test('adverse, uncertain and clear cases retain distinct consequence themes', () => {
  const {ids, buildAnalysis, implicationCopy} = setup();
  const responses = values => Object.fromEntries(ids.map((id,i) => [id, values[i]]));
  const adverse = buildAnalysis(responses(['yes','difficult','some-leaving','no','yes','none-agreed']));
  assert.deepEqual(Array.from(adverse.implications), [implicationCopy.continuity, implicationCopy.arrangements, implicationCopy.payments]);
  const uncertain = buildAnalysis(responses(['unknown','unknown','unknown','unknown','unclear','unknown']));
  assert.deepEqual(Array.from(uncertain.implications), [implicationCopy.dependenceUnknown, implicationCopy.arrangements, implicationCopy.paymentsUnknown]);
  const clear = buildAnalysis(responses(['partly','easy','all-staying','yes','no','not-needed']));
  assert.deepEqual(Array.from(clear.implications), [implicationCopy.clear]);
  const inconsistent = buildAnalysis(responses(['yes','difficult','some-leaving','no','no','not-needed']));
  assert.ok(inconsistent.implications.includes(implicationCopy.reassess));
});
test('cleared answers restore standby and report matches the completed analysis', () => {
  const {context, ids, buildAnalysis, card, getReport} = setup();
  context.answers = Object.fromEntries(ids.map((id,i) => [id, ['yes','manageable','some-undecided','partly','unclear','some-outstanding'][i]]));
  const result = buildAnalysis(context.answers);
  context.renderLogic(employee);
  assert.ok(card.innerHTML.includes(result.summary));
  context.exportReport();
  assert.ok(getReport().includes(result.summary));
  result.implications.forEach(text => assert.ok(getReport().includes(text)));
  context.answers = {};
  context.renderLogic(employee);
  assert.match(card.innerHTML, /Answer all relevant questions/);
  assert.doesNotMatch(card.innerHTML, /Key deal implications/);
});

test('all planned departures appear in prose and trigger continuity implications', () => {
  const {ids, buildAnalysis, implicationCopy} = setup();
  const responses = Object.fromEntries(ids.map((id,i) => [id, ['yes','easy','all-leaving','yes','no','all-agreed'][i]]));
  const result = buildAnalysis(responses);
  assert.match(result.summary, /All identified key employees plan to leave the target/);
  assert.ok(result.implications.includes(implicationCopy.continuity));
  assert.ok(!result.implications.includes(implicationCopy.clear));
  responses[ids[5]] = 'not-needed';
  assert.ok(buildAnalysis(responses).implications.includes(implicationCopy.reassess));
});

test('risk matrix matches agreed examples and protected floors', () => {
  const {ids, assessRisk} = setup();
  const score = values => assessRisk(Object.fromEntries(ids.map((id,i) => [id, values[i]])));
  assert.equal(assessRisk({}), 1);
  assert.equal(score(['no']), 1);
  assert.equal(score(['yes','easy','all-staying','yes','no','all-agreed']), 2);
  assert.equal(score(['yes','easy','all-staying','yes','unclear','all-agreed']), 3);
  assert.equal(score(['yes','difficult','some-leaving','yes','no','all-agreed']), 4);
  assert.equal(score(['yes','easy','all-leaving','yes','no','all-agreed']), 3);
  assert.equal(score(['yes','difficult','all-leaving','no','yes','none-agreed']), 5);
  assert.equal(score(['yes','difficult','all-leaving','no','yes','all-agreed']), 4);
  assert.equal(score(['unknown','unknown','unknown','unknown','unclear','unknown']), 3);
  assert.equal(score(['partly','easy','all-staying','yes','no','not-needed']), 2);
  assert.equal(score(['yes','difficult','all-staying','yes','no','all-agreed']), 3);
});
test('all 18000 permutations respect bounds, active answers, floors and the exclusive very-high trigger', () => {
  const {ids, fields, assessRisk, visibleIds} = setup();
  let checked = 0;
  function visit(index, responses) {
    if (index < ids.length) {
      const id = ids[index];
      for (const value of ['', ...fields[id].options.map(pair => pair[0])]) visit(index+1, {...responses,[id]:value});
      return;
    }
    checked++;
    const visible = visibleIds(responses);
    const active = Object.fromEntries(ids.map(id => [id, visible.includes(id) ? responses[id] : '']));
    const score = assessRisk(responses);
    assert.equal(score, assessRisk(active));
    assert.ok(Number.isInteger(score) && score >= 1 && score <= 5);
    const [dependence,replacement,intentions,terms,payments,arrangements] = ids.map(id => active[id]);
    if (!dependence || dependence === 'no') { assert.equal(score,1); return; }
    assert.ok(score >= 2);
    const severe = dependence === 'yes' && replacement === 'difficult' && intentions === 'all-leaving'
      && terms === 'no' && arrangements && arrangements !== 'all-agreed';
    assert.equal(score === 5, Boolean(severe));
    if (replacement === 'unknown' || intentions === 'unknown' || terms === 'unknown'
      || payments === 'unclear' || ['some-outstanding','none-agreed','unknown'].includes(arrangements)) assert.ok(score >= 3);
    if (intentions === 'some-leaving' && replacement === 'difficult') assert.ok(score >= 4);
    if (intentions === 'all-leaving') assert.ok(score >= (replacement === 'easy' ? 3 : 4));
    if (arrangements === 'all-agreed') {
      const without = assessRisk({...responses,[ids[5]]:'some-outstanding'});
      assert.ok(score <= without);
    }
  }
  visit(0,{});
  assert.equal(checked,18000);
});
test('risk recomputes after remediation and matches the exported score', () => {
  const {context, ids, assessRisk, getReport} = setup();
  context.answers = Object.fromEntries(ids.map((id,i) => [id,['yes','difficult','all-leaving','no','yes','none-agreed'][i]]));
  assert.equal(context.riskScore(),5);
  context.exportReport();
  assert.match(getReport(), /Risk score: 5\/5 — Very high risk/);
  context.answers[ids[5]] = 'all-agreed';
  assert.equal(context.riskScore(),4);
  context.answers = {[ids[0]]:'no'};
  assert.equal(context.riskScore(),1);
  context.current = () => ({id:'other'});
  assert.equal(context.riskScore(),4);
});

test('unknown dependence starts at low risk while later concerns retain their floors', () => {
  const {ids, assessRisk} = setup();
  const answers = {[ids[0]]:'unknown'};
  assert.equal(assessRisk(answers),2);
  answers[ids[1]] = 'unknown';
  assert.equal(assessRisk(answers),3);
  assert.equal(assessRisk(Object.fromEntries(ids.map((id,i) => [id,['unknown','easy','all-staying','yes','no','not-needed'][i]]))),2);
});

test('action triggers respect perspective, facts and the agreed protections', () => {
  const {ids, chooseActions} = setup();
  const response = values => Object.fromEntries(ids.map((id,i) => [id,values[i]]));
  const serious = response(['yes','difficult','all-leaving','no','yes','none-agreed']);
  const priorities = side => new Map(chooseActions(serious,side).map(action => [action.id,action.priority]));
  assert.equal(priorities('Buyer').get('ER03'),'Required');
  assert.equal(priorities('Seller').get('ER03'),'Consider');
  assert.equal(priorities('Seller').get('ER06'),'Required');
  assert.equal(priorities('Balanced').get('ER01'),'Required');
  assert.equal(priorities('Buyer').has('ER11'),false);
  assert.equal(priorities('Buyer').has('ER08'),false);
  assert.equal(priorities('Buyer').has('ER10'),false);
  assert.equal(priorities('Buyer').has('ER04'),false);
  const agreed = {...serious,[ids[5]]:'all-agreed'};
  const agreedIds = chooseActions(agreed,'Buyer').map(action => action.id);
  assert.ok(!agreedIds.includes('ER01') && !agreedIds.includes('ER03') && !agreedIds.includes('ER12'));
  assert.ok(chooseActions({...serious,'employee-tupe-applies':'yes'},'Balanced').every(action => action.id !== 'ER11'));
  assert.ok(chooseActions({...serious,'employee-tupe-applies':'yes','employee-tupe-outstanding':'yes'},'Balanced').some(action => action.id === 'ER11' && action.priority === 'Required'));
  const facts = {...serious,'employee-specific-exposure':'yes','employee-recovery-concern':'yes','employee-signing-gap':'yes','employee-seller-guarantee':'yes'};
  assert.ok(chooseActions(facts,'Seller').some(action => action.constituentIds.includes('ER09') && action.priority === 'Required'));
  assert.ok(chooseActions(facts,'Buyer').every(action => !action.constituentIds.includes('ER09')));
});

test('all answer combinations and perspectives stay within nine and preserve every triggered protection', () => {
  const {ids, fields, chooseActions, contextFields} = setup();
  const confirmed = Object.fromEntries(Object.keys(contextFields).map(id => [id,'yes']));
  let checked = 0;
  function verify(responses) {
    for (const facts of [{},confirmed]) for (const side of ['Buyer','Seller','Balanced']) {
      const combined = {...responses,...facts};
      const cards = chooseActions(combined,side);
      const original = chooseActions(combined,side,false);
      assert.ok(cards.length <= 9);
      assert.equal(new Set(cards.map(card => card.id)).size,cards.length);
      const covered = cards.flatMap(card => Array.from(card.constituentIds));
      assert.deepEqual([...covered].sort(),Array.from(original, action => action.id).sort());
      for (const action of original) {
        const card = cards.find(card => card.constituentIds.includes(action.id));
        const ranks = {Required:3,Recommended:2,Consider:1};
        assert.ok(ranks[card.priority] >= ranks[action.priority]);
      }
      if (responses[ids[0]] === 'no') assert.equal(cards.length,0);
      checked++;
    }
  }
  function visit(index,responses) {
    if (index === ids.length) {verify(responses); return;}
    const id = ids[index];
    for (const value of ['',...fields[id].options.map(pair => pair[0])]) visit(index+1,{...responses,[id]:value});
  }
  visit(0,{});
  assert.equal(checked,108000);
});

test('all additional-fact combinations preserve the cap and respect applicability gates', () => {
  const {ids,chooseActions,contextFields,normalize} = setup();
  const factIds = Object.keys(contextFields);
  for (let bits=0;bits<64;bits++) for (const side of ['Buyer','Seller','Balanced']) {
    const responses = Object.fromEntries(ids.map((id,i)=>[id,['yes','difficult','all-leaving','no','yes','none-agreed'][i]]));
    factIds.forEach((id,i)=>{responses[id] = bits & (1<<i) ? 'yes':'no';});
    const cards = chooseActions(responses,side);
    assert.ok(cards.length<=9);
    const covered = cards.flatMap(card=>Array.from(card.constituentIds));
    assert.equal(covered.includes('ER11'),responses['employee-tupe-applies']==='yes' && responses['employee-tupe-outstanding']==='yes');
    assert.equal(covered.includes('ER10'),responses['employee-specific-exposure']==='yes' && responses['employee-recovery-concern']==='yes');
    normalize(responses);
    if (responses['employee-specific-exposure'] !== 'yes') assert.equal(responses['employee-recovery-concern'],undefined);
    if (responses['employee-tupe-applies'] !== 'yes') assert.equal(responses['employee-tupe-outstanding'],undefined);
  }
});

test('registry icons, rendered actions and report priorities use the same canonical actions', () => {
  const {context,ids,chooseActions,card,getReport} = setup();
  const registry = context.window.DealLogicActionRegistry;
  const topic = registry.byTopic.get(employee.id);
  assert.equal(topic.actions.length,12);
  topic.actions.forEach(action=>assert.ok(Object.values(registry.coreActionIcons).includes(action.icon)));
  context.answers = Object.fromEntries(ids.map((id,i)=>[id,['yes','difficult','all-leaving','no','yes','none-agreed'][i]]));
  context.renderLogic(employee);
  context.exportReport();
  for (const action of chooseActions(context.answers,'Balanced')) {
    assert.ok(card.innerHTML.includes(`data-action-id="${action.id}"`));
    assert.ok(getReport().includes(`${action.priority}: ${action.title}`));
    assert.ok(getReport().includes(action.description));
  }
  assert.match(card.innerHTML,/data-logic-side-toggle/);
});

test('saving consolidated cards keeps component identities and preserves edited existing actions', async () => {
  const hubSource = await readFile(new URL('../dist/deal-hub.js', import.meta.url),'utf8');
  const commitSource = hubSource.slice(hubSource.indexOf('  function commitPicks()'),hubSource.indexOf('  const libraryPhase'));
  const original = {id:'saved',issueId:employee.id,stableActionId:'ER08',title:'User edited indemnity',instruction:'User edited terms'};
  const state = {actions:[original]};
  const {context:registryContext} = setup();
  const registry = registryContext.window.DealLogicActionRegistry;
  const components = ['ER08','ER10'].map(id=>({...registry.actionFor(employee.id,'','',id),priority:'Recommended'}));
  const picks = new Map([['merged',{issueId:employee.id,side:'Buyer',actionId:'ER08',title:'Combined',instruction:'Combined',priority:'Recommended',components}]]);
  const context = vm.createContext({
    picks,state, picking:true, window:registryContext.window, statuses:['To Review'],
    actionKey:(...values)=>values.join('|'), issueById:()=>({id:employee.id}),
    hasEquivalentAction:item=>state.actions.some(action=>action.stableActionId===item.actionId),
    uid:()=> 'new', libraryPhase:phase=>phase, phaseFor:()=> 'SPA Drafting',
    save(){},decorateRecommendations(){},renderHub(){},toast(){},
    CustomEvent:class {},document:{dispatchEvent(){}}
  });
  vm.runInContext(commitSource+'commitPicks();',context);
  assert.equal(state.actions.length,2);
  assert.equal(state.actions[0],original);
  assert.equal(state.actions[0].title,'User edited indemnity');
  assert.equal(state.actions[1].stableActionId,'ER10');
  assert.equal(picks.size,0);
});
