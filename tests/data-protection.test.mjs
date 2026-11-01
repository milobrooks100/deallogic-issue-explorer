import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const source = await readFile(new URL('../dist/data-protection.js', import.meta.url),'utf8');
const issues = JSON.parse(await readFile(new URL('../dist/issues.json', import.meta.url),'utf8'));
const issue = issues.find(i => i.category === 'data-protection');
function setup() {
  let report;
  const card={innerHTML:'',classList:{add(){}}};
  const context=vm.createContext({answers:{},current:()=>issue,riskScore:()=>4,renderPanel(){},renderLogic(){card.innerHTML='Other issue';},exportReport(){report='Other report';},areas:{'data-protection':'Data Protection'},document:{querySelector:s=>s==='#logic-card'?card:null,createElement:()=>({click(){}})},Blob:class{constructor(parts){report=parts.join('');}},URL:{createObjectURL:()=>'',revokeObjectURL(){}}});
  vm.runInContext(source.replace(/\}\)\(\);\s*$/,'globalThis.testApi = {ids,fields,valid,visibleIds,normalize,complete,labelFor,questionMarkup};})();'),context);
  return {...context.testApi,context,card,report:()=>report};
}
const full={'dp-issue':'yes','dp-type':'both','dp-ongoing':'no','dp-notifications':'all-made','dp-proceedings':['complaints','claims'],'dp-impact':'manageable','dp-remediation':'yes'};
test('untouched, absent and unknown routes stop correctly without inherited analysis',()=>{
 const {visibleIds,complete,normalize,context,card}=setup();
 assert.deepEqual(Array.from(visibleIds({})),['dp-issue']);assert.equal(complete({}),false);
 for(const answer of ['no','unknown']){const r={...full,'dp-issue':answer};normalize(r);assert.deepEqual(r,{'dp-issue':answer});assert.equal(complete(r),true);context.answers=r;context.renderLogic(issue);assert.match(card.innerHTML,/not yet configured/);}
 context.renderLogic({id:'other'});assert.equal(card.innerHTML,'Other issue');assert.equal(context.riskScore(),1);
});
test('notification follow-up appears only on the three applicable routes',()=>{
 const {visibleIds,complete,normalize}=setup();
 for(const kind of ['personal-data-breach','both','unknown']){const r={...full,'dp-type':kind};assert.ok(visibleIds(r).includes('dp-notifications'));delete r['dp-notifications'];assert.equal(complete(r),false);assert.equal(visibleIds(r).at(-1),'dp-notifications');}
 const r={...full,'dp-type':'compliance-gap'};normalize(r);assert.ok(!('dp-notifications' in r));assert.equal(complete(r),true);
});
test('progression and normalization exclude invalid, hidden and downstream answers',()=>{
 const {ids,visibleIds,normalize}=setup();
 const r={...full,'dp-ongoing':''};normalize(r);assert.deepEqual(Object.keys(r),['dp-issue','dp-type']);assert.deepEqual(Array.from(visibleIds(r)),Array.from(ids.slice(0,3)));
 const invalid={...full,'dp-type':'invalid'};normalize(invalid);assert.deepEqual(invalid,{'dp-issue':'yes'});
});
test('compatible multiple selections advance while exclusive/invalid combinations do not',()=>{
 const {valid,complete,normalize}=setup();
 for(const v of [['complaints','claims','regulatory-enquiries'],['none'],['unknown']]){assert.equal(valid('dp-proceedings',v),true);assert.equal(complete({...full,'dp-proceedings':v}),true);}
 for(const v of [[],['none','claims'],['unknown','complaints'],['claims','claims'],'claims']){assert.equal(valid('dp-proceedings',v),false);const r={...full,'dp-proceedings':v};normalize(r);assert.ok(!('dp-impact' in r));}
});
test('export matches visible current labels and excludes litigation/risk conclusions',()=>{
 const {context,report}=setup();context.answers={...full};context.exportReport();assert.match(report(),/Complaints, Claims/);assert.match(report(),/3b\./);assert.match(report(),/Risk assessment: not yet configured/);assert.doesNotMatch(report(),/Risk score:|Limitation periods|settlement/i);
 context.answers={...full,'dp-type':'compliance-gap'};context.exportReport();assert.doesNotMatch(report(),/3b\.|All made/);
 context.answers={...full,'dp-issue':'no'};context.exportReport();assert.doesNotMatch(report(),/Complaints, Claims|Manageable/);
 context.current=()=>({id:'other'});context.exportReport();assert.equal(report(),'Other report');
});
