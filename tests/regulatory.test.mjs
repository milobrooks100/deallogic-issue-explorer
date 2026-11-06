import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const source=await readFile(new URL('../dist/regulatory.js',import.meta.url),'utf8');
const issue=JSON.parse(await readFile(new URL('../dist/issues.json',import.meta.url),'utf8')).find(i=>i.category==='regulatory');
function setup(){
  let report='';
  const card={innerHTML:'',classList:{add(){}}};
  const context=vm.createContext({answers:{},escapeLogicText:String,current:()=>issue,riskScore:()=>4,renderPanel(){},renderLogic(){card.innerHTML='delegated';},exportReport(){report='delegated';},areas:{regulatory:'Regulatory'},document:{querySelector:s=>s==='#logic-card'?card:null,createElement:()=>({click(){}})},Blob:class{constructor(parts){report=parts.join('');}},URL:{createObjectURL:()=>'',revokeObjectURL(){}}});
  vm.runInContext(source.replace(/\}\)\(\);\s*$/,'globalThis.api={ids,fields,valid,visibleIds,normalize,complete};})();'),context);
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
  context.exportReport();assert.match(report(),/Response: No/);assert.doesNotMatch(report(),/Response: Both|Blocked|Fundamental|Risk score/);
  assert.match(report(),/Risk assessment: not yet configured/);
  context.answers={[ids[0]]:'no',[ids[2]]:['approval','notification'],[ids[3]]:'progress',[ids[4]]:'significant',[ids[5]]:'yes'};
  context.exportReport();assert.match(report(),/Prior approval; Mandatory notification/);
  context.answers[ids[2]]=['unknown','approval'];normalize(context.answers);
  assert.deepEqual(Object.keys(context.answers),[ids[0]]);
});
test('questionnaire stage never borrows risk, actions or litigation conclusions',()=>{
  const {ids,context,card}=setup();
  context.renderLogic(issue);assert.match(card.innerHTML,/Answer all relevant questions/);
  context.answers=Object.fromEntries(ids.map(id=>[id,id===ids[2]?['approval']:'unknown']));
  context.answers[ids[3]]='blocked';context.answers[ids[4]]='fundamental';
  context.renderLogic(issue);assert.match(card.innerHTML,/responses have been recorded/);
  assert.doesNotMatch(card.innerHTML,/Recommended actions|Limitation periods|Summary/);
  assert.equal(context.riskScore(),1);
  context.current=()=>({id:'other'});assert.equal(context.riskScore(),4);
  context.renderLogic({id:'other'});assert.equal(card.innerHTML,'delegated');
});
