import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const source = await readFile(new URL('../dist/termination-rights.js', import.meta.url), 'utf8');
const issues = JSON.parse(await readFile(new URL('../dist/issues.json', import.meta.url), 'utf8'));
const issue = issues.find(i => i.id === 'termination-rights-and-material-breaches');
const registry = await readFile(new URL("../dist/action-registry.js",import.meta.url),"utf8");
function setup() {
  let report;
  const card = {innerHTML:'', classList:{add(){},remove(){}}};
  const context = vm.createContext({window:{},getTransactionSide:()=>"Balanced",CustomEvent:class{},answers:{}, escapeLogicText: value => String(value), current:()=>issue, riskScore:()=>4, renderPanel(){}, renderLogic(){card.innerHTML='Other issue';}, exportReport(){report='Other export';}, riskNames:["No risk","Low risk","Medium risk","High risk","Very high risk"], areas:{'commercial-contracts':'Material Contracts'}, Blob:class {constructor(parts){report=parts.join('');}}, URL:{createObjectURL:()=> 'blob:test', revokeObjectURL(){}}, document:{dispatchEvent(){},querySelector: selector => selector === '#logic-card' ? card : null, createElement:()=>({click(){}})}});
  vm.runInContext(registry,context);
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'globalThis.testApi = {fields, ids, visibleIds, normalize, chooseActions, assessRisk, buildAnalysis, summaryCopy, implicationCopy}; })();'),context);
  return {...context.testApi,context,card,report:()=>report};
}
test('progressive reveal, early exit and invalid saved data',()=>{
  const {ids,visibleIds,normalize,fields}=setup();
  assert.equal(visibleIds({}).length,1);
  for(const [value] of fields[ids[0]].options) assert.equal(visibleIds({[ids[0]]:value}).length,value==='no'?1:2);
  const state=Object.fromEntries(ids.map(id=>[id,'unknown']));
  assert.equal(visibleIds(state).length,5);
  state[ids[1]]='obsolete'; normalize(state);
  assert.deepEqual(Object.keys(state),[ids[0]]);
  state[ids[0]]='no';state[ids[4]]='addressed';normalize(state);
  assert.deepEqual(Object.keys(state),[ids[0]]);
});
test('questionnaire exports exclude hidden answers and borrowed advice',()=>{
  const {ids,context,report,card}=setup();
  context.answers={[ids[0]]:'no',[ids[3]]:'fundamental'};
  context.exportReport();
  assert.match(report(),/Response: No/);
  assert.doesNotMatch(report(),/Response: Fundamental|Reasonableness/);
  context.renderLogic(issue);
  assert.match(card.innerHTML,/Key deal implications/);
  assert.equal(context.riskScore(),1);
  context.renderLogic({id:'other'});assert.equal(card.innerHTML,'Other issue');
});
function responses(ids, values) { return Object.fromEntries(ids.map((id,index)=>[id,values[index]])); }
test('agreed scoring examples, starts, adjustments and resolution conditions',()=>{
  const {ids,assessRisk}=setup();
  const cases=[
    [[],1], [['no','both','ended','fundamental','no'],1],
    [['unknown','unknown','unknown','unknown','unknown'],1],
    [['yes'],3], [['suspected'],2], [['unknown'],1],
    [['suspected','breach','no-notice','minimal','yes'],2],
    [['yes','breach','breach-notice','manageable','yes'],4],
    [['yes','breach','no-notice','manageable','addressed'],2],
    [['yes','both','termination-notice','minimal','addressed'],4],
    [['yes','both','ended','minimal','addressed'],4],
    [['yes','breach','no-notice','fundamental','addressed'],5],
    [['yes','breach','no-notice','significant','addressed'],4],
    [['yes','unknown','no-notice','manageable','addressed'],3],
    [['yes','breach','unknown','manageable','addressed'],3],
    [['yes','breach','no-notice','unknown','addressed'],3],
    [['yes','breach','no-notice','manageable','yes'],3],
    [['yes','breach','no-notice','minimal','partly'],3],
    [['yes','breach','no-notice','manageable','no'],4],
    [['yes','breach','breach-notice','minimal','yes'],3],
    [['unknown','unknown','unknown','minimal','unknown'],1]
  ];
  for(const [values,expected] of cases) assert.equal(assessRisk(responses(ids,values)),expected,JSON.stringify(values));
});
test('all answer combinations preserve floors, cap and hidden-answer exclusion',()=>{
  const {ids,fields,assessRisk,normalize}=setup();
  let count=0;
  function visit(values) {
    if(values.length<ids.length) {
      for(const value of ['', 'invalid', ...fields[ids[values.length]].options.map(([key])=>key)]) visit([...values,value]);
      return;
    }
    const state=responses(ids,values), normalized={...state};normalize(normalized);
    const score=assessRisk(state);
    assert.equal(score,assessRisk(normalized));
    assert.ok(Number.isInteger(score)&&score>=1&&score<=5);
    if(!normalized[ids[0]]||normalized[ids[0]]==='no') assert.equal(score,1);
    else {
      if(normalized[ids[3]]==='fundamental') assert.equal(score,5);
      else assert.ok(score<=4);
      if(['termination-notice','ended'].includes(normalized[ids[2]])||normalized[ids[3]]==='significant') assert.ok(score>=4);
      if(normalized[ids[2]]==='breach-notice'||['partly','no'].includes(normalized[ids[4]])) assert.ok(score>=3);
      if(['yes','suspected'].includes(normalized[ids[0]])) assert.ok(score>=2);
    }
    count++;
  }
  visit([]); assert.equal(count,12348);
});
test('live scoring and export agree and other issues retain their own score',()=>{
  const {ids,context,assessRisk,report}=setup();
  context.answers=responses(ids,['yes','breach','ended','fundamental','addressed']);
  assert.equal(context.riskScore(),5);
  context.exportReport();assert.match(report(),/Risk score: 5\/5 — Very high risk/);
  assert.equal(context.riskScore(),assessRisk(context.answers));
  context.current=()=>({id:'other'});assert.equal(context.riskScore(),4);
});
test('analysis handles uncertainty, completion gating and conflicting resolution reports',()=>{
  const {ids,buildAnalysis,implicationCopy,context,card,report}=setup();
  assert.equal(buildAnalysis({}),null);
  context.renderLogic(issue);assert.match(card.innerHTML,/Answer all relevant questions/);
  const uncertain=buildAnalysis(responses(ids,['suspected','unknown','unknown','unknown','unknown']));
  assert.match(uncertain.summary,/suspected.*not been confirmed/);
  assert.match(uncertain.summary,/nature of the concern is unknown/);
  assert.deepEqual(Array.from(uncertain.implications),[implicationCopy.uncertain,implicationCopy.stageUnknown,implicationCopy.readinessUnknown]);
  context.answers=responses(ids,['yes','both','ended','fundamental','addressed']);
  const severe=buildAnalysis(context.answers);
  assert.match(severe.summary,/both a breach and a counterparty termination right/);
  assert.deepEqual(Array.from(severe.implications),[implicationCopy.fundamental,implicationCopy.ended,implicationCopy.residualImpact]);
  context.renderLogic(issue);
  assert.match(card.innerHTML,/Summary/);assert.equal((card.innerHTML.match(/<li>/g)||[]).length,3);
  context.exportReport();assert.ok(report().includes(severe.summary));
  for(const text of severe.implications) assert.ok(report().includes(text));
  context.answers={[ids[0]]:'yes'};context.exportReport();assert.doesNotMatch(report(),/KEY DEAL IMPLICATIONS|\nSUMMARY\n/);
});
test('all answer combinations produce reachable factual prose and at most three canonical implications',()=>{
  const {ids,fields,buildAnalysis,summaryCopy,implicationCopy,normalize}=setup();
  const canonical=new Set(Object.values(implicationCopy));
  const covered=Object.fromEntries(Object.keys(summaryCopy).map(key=>[key,new Set()]));
  const themes=['existence','type','stage','impact','resolution'];
  let completeCount=0;
  function visit(values) {
    if(values.length<ids.length) {
      for(const value of ['', 'invalid', ...fields[ids[values.length]].options.map(([key])=>key)]) visit([...values,value]);
      return;
    }
    const state=responses(ids,values), clean={...state};normalize(clean);
    const analysis=buildAnalysis(state);
    assert.equal(JSON.stringify(analysis),JSON.stringify(buildAnalysis(clean)));
    const expectedComplete=values[0]==='no'||ids.every((id,index)=>fields[id].options.some(([key])=>key===values[index]));
    assert.equal(Boolean(analysis),expectedComplete);
    if(!analysis)return;
    completeCount++;
    assert.ok(!/undefined|null|Unanswered/.test(analysis.summary));
    assert.ok(analysis.implications.length>=1&&analysis.implications.length<=3);
    assert.equal(new Set(analysis.implications).size,analysis.implications.length);
    for(const text of analysis.implications)assert.ok(canonical.has(text));
    if(values[0]==='no') {
      assert.equal(analysis.implications.length,1);
      assert.equal(analysis.implications[0],implicationCopy.absent);
    } else {
      themes.forEach((theme,index)=>{
        assert.ok(analysis.summary.includes(summaryCopy[theme][values[index]]));
        covered[theme].add(values[index]);
      });
      if(values[3]==='fundamental')assert.equal(analysis.implications[0],implicationCopy.fundamental);
      if(values[3]==='significant')assert.equal(analysis.implications[0],implicationCopy.significant);
      if(values[2]==='ended')assert.ok(analysis.implications.includes(implicationCopy.ended));
      if(['partly','no'].includes(values[4]))assert.ok(analysis.implications.includes(implicationCopy.outstanding));
    }
  }
  visit([]);
  assert.equal(completeCount,3558);
  for(const theme of themes)assert.equal(covered[theme].size,Object.keys(summaryCopy[theme]).length);
});

test('all completed routes and sides keep required actions and respect the seven-card limit',()=>{
  const {chooseActions,ids,fields}=setup();
  const sides=['Buyer','Seller','Balanced'], rank=['Required','Recommended','Consider'];
  const catalogue=new Set();
  function visit(values) {
    if(values.length<5) {
      for(const [v] of fields[ids[values.length]].options) visit([...values,v]);
      return;
    }
    const [exist,type,stage,impact,res]=values;
    const state=responses(ids,values);
    for(const side of sides) {
      const list=Array.from(chooseActions(state,side)), titles=list.map(x=>x.id);
      assert.ok(list.length<=7); assert.equal(new Set(titles).size,list.length);
      if(exist==='no'){assert.equal(list.length,0);continue;}
      const serious=['significant','fundamental'].includes(impact), notice=['breach-notice','termination-notice','ended'].includes(stage);
      const identified=exist==='yes'||notice;
      const required=new Set();
      if(exist!=='yes'||[type,stage,impact].includes('unknown'))required.add('TR01');
      if(notice && res!=='addressed')required.add('TR02');
      if(identified && res!=='addressed' && (serious||['termination-notice','ended'].includes(stage)))required.add('TR03');
      if(res==='addressed' && (side==='Buyer'||serious||[type,stage,impact].includes('unknown')))required.add('TR04');
      if(identified && side!=='Buyer')required.add('TR06');
      if(serious && res!=='addressed' && side==='Buyer')required.add('TR08');
      if(impact==='fundamental')required.add('TR11');
      assert.deepEqual(new Set(list.filter(a=>a.priority==='Required').map(a=>a.id)),required);
      let prev=-1;
      for(const a of list){catalogue.add(a.id);const r=rank.indexOf(a.priority);assert.ok(r>=prev&&r>=0);prev=r;}
    }
  }
  visit([]);assert.equal(catalogue.size,11);
  assert.equal(chooseActions(responses(ids,['yes','both']),'Buyer').length,0);
});
test('continuity variants keep stable action identity and appear in the report',()=>{
  const {chooseActions,ids,context,card,report}=setup();
  const live=responses(ids,['yes','both','termination-notice','significant','partly']);
  const get=(state,side,id)=>chooseActions(state,side).find(a=>a.id===id);
  assert.match(get(live,'Seller','TR03').title,/pause/);
  assert.doesNotMatch(get(live,'Buyer','TR03').title,/pause/);
  const lost=responses(ids,['yes','breach','ended','unknown','unknown']);
  assert.match(get(lost,'Buyer','TR01').description,/actually stopped/);
  assert.doesNotMatch(get(lost,'Seller','TR01').description,/actually stopped/);
  assert.match(get(lost,'Balanced','TR03').title,/reinstatement/);
  assert.deepEqual(Array.from(chooseActions(live,'Balanced'),a=>a.id),['TR02','TR03','TR06','TR01','TR08','TR07','TR05']);
  context.answers=live;context.renderLogic(issue);context.exportReport();
  for(const a of chooseActions(live,'Balanced')){
    assert.ok(card.innerHTML.includes('data-action-id="'+a.id+'"'));
    assert.ok(card.innerHTML.includes(a.description));assert.ok(report().includes(a.description));
  }
});
