import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const registry=await readFile(new URL('../dist/action-registry.js',import.meta.url),'utf8');
const issue=JSON.parse(await readFile(new URL('../dist/issues.json',import.meta.url),'utf8')).find(i=>i.id==='option-holders');
const between=(a,b)=>index.slice(index.indexOf(a),index.indexOf(b,index.indexOf(a)));
const fields={
 'option-rights-exist':['No — confirmed against the relevant records','Yes','Possibly — the records are incomplete or inconsistent','Not yet checked'],
 'award-register-reconciliation':['Yes — fully reconciled','Broadly — only minor discrepancies remain','No — material discrepancies or undocumented awards exist','Not yet reconciled'],
 'award-treatment-implementation':['Yes — no holder consent is required','Yes — all required consents and approvals are secured','Probably — documents or consents remain outstanding','Unclear — the governing documents conflict or are incomplete','No — it cannot currently be implemented by completion','Not yet assessed'],
 'award-dilution-percentage':['1% or less','More than 1% up to 5%','More than 5% up to 10%','More than 10%','Not yet calculated'],
 'award-tax-payroll-position':['Reviewed — no material tax or payroll issue','Reviewed — manageable withholding or reporting is required','Reviewed — treatment must change or a material cost arises','Not reviewed — tax-advantaged awards are present','Not reviewed — no tax-advantaged awards are known','Tax status is unknown']
};
const treatmentChoices=['Exercise and sell','Cancel or release for cash','Rollover or replace','Lapse without payment','Another documented treatment'];
const treatments=Array.from({length:31},(_,i)=>treatmentChoices.filter((_,j)=>(i+1)&(1<<j))).concat([['Treatment not yet decided']]);
const blocked=Object.fromEntries(Object.entries(fields).map(([id,options])=>[id,options[id==='option-rights-exist'?1:id==='award-register-reconciliation'?2:id==='award-treatment-implementation'?4:id==='award-dilution-percentage'?3:2]]));blocked['award-transaction-treatment']=['Exercise and sell'];
function harness(){
 let report='',side='Balanced';const events=[],card={innerHTML:'',classList:{add(){},remove(){}}};
 const state=vm.createContext({window:{},answers:{},current:()=>issue,isOptionHolders:i=>i?.id===issue.id,renderLogic(){},exportReport(){},getTransactionSide:()=>side,escapeLogicText:s=>s,riskScore:()=>4,areas:{shares:'Shares'},riskNames:['No risk','Low risk','Medium risk','High risk','Very high risk'],CustomEvent:class{constructor(type){this.type=type}},Blob:class{constructor(parts){report=parts.join('')}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},document:{querySelector:s=>s==='#logic-card'?card:null,createElement:()=>({click(){}}),dispatchEvent:e=>events.push(e.type)}});
 vm.runInContext(registry,state);
 vm.runInContext(between('const optionHolderQuestions =','const riskScoreBeforeOptionHolders =')+between('const exportReportBeforeOptionHolders =','    </script>')+'\nglobalThis.api={optionHolderActions,optionHolderActionMarkup,optionHolderAnswersComplete};',state);
 return {state,api:state.api,card,events,report:()=>report,side:v=>{side=v}};
}
test('Option Holders shares canonical concise perspective copy and two neutral factual reviews',()=>{
 const {state,api}=harness(),r=state.window.DealLogicActionRegistry;state.answers={...blocked};
 assert.equal(r.byTopic.get(issue.id).actions.length,9);
 for(const action of r.byTopic.get(issue.id).actions){
  const copy=['Buyer','Seller','Balanced'].map(side=>r.forSide(action,side).description);
  assert.equal(new Set(copy).size,['OH01','OH07'].includes(action.id)?1:3,action.id);
  for(const text of copy){assert.equal((text.match(/[.!?]/g)||[]).length,1);assert.ok(text.split(/\s+/).length<=32,text);}
 }
 for(const side of ['Buyer','Seller','Balanced']){const html=api.optionHolderActionMarkup(api.optionHolderActions(side),side);for(const [id] of api.optionHolderActions(side)){const action=r.forSide(r.actionFor(issue.id,'','',id),side);assert.ok(html.includes(action.description));assert.ok(html.includes(action.title));}}
 assert.deepEqual([...api.optionHolderActions('invalid')],[...api.optionHolderActions('Balanced')]);
});
test('all 138240 completed substantive permutations keep triggered steps within nine cards',()=>{
 const {state,api}=harness();const entries=Object.entries(fields).slice(1);let count=0,max=0;
 const visit=i=>{if(i<entries.length){const [id,options]=entries[i];for(const value of options){state.answers[id]=value;visit(i+1);}return;}
  for(const side of ['Buyer','Seller','Balanced']){
   count++;const actions=api.optionHolderActions(side);max=Math.max(max,actions.size);assert.ok(actions.size<=9);assert.equal(api.optionHolderAnswersComplete(),true);
   const treatment=state.answers['award-transaction-treatment'];assert.equal(actions.has('OH03'),true);
   if(!treatment.includes('Treatment not yet decided')){assert.ok(actions.has('OH04'));assert.ok(actions.has('OH06'));}
   if(state.answers['award-treatment-implementation']===fields['award-treatment-implementation'][4]){assert.ok(actions.has('OH05'));assert.ok(actions.has('OH08'));assert.ok(actions.has('OH10'));if([2,3,4].includes(fields['award-dilution-percentage'].indexOf(state.answers['award-dilution-percentage'])))assert.ok(actions.has('OH11'));}
   if(state.answers['award-tax-payroll-position']===fields['award-tax-payroll-position'][2]){assert.ok(actions.has('OH07'));assert.ok(actions.has('OH10'));}
   if(state.answers['award-register-reconciliation']===fields['award-register-reconciliation'][2])assert.ok(actions.has('OH01'));
  }
 };
 for(const existence of fields['option-rights-exist'].slice(1,3))for(const treatment of treatments){state.answers={'option-rights-exist':existence,'award-transaction-treatment':treatment};visit(0);}
 assert.equal(count,138240);assert.equal(max,9);
});
test('blocked profiles retain all nine steps with existing perspective priorities',()=>{
 const {state,api}=harness();state.answers={...blocked};
 for(const side of ['Buyer','Seller','Balanced'])assert.equal(api.optionHolderActions(side).size,9);
 for(const [id,expected] of [['OH08',['Required','Recommended','Required']],['OH10',['Required','Consider','Recommended']],['OH11',['Recommended','Required','Recommended']]])assert.deepEqual(['Buyer','Seller','Balanced'].map(side=>api.optionHolderActions(side).get(id)),expected);
 state.answers={'option-rights-exist':fields['option-rights-exist'][0]};assert.equal(api.optionHolderActions('Buyer').size,0);assert.equal(api.optionHolderAnswersComplete(),true);
 state.answers={};assert.equal(api.optionHolderAnswersComplete(),false);
 state.answers={'option-rights-exist':'Not yet checked'};assert.equal(api.optionHolderAnswersComplete(),false);
});
test('reports and live actions use the same selected copy, titles and priorities and exclude hidden answers',()=>{
 const app=harness(),r=app.state.window.DealLogicActionRegistry;app.state.answers={...blocked};
 for(const side of ['Buyer','Seller','Balanced']){app.side(side);app.state.renderLogic(issue);app.state.exportReport();const report=app.report();assert.ok(report.includes(`RECOMMENDED ACTIONS (${side})`));
  for(const [id,priority] of app.api.optionHolderActions(side)){const action=r.forSide(r.actionFor(issue.id,'','',id),side);assert.ok(app.card.innerHTML.includes(action.description));assert.ok(app.card.innerHTML.includes(`data-action-id="${id}"`));assert.ok(report.includes(`${action.title} (${priority})`));assert.ok(report.includes(action.description));}
 }
 app.state.answers['option-rights-exist']=fields['option-rights-exist'][0];app.state.exportReport();assert.doesNotMatch(app.report(),/Response: Exercise and sell|Specific indemnity/);
 app.state.answers={};app.state.renderLogic(issue);app.state.exportReport();assert.match(app.report(),/Answer all relevant questions/);assert.doesNotMatch(app.report(),/RECOMMENDED ACTIONS|SUMMARY/);assert.equal(app.events.at(-1),'option-holders-logic-rendered');
});
test('Seller Option Holder Hub saves use canonical phase and preserve existing manual edits',async()=>{
 const {state,api}=harness();state.answers={...blocked};const r=state.window.DealLogicActionRegistry;
 const edited={issueId:issue.id,stableActionId:'OH08',instruction:'Keep my advice'};
 const saved={actions:[edited]},picks=new Map([...api.optionHolderActions('Seller')].map(([id,priority])=>{const a=r.forSide(r.actionFor(issue.id,'','',id),'Seller');return [id,{issueId:issue.id,actionId:id,side:'Seller',priority,title:a.title,instruction:a.description}]}));
 const source=await readFile(new URL('../dist/deal-hub.js',import.meta.url),'utf8');const commit=source.slice(source.indexOf('  function commitPicks()'),source.indexOf('  const libraryPhase'));
 vm.runInNewContext(commit+'commitPicks();',{state:saved,picks,picking:true,window:state.window,actionKey:(...v)=>v.join('|'),issueById:()=>issue,hasEquivalentAction:item=>saved.actions.some(a=>a.stableActionId===item.actionId),uid:()=> 'new',statuses:['To Review'],libraryPhase:p=>p,phaseFor:()=> 'wrong',save(){},decorateRecommendations(){},renderHub(){},toast(){},CustomEvent:class{},document:{dispatchEvent(){}}});
 assert.equal(saved.actions.length,9);assert.equal(saved.actions[0],edited);assert.equal(edited.instruction,'Keep my advice');for(const a of saved.actions.slice(1)){const canonical=r.forSide(r.actionFor(issue.id,'','',a.stableActionId),'Seller');assert.equal(a.instruction,canonical.description);assert.equal(a.dealPhase,canonical.phase);assert.equal(a.priority,api.optionHolderActions('Seller').get(a.stableActionId));}
});
