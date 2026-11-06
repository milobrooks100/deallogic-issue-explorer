import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const source=await readFile(new URL('../dist/regulatory.js',import.meta.url),'utf8');
const issue=JSON.parse(await readFile(new URL('../dist/issues.json',import.meta.url),'utf8')).find(i=>i.category==='regulatory');
function setup(){
  let report='';
  const card={innerHTML:'',classList:{add(){}}};
  const context=vm.createContext({answers:{},escapeLogicText:String,current:()=>issue,riskScore:()=>4,renderPanel(){},renderLogic(){card.innerHTML='delegated';},exportReport(){report='delegated';},riskNames:["No risk","Low risk","Medium risk","High risk","Very high risk"],areas:{regulatory:'Regulatory'},document:{querySelector:s=>s==='#logic-card'?card:null,createElement:()=>({click(){}})},Blob:class{constructor(parts){report=parts.join('');}},URL:{createObjectURL:()=>'',revokeObjectURL(){}}});
  vm.runInContext(source.replace(/\}\)\(\);\s*$/,'globalThis.api={ids,fields,valid,visibleIds,normalize,complete,assessRisk};})();'),context);
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
  context.renderLogic(issue);assert.match(card.innerHTML,/responses have been recorded/);
  assert.doesNotMatch(card.innerHTML,/Recommended actions|Limitation periods|Summary/);
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
