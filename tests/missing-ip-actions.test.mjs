import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),registry=await readFile(new URL('../dist/action-registry.js',import.meta.url),'utf8');
const issue=JSON.parse(await readFile(new URL('../dist/issues.json',import.meta.url),'utf8')).find(i=>i.id==='missing-ip-assignment');
const start=index.indexOf('      const renderLogicWithMissingIpAssignment =');
const source=index.slice(start,index.indexOf('    </script>',start));
const fields={
 'ip-assignment-gap':['Yes','No','Partly / unclear'],
 'ip-ownership-evidence':['Yes','No','Partly / unclear'],
 'ip-importance':['Low importance','Medium importance','High importance','Unknown'],
 'ip-redesign-difficulty':['Easy','Manageable','Hard','Unknown'],
 'ip-owner-relationship':['Reachable and cooperative','Reachable and uncooperative','Unreachable','Unknown'],
 'ip-owner-claim':['Yes','No','Unknown']
};
const blocked={'ip-assignment-gap':'Yes','ip-ownership-evidence':'No','ip-importance':'High importance','ip-redesign-difficulty':'Hard','ip-owner-relationship':'Reachable and uncooperative','ip-owner-claim':'Yes'};
function harness(){
 let report='',side='Balanced';const events=[],card={innerHTML:'',classList:{add(){},remove(){}}};
 const state=vm.createContext({window:{},answers:{},current:()=>issue,isMissingIpAssignment:i=>i?.id===issue.id,renderLogic(){},exportReport(){},getTransactionSide:()=>side,escapeLogicText:s=>s,riskScore:()=>4,areas:{intellectual_property:'Intellectual Property'},riskNames:['No risk','Low risk','Medium risk','High risk','Very high risk'],CustomEvent:class{constructor(type){this.type=type}},Blob:class{constructor(parts){report=parts.join('')}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},document:{querySelector:s=>s==='#logic-card'?card:null,createElement:()=>({click(){}}),dispatchEvent:e=>events.push(e.type)}});
 vm.runInContext(registry,state);vm.runInContext(source+'\nglobalThis.api={missingIpActions,missingIpProfile,missingIpVisibleIds,missingIpAnswersComplete,missingIpAnalysis,ipProfileActions};',state);
 return {state,api:state.api,card,events,report:()=>report,side:v=>{side=v}};
}
test('Missing IP canonical copy has nine perspective variants and two neutral reviews',()=>{
 const {state}=harness(),r=state.window.DealLogicActionRegistry;assert.equal(r.byTopic.get(issue.id).actions.length,11);
 for(const action of r.byTopic.get(issue.id).actions){const copy=['Buyer','Seller','Balanced'].map(side=>r.forSide(action,side).description);assert.equal(new Set(copy).size,['R02','R07'].includes(action.id)?1:3,action.id);for(const text of copy){assert.equal((text.match(/[.!?]/g)||[]).length,1);assert.ok(text.split(/\s+/).length<=32,text);}}
 assert.doesNotMatch(source,/retroactive|secondary evidence of equitable title|const ipActionRegistry/);
});
test('all 5184 answer and perspective permutations retain the existing profile priorities and rewrite rule within nine cards',()=>{
 const {state,api}=harness(),entries=Object.entries(fields);let count=0,max=0;const profiles=new Set();
 const visit=i=>{if(i<entries.length){const[id,options]=entries[i];for(const value of options){state.answers[id]=value;visit(i+1);}return;}
  for(const side of ['Buyer','Seller','Balanced']){count++;assert.equal(Boolean(api.missingIpAnswersComplete()),true);const profile=api.missingIpProfile(),actions=api.missingIpActions(profile,side);max=Math.max(max,actions.length);assert.ok(actions.length<=9);assert.equal(new Set(actions.map(a=>a.id)).size,actions.length);
   if(state.answers['ip-assignment-gap']==='No'||state.answers['ip-ownership-evidence']==='Yes'){assert.equal(actions.length,0);continue;}
   profiles.add(profile);const expected=Array.from(api.ipProfileActions[profile][side],pair=>Array.from(pair));
   if(side==='Buyer'){const idx=expected.findIndex(([,id])=>id==='R07');if(state.answers['ip-redesign-difficulty']==='Hard'){if(idx>=0)expected.splice(idx,1);}else if(idx<0)expected.push(['Consider','R07']);}
   assert.deepEqual(Array.from(actions,a=>[a.priority,a.id]).sort((a,b)=>a[1].localeCompare(b[1])),expected.sort((a,b)=>a[1].localeCompare(b[1])));
   for(const a of actions){const r=state.window.DealLogicActionRegistry;assert.equal(a.description,r.forSide(r.actionFor(issue.id,'','',a.id),side).description);}
  }
 };visit(0);assert.equal(count,5184);assert.equal(max,6);assert.equal(profiles.size,6);
});
test('incomplete or hidden responses cannot generate stale Missing IP advice',()=>{
 const app=harness();app.state.answers={...blocked,'ip-importance':'Unanswered'};assert.equal(Boolean(app.api.missingIpAnswersComplete()),false);app.state.renderLogic(issue);assert.match(app.card.innerHTML,/Answer all relevant questions/);assert.equal(app.api.missingIpActions('profile5','Buyer').length,0);assert.equal(app.events.at(-1),'missing-ip-logic-rendered');
 app.state.exportReport();assert.doesNotMatch(app.report(),/Response: Hard|RECOMMENDED ACTIONS|SUMMARY/);
 app.state.answers={...blocked,'ip-assignment-gap':'No'};app.state.renderLogic(issue);app.state.exportReport();assert.match(app.card.innerHTML,/no active transaction actions/);assert.doesNotMatch(app.report(),/Response: Yes|Response: Hard|Specific IP indemnity/);
 app.state.answers={...blocked,'ip-ownership-evidence':'Yes'};app.state.exportReport();assert.doesNotMatch(app.report(),/Response: Hard|Response: Reachable/);assert.match(app.report(),/No corrective assignment/);
});
test('all profiles render and export the selected canonical instructions, titles and priorities',()=>{
 const app=harness(),r=app.state.window.DealLogicActionRegistry;
 const examples=[blocked,{...blocked,'ip-owner-claim':'No','ip-owner-relationship':'Reachable and cooperative','ip-importance':'Low importance'}, {...blocked,'ip-owner-claim':'No','ip-owner-relationship':'Reachable and cooperative'}, {...blocked,'ip-owner-claim':'No'}, {...blocked,'ip-owner-claim':'Unknown'}, {...blocked,'ip-importance':'Low importance','ip-redesign-difficulty':'Easy'}];
 for(const answers of examples)for(const side of ['Buyer','Seller','Balanced']){app.state.answers=answers;app.side(side);app.state.renderLogic(issue);app.state.exportReport();assert.ok(app.report().includes(`RECOMMENDED ACTIONS (${side})`));for(const a of app.api.missingIpActions(app.api.missingIpProfile(),side)){assert.ok(app.card.innerHTML.includes(a.description));assert.ok(app.card.innerHTML.includes(`data-action-id="${a.id}"`));assert.ok(app.report().includes(`${a.title} (${a.priority})`));assert.ok(app.report().includes(a.description));}}
 app.state.answers={...blocked};assert.equal(JSON.stringify(app.api.missingIpActions('profile5','invalid')),JSON.stringify(app.api.missingIpActions('profile5','Balanced')));
});
test('Seller Missing IP Hub capture uses canonical phases and preserves manually edited stable actions',async()=>{
 const {state,api}=harness();state.answers={...blocked};const actions=api.missingIpActions(api.missingIpProfile(),'Seller'),edited={issueId:issue.id,stableActionId:'R05',instruction:'Keep my advice'},saved={actions:[edited]};
 const picks=new Map(Array.from(actions,a=>[a.id,{issueId:issue.id,actionId:a.id,side:'Seller',priority:a.priority,title:a.title,instruction:a.description}]));
 const hub=await readFile(new URL('../dist/deal-hub.js',import.meta.url),'utf8'),commit=hub.slice(hub.indexOf('  function commitPicks()'),hub.indexOf('  const libraryPhase'));
 vm.runInNewContext(commit+'commitPicks();',{state:saved,picks,picking:true,window:state.window,actionKey:(...v)=>v.join('|'),issueById:()=>issue,hasEquivalentAction:item=>saved.actions.some(a=>a.stableActionId===item.actionId),uid:()=> 'new',statuses:['To Review'],libraryPhase:p=>p,phaseFor:()=> 'wrong',save(){},decorateRecommendations(){},renderHub(){},toast(){},CustomEvent:class{},document:{dispatchEvent(){}}});
 assert.equal(saved.actions.length,3);assert.equal(saved.actions[0],edited);assert.equal(edited.instruction,'Keep my advice');for(const a of saved.actions.slice(1)){const canonical=actions.find(x=>x.id===a.stableActionId);assert.equal(a.instruction,canonical.description);assert.equal(a.dealPhase,canonical.phase);assert.equal(a.priority,canonical.priority);}
});
