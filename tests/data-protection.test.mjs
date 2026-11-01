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
test('untouched and confirmed absence stop correctly without inherited analysis',()=>{
 const {visibleIds,complete,normalize,context,card}=setup();
 assert.deepEqual(Array.from(visibleIds({})),['dp-issue']);assert.equal(complete({}),false);
 for(const answer of ['no']){const r={...full,'dp-issue':answer};normalize(r);assert.deepEqual(r,{'dp-issue':answer});assert.equal(complete(r),true);context.answers=r;context.renderLogic(issue);assert.match(card.innerHTML,/not yet configured/);}
 context.renderLogic({id:'other'});assert.equal(card.innerHTML,'Other issue');assert.equal(context.riskScore(),1);
});
test('notification follow-up appears only on the three applicable routes',()=>{
 const {visibleIds,complete,normalize}=setup();
 for(const kind of ['personal-data-breach','both','unknown']){const r={...full,'dp-type':kind};assert.ok(visibleIds(r).includes('dp-notifications'));delete r['dp-notifications'];assert.equal(complete(r),false);assert.equal(visibleIds(r).at(-1),'dp-notifications');}
 const r={...full,'dp-type':'compliance-gap'};normalize(r);assert.ok(!('dp-notifications' in r));assert.equal(complete(r),true);
});
test('ongoing or partly ongoing issues show notifications for every issue type',()=>{
 const {visibleIds,complete,normalize}=setup();
 for(const kind of ['compliance-gap','personal-data-breach','both','unknown']) for(const ongoing of ['yes','partly']) {
  const r={...full,'dp-type':kind,'dp-ongoing':ongoing};
  assert.ok(visibleIds(r).includes('dp-notifications'));
  delete r['dp-notifications']; assert.equal(complete(r),false);
 }
 const r={...full,'dp-type':'compliance-gap','dp-ongoing':'no'}; normalize(r);
 assert.ok(!('dp-notifications' in r)); assert.equal(complete(r),true);
});
test('multiple-choice question uses the shared label and tooltip row',()=>{
 const {questionMarkup}=setup();const q=issue.key_questions.find(q=>q.id==='dp-proceedings');
 const markup=questionMarkup(q);
 assert.match(markup,/regulatory enquiries\? \(select all that apply\)/);
 assert.match(markup,/<div class="question-top"><label id="dp-proceedings-label">/);
 assert.match(markup,/<\/label><button class="info"/);
 assert.doesNotMatch(markup,/fieldset|legend|field-hint|None and Unknown are exclusive/);
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
 const {context,report}=setup();context.answers={...full};context.exportReport();assert.match(report(),/Complaints, Claims/);assert.match(report(),/Have required breach notifications been made\?/);assert.match(report(),/Risk assessment: not yet configured/);assert.doesNotMatch(report(),/Risk score:|Limitation periods|settlement/i);
 context.answers={...full,'dp-type':'compliance-gap'};context.exportReport();assert.doesNotMatch(report(),/Have required breach notifications been made|All made/);
 context.answers={...full,'dp-issue':'no'};context.exportReport();assert.doesNotMatch(report(),/Complaints, Claims|Manageable/);
 context.current=()=>({id:'other'});context.exportReport();assert.equal(report(),'Other report');
});

test('Unknown advances every question and supports a complete uncertain assessment',()=>{
 const {ids,visibleIds,normalize,complete}=setup();
 const responses={};
 ids.forEach((id,index)=>{
  assert.equal(visibleIds(responses).at(-1),id);
  assert.equal(complete(responses),false);
  responses[id]=id==='dp-proceedings'?['unknown']:'unknown';
  normalize(responses);
  assert.ok(id in responses);
  if(index<ids.length-1) assert.equal(visibleIds(responses).at(-1),ids[index+1]);
 });
 assert.equal(complete(responses),true);
 assert.equal(visibleIds(responses).length,7);
});
