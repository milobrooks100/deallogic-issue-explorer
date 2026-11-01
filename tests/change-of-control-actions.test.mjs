import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),registry=await readFile(new URL('../dist/action-registry.js',import.meta.url),'utf8');
const issue=JSON.parse(await readFile(new URL('../dist/issues.json',import.meta.url),'utf8')).find(i=>i.id==='customer-change-of-control');
const between=(a,b)=>index.slice(index.indexOf(a),index.indexOf(b,index.indexOf(a)));
const source=between('      const consentOutlookSentence =','      const getTransactionSide =')+between('      const cocAction =','    </script>');
const adverse={'contract-provision-exists':'Yes','transaction-triggers-provision':'Yes','triggered-provision-consequences':'Third party must provide consent','contract-importance':'3','consent-prospects':['Unlikely','Expensive']};
function harness(){let report='',side='Balanced';const card={innerHTML:'',classList:{add(){},remove(){}}},events=[];
 const state=vm.createContext({window:{},answers:{},current:()=>issue,renderLogic(){},standardDealLogic(){},baseExportReport(){},getTransactionSide:()=>side,escapeLogicText:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),riskScore:()=>4,areas:{material_contracts:'Material Contracts'},riskNames:['No risk','Low risk','Medium risk','High risk','Very high risk'],CustomEvent:class{constructor(type){this.type=type}},Blob:class{constructor(parts){report=parts.join('')}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},document:{querySelector:s=>s==='#logic-card'?card:null,createElement:()=>({click(){}}),dispatchEvent:e=>events.push(e.type)}});
 vm.runInContext(registry,state);vm.runInContext(source+'\nglobalThis.api={buildCocAnalysis,cocActionMatrix};',state);
 vm.runInContext(between('      exportReport = function () {\n        const issue = current();\n        if (issue.id !== "customer-change-of-control")','    </script>'),state);
 return{state,api:state.api,card,events,report:()=>report,side:v=>{side=v}};
}
test('Change of Control catalogue supplies seven concise perspective variants and two neutral checks',()=>{
 const {state}=harness(),r=state.window.DealLogicActionRegistry;assert.equal(r.byTopic.get(issue.id).actions.length,9);
 for(const action of r.byTopic.get(issue.id).actions){const copy=['Buyer','Seller','Balanced'].map(side=>r.forSide(action,side).description);assert.equal(new Set(copy).size,['coc-trigger-review','coc-serve-notice'].includes(action.id)?1:3,action.id);for(const text of copy){assert.equal((text.match(/[.!?]/g)||[]).length,1);assert.ok(text.split(/\s+/).length<=32,text);}}
});
test('all 18 importance/requirement/side matrix entries retain their approved identities, order and priorities',()=>{
 const {state,api}=harness();const expected={
 Low:{notification:{Buyer:[['Recommended','coc-warranty-disclosure'],['Consider','coc-agree-communication']],Seller:[['Required','coc-serve-notice'],['Recommended','coc-warranty-disclosure']]},consent:{Buyer:[['Recommended','coc-warranty-disclosure'],['Recommended','coc-seek-consent-covenant']],Seller:[['Recommended','coc-warranty-disclosure'],['Recommended','coc-seek-consent-covenant'],['Consider','coc-consent-cp']]}},
 Moderate:{notification:{Buyer:[['Recommended','coc-agree-communication'],['Recommended','coc-warranty-disclosure']],Seller:[['Required','coc-serve-notice'],['Recommended','coc-agree-communication'],['Recommended','coc-warranty-disclosure']]},consent:{Buyer:[['Recommended','coc-seek-consent-covenant'],['Recommended','coc-specific-indemnity'],['Consider','coc-consent-cp']],Seller:[['Recommended','coc-seek-consent-covenant'],['Recommended','coc-warranty-disclosure'],['Consider','coc-consent-cp']]}},
 High:{notification:{Buyer:[['Recommended','coc-agree-communication'],['Recommended','coc-warranty-disclosure'],['Consider','coc-longstop-rights']],Seller:[['Required','coc-serve-notice'],['Recommended','coc-agree-communication'],['Recommended','coc-warranty-disclosure']]},consent:{Buyer:[['Required','coc-consent-cp'],['Recommended','coc-specific-indemnity'],['Consider','coc-longstop-rights']],Seller:[['Recommended','coc-seek-consent-covenant'],['Consider','coc-longstop-rights'],['Consider','coc-agree-communication']]}}
 };
 for(const [i,importance] of ['Low','Moderate','High'].entries())for(const [requirement,consequence] of [['notification','Third party must be notified'],['consent','Third party must provide consent']])for(const side of ['Buyer','Seller','Balanced']){
  state.answers={...adverse,'contract-importance':String(i+1),'triggered-provision-consequences':consequence};const actual=api.buildCocAnalysis(side).actions.map(a=>[a.priority,a.id]);
  const balanced=requirement==='notification'?expected[importance][requirement].Seller:importance==='Low'?expected.Low.consent.Buyer:importance==='Moderate'?[['Recommended','coc-seek-consent-covenant'],['Recommended','coc-specific-indemnity'],['Recommended','coc-warranty-disclosure']]:[['Required','coc-consent-cp'],['Recommended','coc-seek-consent-covenant'],['Consider','coc-longstop-rights']];
  assert.deepEqual(Array.from(actual,p=>Array.from(p)),side==='Balanced'?balanced:expected[importance][requirement][side]);
 }
});
test('all 1728 clause, trigger, consequence, importance, outlook and perspective combinations use canonical copy within nine cards',()=>{
 const {state,api}=harness();let count=0,max=0;const outlooks=[[],['Likely','Inexpensive'],['Unlikely','Expensive'],['Other']];
 for(const clause of ['Unanswered','Yes','No','Partly / unclear'])for(const trigger of ['Unanswered','Yes','No','Partly / unclear'])for(const consequence of ['Third party must be notified','Third party must provide consent','Other'])for(const importance of [1,2,3])for(const outlook of outlooks)for(const side of ['Buyer','Seller','Balanced']){
  count++;state.answers={'contract-provision-exists':clause,'transaction-triggers-provision':trigger,'triggered-provision-consequences':consequence,'contract-importance':importance,'consent-prospects':outlook,'other-consequence':'Price changes','other-consent-prospects':'a lengthy process'};
  const analysis=api.buildCocAnalysis(side);max=Math.max(max,analysis.actions.length);assert.ok(analysis.actions.length<=9);assert.equal(new Set(analysis.actions.map(a=>a.id)).size,analysis.actions.length);
  if(clause==='Unanswered'||(clause!=='No'&&trigger==='Unanswered'))assert.equal(analysis.ready,false);
  if(clause==='No'||(clause!=='Unanswered'&&trigger==='No'))assert.equal(analysis.actions.length,0);
  if(analysis.ready&&clause!=='No'&&trigger!=='No'&&consequence==='Other')assert.equal(analysis.actions[0].id,'coc-tailored-response');
  const r=state.window.DealLogicActionRegistry;for(const a of analysis.actions)assert.equal(a.description,r.forSide(r.actionFor(issue.id,'','',a.id),side).description);
 }assert.equal(count,1728);assert.equal(max,3);
});
test('reports and live analysis agree for every matrix row and use active answers rather than retired storage',()=>{
 const app=harness();for(const importance of [1,2,3])for(const consequence of ['Third party must be notified','Third party must provide consent','Other'])for(const side of ['Buyer','Seller','Balanced']){
  app.state.answers={...adverse,'contract-importance':importance,'triggered-provision-consequences':consequence,'other-consequence':'Price changes'};app.side(side);app.state.renderLogic(issue);app.state.exportReport();assert.ok(app.report().includes(`RECOMMENDED ACTIONS (${side})`));
  for(const a of app.api.buildCocAnalysis(side).actions){assert.ok(app.card.innerHTML.includes(a.description));assert.ok(app.card.innerHTML.includes(`data-action-id="${a.id}"`));assert.ok(app.report().includes(`${a.title} (${a.priority})`));assert.ok(app.report().includes(a.description));}
 }
 app.state.answers={...adverse,'contract-provision-exists':'No'};app.state.exportReport();assert.doesNotMatch(app.report(),/Response: Third party|High importance/);
 app.state.answers={...adverse,'transaction-triggers-provision':'No'};app.state.exportReport();assert.doesNotMatch(app.report(),/Response: Third party|High importance/);
 app.state.answers={};app.state.renderLogic(issue);app.state.exportReport();assert.doesNotMatch(app.report(),/RECOMMENDED ACTIONS|SUMMARY/);assert.equal(app.events.at(-1),'change-of-control-logic-rendered');
 app.state.answers={...adverse,'triggered-provision-consequences':'Other','other-consequence':' '};assert.equal(app.api.buildCocAnalysis().ready,false);
 app.state.answers={...adverse,'triggered-provision-consequences':'Third party must be notified','consent-prospects':['Other'],'other-consent-prospects':'Hidden stale prospect'};assert.ok(!app.api.buildCocAnalysis().implications.join(' ').includes('Hidden stale'));
 app.state.answers={...adverse,'triggered-provision-consequences':'Other','other-consequence':'<img onerror=alert(1)>'};app.state.renderLogic(issue);app.state.exportReport();assert.ok(app.card.innerHTML.includes('&lt;img'));assert.ok(!app.card.innerHTML.includes('<img'));assert.ok(app.report().includes('<img'));
 assert.equal(JSON.stringify(app.api.buildCocAnalysis('invalid')),JSON.stringify(app.api.buildCocAnalysis('Balanced')));
});
test('Seller Hub capture preserves edited stable actions and canonical phases',async()=>{
 const {state,api}=harness();state.answers={...adverse};const actions=api.buildCocAnalysis('Seller').actions,edited={issueId:issue.id,stableActionId:actions[0].id,instruction:'Keep my advice'},saved={actions:[edited]},picks=new Map(Array.from(actions,a=>[a.id,{issueId:issue.id,actionId:a.id,side:'Seller',priority:a.priority,title:a.title,instruction:a.description}]));
 const hub=await readFile(new URL('../dist/deal-hub.js',import.meta.url),'utf8'),commit=hub.slice(hub.indexOf('  function commitPicks()'),hub.indexOf('  const libraryPhase'));
 vm.runInNewContext(commit+'commitPicks();',{state:saved,picks,picking:true,window:state.window,actionKey:(...v)=>v.join('|'),issueById:()=>issue,hasEquivalentAction:item=>saved.actions.some(a=>a.stableActionId===item.actionId),uid:()=> 'new',statuses:['To Review'],libraryPhase:p=>p,phaseFor:()=> 'wrong',save(){},decorateRecommendations(){},renderHub(){},toast(){},CustomEvent:class{},document:{dispatchEvent(){}}});
 assert.equal(saved.actions.length,3);assert.equal(saved.actions[0],edited);assert.equal(edited.instruction,'Keep my advice');for(const a of saved.actions.slice(1)){const canonical=actions.find(x=>x.id===a.stableActionId);assert.equal(a.instruction,canonical.description);assert.equal(a.priority,canonical.priority);assert.equal(a.dealPhase,canonical.phase);}
});
