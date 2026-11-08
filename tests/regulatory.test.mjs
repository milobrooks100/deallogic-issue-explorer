import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const source=await readFile(new URL('../dist/regulatory.js',import.meta.url),'utf8');
const registrySource=await readFile(new URL('../dist/action-registry.js',import.meta.url),'utf8');
const issue=JSON.parse(await readFile(new URL('../dist/issues.json',import.meta.url),'utf8')).find(i=>i.category==='regulatory');
function setup(){
  let report='';
  const card={innerHTML:'',classList:{add(){},remove(){}}};
  const context=vm.createContext({window:{},CustomEvent:class{},getTransactionSide:()=>"Balanced",answers:{},escapeLogicText:String,current:()=>issue,riskScore:()=>4,renderPanel(){},renderLogic(){card.innerHTML='delegated';},exportReport(){report='delegated';},riskNames:["No risk","Low risk","Medium risk","High risk","Very high risk"],areas:{regulatory:'Regulatory'},document:{dispatchEvent(){},querySelector:s=>s==='#logic-card'?card:null,createElement:()=>({click(){}})},Blob:class{constructor(parts){report=parts.join('');}},URL:{createObjectURL:()=>'',revokeObjectURL(){}}});
  vm.runInContext(registrySource,context);
  vm.runInContext(source.replace(/\}\)\(\);\s*$/,'globalThis.api={ids,fields,valid,visibleIds,normalize,complete,assessRisk,buildAnalysis,summaryCopy,implicationCopy,chooseActions,priorityRank,actionOrder};})();'),context);
  return {...context.api,context,card,report:()=>report};
}
test('operating-permission absence never skips transaction screening',()=>{
  const {ids,visibleIds,complete}=setup();
  assert.deepEqual(Array.from(visibleIds({})),[ids[0]]);
  assert.deepEqual(Array.from(visibleIds({[ids[0]]:'no'})),[ids[0],ids[2]]);
  const clean={[ids[0]]:'no',[ids[2]]:['none']};
  assert.ok(complete(clean));
  const regulated={[ids[0]]:'yes',[ids[1]]:'none',[ids[2]]:['none']};
  assert.ok(complete(regulated));assert.equal(visibleIds(regulated).length,3);
  const uncertain={...regulated,[ids[0]]:'unknown'};
  assert.equal(complete(uncertain),false);assert.equal(visibleIds(uncertain).at(-1),ids[4]);
});
test('compatible transaction steps and exclusive uncertainty preserve branch validity',()=>{
  const {ids,valid,visibleIds,complete}=setup();
  assert.ok(valid(ids[2],['approval','notification','voluntary']));
  for(const invalid of [[],['none','approval'],['unknown','notification'],['approval','approval'],'approval',['obsolete']]) assert.equal(valid(ids[2],invalid),false);
  const state=Object.fromEntries(ids.map(id=>[id,id===ids[2]?['unknown']:'unknown']));
  assert.ok(complete(state));assert.equal(visibleIds(state).length,6);
  state[ids[2]]=['none'];delete state[ids[3]];
  assert.ok(complete(state));assert.equal(visibleIds(state).length,5);
});
test('hidden and invalid responses are excluded from exports and saved context',()=>{
  const {ids,normalize,context,report}=setup();
  context.answers={[ids[0]]:'no',[ids[1]]:'both',[ids[2]]:['none'],[ids[3]]:'blocked',[ids[4]]:'fundamental',[ids[5]]:'no'};
  normalize(context.answers);assert.equal(Object.keys(context.answers).length,2);
  context.exportReport();assert.match(report(),/Response: No/);assert.doesNotMatch(report(),/Response: Both|Blocked|Fundamental/);
  assert.match(report(),/Risk score: 1\/5/);
  context.answers={[ids[0]]:'no',[ids[2]]:['approval','notification'],[ids[3]]:'progress',[ids[4]]:'significant',[ids[5]]:'yes'};
  context.exportReport();assert.match(report(),/Prior approval; Mandatory notification/);
  context.answers[ids[2]]=['unknown','approval'];normalize(context.answers);
  assert.deepEqual(Object.keys(context.answers),[ids[0]]);
});
test('Regulatory uses its own risk without borrowing litigation conclusions',()=>{
  const {ids,context,card}=setup();
  context.renderLogic(issue);assert.match(card.innerHTML,/Answer all relevant questions/);
  context.answers=Object.fromEntries(ids.map(id=>[id,id===ids[2]?['approval']:'unknown']));
  context.answers[ids[3]]='blocked';context.answers[ids[4]]='fundamental';
  context.renderLogic(issue);assert.match(card.innerHTML,/Key deal implications/);
  assert.match(card.innerHTML,/Recommended actions/);assert.doesNotMatch(card.innerHTML,/Limitation periods/);
  assert.equal(context.riskScore(),5);
  context.current=()=>({id:'other'});assert.equal(context.riskScore(),4);
  context.renderLogic({id:'other'});assert.equal(card.innerHTML,'delegated');
});

test('draft risk examples, floors and conditional reductions',()=>{
  const {ids,assessRisk}=setup();
  const risk=values=>assessRisk(Object.fromEntries(ids.map((id,i)=>[id,values[i]])));
  const cases=[
    [[],1], [['no',null,['none']],1],
    [['unknown','unknown',['unknown'],'unknown','unknown','unknown'],1],
    [['yes','gaps',['none'],null,'minimal','completed'],3],
    [['yes','compliance',['none'],null,'minimal','yes'],2],
    [['yes','both',['none'],null,'manageable','yes'],3],
    [['no',null,['approval'],'progress','manageable','yes'],2],
    [['no',null,['approval'],'not-started','minimal','yes'],3],
    [['no',null,['approval'],'blocked','minimal','completed'],4],
    [['no',null,['approval'],'progress','manageable','no'],4],
    [['no',null,['notification'],'progress','manageable','no'],3],
    [['no',null,['approval'],'completed','manageable','completed'],2],
    [['yes','compliance',['none'],null,'manageable','completed'],2],
    [['yes','compliance',['none'],null,'unknown','completed'],3],
    [['yes','compliance',['none'],null,'significant','completed'],4],
    [['yes','compliance',['none'],null,'fundamental','completed'],5],
  ];
  for(const [values,expected] of cases) assert.equal(risk(values),expected,JSON.stringify(values));
});
test('all answer combinations respect floors, hidden answers and UI/report parity',()=>{
  const {ids,fields,assessRisk,normalize,context,report}=setup();
  const stepChoices=[[],['none'],['unknown'],['approval'],['notification'],['voluntary'],['approval','notification'],['approval','voluntary'],['notification','voluntary'],['approval','notification','voluntary'],['unknown','approval']];
  let count=0;
  const visit=values=>{
    if(values.length<ids.length){
      const choices=values.length===2?stepChoices:['', 'invalid',...fields[ids[values.length]].options.map(([key])=>key)];
      for(const value of choices)visit([...values,value]);return;
    }
    const raw=Object.fromEntries(ids.map((id,i)=>[id,values[i]])), clean={...raw};normalize(clean);
    const result=assessRisk(raw);assert.equal(result,assessRisk(clean));
    assert.ok(Number.isInteger(result)&&result>=1&&result<=5);
    if(clean[ids[4]]==='fundamental')assert.equal(result,5);else assert.ok(result<=4);
    if(clean[ids[4]]==='significant'||clean[ids[3]]==='blocked')assert.ok(result>=4);
    if(['gaps','both'].includes(clean[ids[1]]))assert.ok(result>=3);
    count++;
  };visit([]);assert.ok(count>10000);
  context.answers=Object.fromEntries(ids.map((id,i)=>[id,['no',null,['approval'],'blocked','minimal','yes'][i]]));
  context.exportReport();assert.match(report(),/Risk score: 4\/5/);assert.equal(context.riskScore(),4);
});

test('summary prose retains uncertainty, multiple steps and contradictory completion',()=>{
  const {ids,buildAnalysis,implicationCopy}=setup();
  const state=Object.fromEntries(ids.map((id,i)=>[id,['yes','both',['approval','notification','voluntary'],'blocked','fundamental','completed'][i]]));
  const result=buildAnalysis(state);
  assert.match(result.summary,/Both permission gaps and compliance issues/);
  assert.match(result.summary,/prior regulatory approval, mandatory notification and voluntary clearance being pursued or considered/);
  assert.match(result.summary,/blocked/);assert.match(result.summary,/reconciled/);
  assert.deepEqual(Array.from(result.implications),[implicationCopy.fundamental,implicationCopy.blocked,implicationCopy.reconcile]);
  state[ids[2]]=['voluntary'];state[ids[3]]='progress';state[ids[4]]='manageable';state[ids[5]]='yes';
  const voluntary=buildAnalysis(state);assert.match(voluntary.summary,/expected/);
  assert.ok(voluntary.implications.includes(implicationCopy.voluntary));
  assert.ok(!voluntary.implications.includes(implicationCopy.approval));
  const unknown=buildAnalysis(Object.fromEntries(ids.map(id=>[id,id===ids[2]?['unknown']:'unknown'])));
  assert.match(unknown.summary,/unknown/);assert.equal(unknown.implications.length,3);
  assert.equal(buildAnalysis({}),null);
});
test('every permutation has gated, stable analysis with at most three unique implications',()=>{
  const {ids,fields,buildAnalysis,normalize,complete,implicationCopy,summaryCopy}=setup();
  const stepChoices=[[],['none'],['unknown'],['approval'],['notification'],['voluntary'],['approval','notification'],['approval','voluntary'],['notification','voluntary'],['approval','notification','voluntary'],['unknown','approval']];
  const canonical=new Set(Object.values(implicationCopy));let count=0;
  const visit=values=>{
    if(values.length<ids.length){
      const choices=values.length===2?stepChoices:['', 'invalid',...fields[ids[values.length]].options.map(([key])=>key)];
      for(const value of choices)visit([...values,value]);return;
    }
    const raw=Object.fromEntries(ids.map((id,i)=>[id,values[i]])), clean={...raw};normalize(clean);
    const result=buildAnalysis(raw);assert.equal(JSON.stringify(result),JSON.stringify(buildAnalysis(clean)));
    assert.equal(Boolean(result),complete(clean));if(!result)return;
    count++;assert.doesNotMatch(result.summary,/undefined|null|Unanswered/);
    assert.ok(result.implications.length>=1&&result.implications.length<=3);
    assert.equal(new Set(result.implications).size,result.implications.length);
    for(const text of result.implications)assert.ok(canonical.has(text));
    if(clean[ids[4]]==='fundamental')assert.equal(result.implications[0],implicationCopy.fundamental);
    if(clean[ids[4]]==='significant')assert.equal(result.implications[0],implicationCopy.significant);
    if(clean[ids[3]]==='blocked')assert.ok(result.implications.includes(implicationCopy.blocked));
    if(!clean[ids[4]])assert.deepEqual(Array.from(result.implications),[implicationCopy.clean]);
    assert.ok(result.summary.includes(summaryCopy.permissions[clean[ids[0]]]));
    for(const [index,theme] of [[1,'issues'],[3,'status'],[4,'impact'],[5,'deadlines']]) if(clean[ids[index]])assert.ok(result.summary.includes(summaryCopy[theme][clean[ids[index]]]));
  };visit([]);assert.ok(count>1000);
});
test('completed UI and reports share analysis, early exits exclude stale prose',()=>{
  const {ids,context,card,report,buildAnalysis}=setup();
  context.answers=Object.fromEntries(ids.map(id=>[id,id===ids[2]?['unknown']:'unknown']));
  const analysis=buildAnalysis(context.answers);context.renderLogic(issue);context.exportReport();
  assert.ok(card.innerHTML.includes(analysis.summary));assert.ok(report().includes(analysis.summary));
  for(const text of analysis.implications){assert.ok(card.innerHTML.includes(text));assert.ok(report().includes(text));}
  assert.equal((card.innerHTML.match(/<li>/g)||[]).length,3);
  context.answers={[ids[0]]:'no',[ids[2]]:['none'],[ids[3]]:'blocked',[ids[4]]:'fundamental'};
  context.renderLogic(issue);context.exportReport();
  assert.doesNotMatch(card.innerHTML,/blocked|fundamental/);assert.doesNotMatch(report(),/blocked|fundamental/);
  assert.equal((card.innerHTML.match(/<li>/g)||[]).length,1);
  context.answers={[ids[0]]:'unknown'};context.renderLogic(issue);context.exportReport();
  assert.match(card.innerHTML,/Answer all relevant questions/);assert.doesNotMatch(report(),/KEY DEAL IMPLICATIONS|\nSUMMARY\n/);
});
