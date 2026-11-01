import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const source = await readFile(new URL('../dist/data-protection.js', import.meta.url),'utf8');
const issues = JSON.parse(await readFile(new URL('../dist/issues.json', import.meta.url),'utf8'));
const issue = issues.find(i => i.category === 'data-protection');
function setup() {
  let report;
  const card={innerHTML:'',classList:{add(){},toggle(){}}};
  const context=vm.createContext({riskNames:['No risk','Low risk','Medium risk','High risk','Very high risk'],answers:{},current:()=>issue,riskScore:()=>4,renderPanel(){},renderLogic(){card.innerHTML='Other issue';},exportReport(){report='Other report';},areas:{'data-protection':'Data Protection'},document:{querySelector:s=>s==='#logic-card'?card:null,createElement:()=>({click(){}})},Blob:class{constructor(parts){report=parts.join('');}},URL:{createObjectURL:()=>'',revokeObjectURL(){}}});
  vm.runInContext(source.replace(/\}\)\(\);\s*$/,'globalThis.testApi = {ids,fields,valid,visibleIds,normalize,complete,labelFor,questionMarkup,assessRisk,buildAnalysis,implicationCopy};})();'),context);
  return {...context.testApi,context,card,report:()=>report};
}
const full={'dp-issue':'yes','dp-type':'both','dp-ongoing':'no','dp-notifications':'all-made','dp-proceedings':['complaints','claims'],'dp-impact':'manageable','dp-remediation':'yes'};
test('untouched and confirmed absence stop correctly without inherited analysis',()=>{
 const {visibleIds,complete,normalize,context,card}=setup();
 assert.deepEqual(Array.from(visibleIds({})),['dp-issue']);assert.equal(complete({}),false);
 for(const answer of ['no']){const r={...full,'dp-issue':answer};normalize(r);assert.deepEqual(r,{'dp-issue':answer});assert.equal(complete(r),true);context.answers=r;context.renderLogic(issue);assert.match(card.innerHTML,/No data protection issue has been identified/);assert.match(card.innerHTML,/Key deal implications/);}
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
test('export matches visible current labels and includes current risk and excludes litigation conclusions',()=>{
 const {context,report}=setup();context.answers={...full};context.exportReport();assert.match(report(),/Complaints, Claims/);assert.match(report(),/Have required breach notifications been made\?/);assert.match(report(),/Risk score: 3\/5 — Medium risk/);assert.doesNotMatch(report(),/Risk assessment: not yet configured|Limitation periods|settlement/i);
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

const neutral = {'dp-issue':'unknown','dp-type':'unknown','dp-ongoing':'unknown','dp-notifications':'unknown','dp-proceedings':['unknown'],'dp-impact':'unknown','dp-remediation':'unknown'};
test('agreed starting scores and every Unknown remain neutral',()=>{
 const {assessRisk,ids}=setup();
 assert.equal(assessRisk({}),1);
 for(const [value,expected] of [['no',1],['unknown',1],['suspected',2],['yes',3]]) {
  assert.equal(assessRisk({'dp-issue':value}),expected);
  assert.equal(assessRisk({...neutral,'dp-issue':value}),expected);
 }
 for(let n=1;n<=ids.length;n++) assert.equal(assessRisk(Object.fromEntries(Array.from(ids).slice(0,n).map(id=>[id,neutral[id]]))),1);
});
test('one-point adjustments, protected floors and non-stacking external matters',()=>{
 const {assessRisk}=setup();
 for(const [field,value,expected] of [['dp-ongoing','yes',3],['dp-ongoing','partly',3],['dp-notifications','none-made',3],['dp-notifications','some-outstanding',3],['dp-impact','minimal',1],['dp-impact','significant',4],['dp-impact','fundamental',5],['dp-remediation','partly',3],['dp-remediation','no',3]]) assert.equal(assessRisk({...neutral,[field]:value}),expected,field+value);
 assert.equal(assessRisk({...neutral,'dp-issue':'yes','dp-ongoing':'yes'}),4);
 assert.equal(assessRisk({...neutral,'dp-issue':'yes','dp-notifications':'none-made'}),4);
 assert.equal(assessRisk({...neutral,'dp-proceedings':['complaints']}),3);
 assert.equal(assessRisk({...neutral,'dp-proceedings':['complaints','claims','regulatory-enquiries']}),3);
 assert.equal(assessRisk({...neutral,'dp-issue':'yes','dp-ongoing':'yes','dp-notifications':'none-made','dp-impact':'minimal'}),4);
});
test('remediation only reduces when all required confirmations are present',()=>{
 const {assessRisk}=setup();
 const cured={...neutral,'dp-issue':'yes','dp-ongoing':'no','dp-notifications':'all-made','dp-proceedings':['none'],'dp-impact':'manageable','dp-remediation':'completed'};
 assert.equal(assessRisk(cured),2);
 for(const [field,value] of [['dp-ongoing','unknown'],['dp-notifications','unknown'],['dp-proceedings',['unknown']],['dp-remediation','yes']]) assert.equal(assessRisk({...cured,[field]:value}),3);
 assert.equal(assessRisk({...cured,'dp-type':'compliance-gap','dp-notifications':'none-made'}),2);
 assert.equal(assessRisk({...cured,'dp-impact':'significant'}),4);
 assert.equal(assessRisk({...cured,'dp-impact':'fundamental'}),5);
 assert.equal(assessRisk({...cured,'dp-impact':'minimal'}),2);
});
test('hidden and unreachable answers cannot affect scoring; exports match live risk',()=>{
 const {assessRisk,context,report}=setup();
 assert.equal(assessRisk({...neutral,'dp-issue':'no','dp-impact':'fundamental'}),1);
 assert.equal(assessRisk({...neutral,'dp-type':'','dp-impact':'fundamental'}),1);
 assert.equal(assessRisk({...neutral,'dp-type':'compliance-gap','dp-ongoing':'no','dp-notifications':'none-made'}),1);
 for(const impact of ['minimal','manageable','significant','fundamental','unknown']) {
  context.answers={...neutral,'dp-impact':impact};context.exportReport();
  assert.ok(report().includes(`Risk score: ${context.riskScore()}/5`));
 }
});
test('all valid answer combinations stay bounded and only Fundamental yields five',()=>{
 const {fields,ids,assessRisk}=setup();
 const choices=Array.from(ids,id=>fields[id].multiple ? [['complaints'],['claims'],['regulatory-enquiries'],['complaints','claims','regulatory-enquiries'],['none'],['unknown']] : Array.from(fields[id].options,([value])=>value));
 const responses={};let count=0;
 const visit=index=>{if(index===ids.length){const score=assessRisk(responses);assert.ok(Number.isInteger(score)&&score>=1&&score<=5);if(score===5)assert.equal(responses['dp-impact'],'fundamental');count++;return;} for(const value of choices[index]){responses[ids[index]]=value;visit(index+1);}};
 visit(0);assert.ok(count>30000);
});


test('analysis waits for all reachable answers and ignores stale hidden facts',()=>{
 const {buildAnalysis}=setup();
 assert.equal(buildAnalysis({}),null);
 assert.equal(buildAnalysis({...full,'dp-remediation':''}),null);
 const absent=buildAnalysis({...full,'dp-issue':'no','dp-impact':'fundamental'});
 assert.equal(absent.implications.length,1);assert.doesNotMatch(absent.summary,/fundamental|complaints have/i);
 const gap=buildAnalysis({...full,'dp-type':'compliance-gap','dp-notifications':'none-made'});
 assert.doesNotMatch(gap.summary,/notifications/);
 assert.doesNotMatch(gap.implications.join(' '),/notification/);
});
test('summary preserves suspected and unknown positions and every external matter in canonical order',()=>{
 const {buildAnalysis}=setup();
 const suspected=buildAnalysis({...full,'dp-issue':'suspected','dp-proceedings':['regulatory-enquiries','claims','complaints']});
 assert.match(suspected.summary,/suspects both a compliance gap and a personal data breach, but this has not been confirmed/);
 assert.match(suspected.summary,/complaints, claims and regulatory enquiries/);
 const unknown=buildAnalysis(neutral);
 assert.match(unknown.summary,/unclear whether a data protection issue exists/);
 assert.match(unknown.summary,/unclear whether the issue is still ongoing/);
 assert.match(unknown.summary,/unclear whether required breach notifications/);
 assert.match(unknown.summary,/unclear whether there are related complaints/);
 assert.match(unknown.summary,/impact on the target or deal is unknown/);
 assert.match(unknown.summary,/unclear whether all necessary remedial steps/);
 assert.equal(unknown.implications.length,3);
});
test('stable implications prioritise within three themes without hiding serious conditions',()=>{
 const {buildAnalysis,implicationCopy:c}=setup();
 const severe={...full,'dp-ongoing':'yes','dp-notifications':'none-made','dp-impact':'fundamental','dp-remediation':'no'};
 assert.deepEqual(Array.from(buildAnalysis(severe).implications),[c.fundamental,c.readiness,c.external]);
 assert.deepEqual(Array.from(buildAnalysis({...severe,'dp-impact':'significant'}).implications),[c.significant,c.readiness,c.external]);
 assert.ok(buildAnalysis({...severe,'dp-remediation':'completed'}).implications.includes(c.inconsistent));
 const planned={...full,'dp-proceedings':['none']};
 assert.deepEqual(Array.from(buildAnalysis(planned).implications),[c.planned]);
 assert.deepEqual(Array.from(buildAnalysis({...planned,'dp-remediation':'completed'}).implications),[c.clear]);
 assert.deepEqual(Array.from(buildAnalysis({...severe,'dp-notifications':'some-outstanding'}).implications),Array.from(buildAnalysis(severe).implications));
});
test('render and export use the same prose and implication statements',()=>{
 const {context,card,report,buildAnalysis}=setup();context.answers={...full};
 const expected=buildAnalysis(full);context.renderLogic(issue);context.exportReport();
 assert.ok(card.innerHTML.includes(expected.summary));assert.ok(report().includes(expected.summary));
 for(const text of expected.implications){assert.ok(card.innerHTML.includes(text));assert.ok(report().includes(`- ${text}`));}
 context.answers={};context.renderLogic(issue);context.exportReport();
 assert.match(card.innerHTML,/Answer all relevant questions/);assert.doesNotMatch(card.innerHTML,/Key deal implications/);
 assert.doesNotMatch(report(),/KEY DEAL IMPLICATIONS|SUMMARY/);
});
test('every complete branch produces factual prose and one to three implications',()=>{
 const {fields,ids,buildAnalysis,normalize}=setup();
 const choices=Array.from(ids,id=>fields[id].multiple ? [['none'],['unknown'],['complaints'],['claims'],['regulatory-enquiries'],['complaints','claims'],['complaints','regulatory-enquiries'],['claims','regulatory-enquiries'],['complaints','claims','regulatory-enquiries']] : Array.from(fields[id].options,([value])=>value));
 const responses={};let count=0;
 const visit=index=>{if(index===ids.length){const active={...responses};normalize(active);const analysis=buildAnalysis(active);assert.ok(analysis);assert.ok(analysis.summary.endsWith('.'));assert.doesNotMatch(analysis.summary,/undefined|Unanswered/);assert.ok(analysis.implications.length>=1&&analysis.implications.length<=3);assert.equal(new Set(analysis.implications).size,analysis.implications.length);count++;return;}for(const value of choices[index]){responses[ids[index]]=value;visit(index+1);}};
 visit(0);assert.equal(count,72000);
});
