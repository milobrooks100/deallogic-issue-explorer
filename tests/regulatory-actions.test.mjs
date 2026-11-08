import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const source=await readFile(new URL('../dist/regulatory.js',import.meta.url),'utf8');
const registrySource=await readFile(new URL('../dist/action-registry.js',import.meta.url),'utf8');
const issue=JSON.parse(await readFile(new URL('../dist/issues.json',import.meta.url),'utf8')).find(i=>i.category==='regulatory');
function setup(){
 let report='';const events=[];const card={innerHTML:'',classList:{add(){},remove(){}}};
 const context=vm.createContext({window:{},CustomEvent:class{constructor(type){this.type=type;}},getTransactionSide:()=> 'Balanced',answers:{},escapeLogicText:String,current:()=>issue,riskScore:()=>4,renderPanel(){},renderLogic(){},exportReport(){},riskNames:['No risk','Low risk','Medium risk','High risk','Very high risk'],areas:{regulatory:'Regulatory'},document:{dispatchEvent(e){events.push(e.type);},querySelector:s=>s==='#logic-card'?card:null,createElement:()=>({click(){}})},Blob:class{constructor(parts){report=parts.join('');}},URL:{createObjectURL:()=>'',revokeObjectURL(){}}});
 vm.runInContext(registrySource,context);
 vm.runInContext(source.replace(/\}\)\(\);\s*$/,'globalThis.api={ids,fields,visibleIds,normalize,complete,chooseActions,priorityRank,actionOrder,legalNotes};})();'),context);
 return {...context.api,context,card,events,report:()=>report};
}
const state=(issues='none',steps=['approval'],status='progress',impact='manageable',deadlines='yes')=>({'reg-permissions':'yes','reg-permission-issues':issues,'reg-transaction-steps':steps,'reg-step-status':status,'reg-impact':impact,'reg-deadlines':deadlines});
const ids=list=>Array.from(list,a=>a.id);

test('clean and incomplete routes cannot inherit actions from hidden answers',()=>{
 const {chooseActions}=setup();
 for(const r of [{},{'reg-permissions':'yes'}, {...state('both',['none'],'blocked','fundamental','no'),'reg-permissions':'no'},state('none',['none'],'blocked','fundamental','no')])assert.equal(chooseActions(r).length,0);
});

test('uncertainty requires investigation without inventing breaches or clearance duties',()=>{
 const {chooseActions}=setup();const unknown=Object.fromEntries(Object.keys(state()).map(id=>[id,id==='reg-transaction-steps'?['unknown']:'unknown']));
 for(const side of ['Buyer','Seller','Balanced']){
  const list=chooseActions(unknown,side),map=new Map(list.map(a=>[a.id,a]));
  assert.equal(map.get('RG01').priority,'Required');assert.equal(map.get('RG04').priority,'Recommended');
  for(const id of ['RG03','RG05','RG06','RG10','RG11','RG12','RG13'])assert.equal(map.has(id),false,id);
 }
});

test('statutory steps, optional clearance and notifications follow different rules',()=>{
 const {chooseActions}=setup();const map=r=>new Map(chooseActions(r,'Seller',false).map(a=>[a.id,a]));
 const approval=map(state());for(const id of ['RG04','RG06','RG07'])assert.equal(approval.get(id).priority,'Required');
 const notification=map(state('none',['notification']));assert.equal(notification.get('RG04').priority,'Required');assert.equal(notification.has('RG06'),false);
 const voluntary=map(state('none',['voluntary']));assert.equal(voluntary.get('RG05').priority,'Consider');assert.equal(voluntary.get('RG04').priority,'Recommended');assert.equal(voluntary.has('RG06'),false);
 const blocked=map(state('none',['voluntary'],'blocked'));assert.equal(blocked.get('RG05').priority,'Required');assert.equal(blocked.get('RG12').priority,'Required');
});

test('claimed completion preserves unresolved remediation and reconciles contradictions',()=>{
 const {chooseActions}=setup();
 for(const side of ['Buyer','Seller','Balanced']){
  const raw=chooseActions(state('both',['approval'],'blocked','significant','completed'),side,false),actual=chooseActions(state('both',['approval'],'blocked','significant','completed'),side);
  assert.equal(raw.find(a=>a.id==='RG02').priority,'Required');assert.ok(actual.some(a=>a.id==='RG03'&&/claimed remediation/.test(a.description)));
  assert.equal(actual.some(a=>a.id==='RG02'),false);assert.equal(actual.find(a=>a.id==='RG03').priority,'Required');
 }
 const resolved=chooseActions(state('none',['approval'],'completed','manageable','completed'));
 assert.ok(resolved.some(a=>a.id==='RG02'));for(const id of ['RG03','RG04','RG06','RG07','RG08','RG12'])assert.ok(!ids(resolved).includes(id),id);
});

test('overlap is removed before trimming, allowing a seller Consider action to remain',()=>{
 const {chooseActions}=setup();const r=state('both',['approval','voluntary'],'blocked','minimal','no');
 const raw=chooseActions(r,'Seller',false),actual=chooseActions(r,'Seller');
 assert.equal(raw.length,10);assert.ok(!ids(raw.slice(0,9)).includes('RG13'));
 assert.equal(actual.length,9);assert.ok(ids(actual).includes('RG13'));assert.equal(actual.find(a=>a.id==='RG13').priority,'Consider');
 assert.ok(!ids(actual).includes('RG08'));assert.match(actual.find(a=>a.id==='RG06').description,/longstop/);
});

test('the hard cap removes Consider, then Recommended, then Required with stable ties',()=>{
 const {chooseActions}=setup();
 const severe=state('both',['approval','notification','voluntary'],'blocked','fundamental','completed');
 for(const side of ['Buyer','Seller','Balanced']){
  const actual=chooseActions(severe,side);assert.equal(actual.length,9);
  assert.deepEqual(ids(actual),ids(chooseActions(severe,side)));
  assert.ok(ids(actual).includes('RG03'));assert.ok(ids(actual).includes('RG04'));assert.ok(ids(actual).includes('RG06'));assert.ok(ids(actual).includes('RG12'));
 }
 const seller=chooseActions(severe,'Seller');assert.ok(!ids(seller).includes('RG13'));assert.ok(ids(seller).includes('RG10'));
 const buyer=chooseActions(severe,'Buyer');assert.ok(buyer.every(a=>a.priority==='Required'));assert.ok(!ids(buyer).includes('RG05'));
 const balanced=chooseActions(severe,'Balanced');assert.equal(balanced.filter(a=>a.priority==='Required').length,8);assert.ok(!ids(balanced).includes('RG10'));assert.ok(ids(balanced).includes('RG09'));assert.equal(balanced.find(a=>a.id==='RG09').priority,'Recommended');
});

test('library has twelve available actions per perspective with shared registered icons',()=>{
 const {context}=setup(),registry=context.window.DealLogicActionRegistry;
 assert.equal(registry.byTopic.get(issue.id).actions.length,13);
 for(const side of ['Buyer','Seller','Balanced']){
  const list=registry.actionsForSide(issue.id,side);assert.equal(list.length,12);
  assert.equal(ids(list).includes('RG11'),side!=='Seller');assert.equal(ids(list).includes('RG13'),side==='Seller');
  for(const a of list){assert.ok(Object.values(registry.coreActionIcons).includes(a.icon));const copy=registry.forSide(a,side).description;assert.equal((copy.match(/[.!?]/g)||[]).length,1);assert.ok(copy.split(/\s+/).length<=32);}
 }
 const legacy=registry.topics[0];assert.equal(registry.actionsForSide(legacy.id,'Seller').length,legacy.actions.length);
});

test('live cards, reports and public action accessor share the capped perspective result',()=>{
 const {context,card,events,report,chooseActions}=setup();context.answers=state('both',['approval','notification','voluntary'],'blocked','fundamental','completed');
 for(const side of ['Buyer','Seller','Balanced']){
  context.getTransactionSide=()=>side;context.renderLogic(issue);context.exportReport();const list=chooseActions(context.answers,side);
  assert.equal((card.innerHTML.match(/class="logic-action"/g)||[]).length,list.length);
  assert.match(card.innerHTML,/data-logic-side-toggle/);assert.ok(report().includes(`RECOMMENDED ACTIONS — ${side}`));
  assert.deepEqual(ids(context.window.DealLogicRegulatoryActions(context.answers,side)),ids(list));
  for(const a of list){assert.ok(card.innerHTML.includes(`data-action-id="${a.id}"`));assert.ok(card.innerHTML.includes(a.description));assert.ok(report().includes(`${a.priority}: ${a.title}`));assert.ok(report().includes(a.description));}
 }
 context.answers={};context.renderLogic(issue);context.exportReport();assert.match(card.innerHTML,/Answer all relevant questions/);assert.doesNotMatch(report(),/RECOMMENDED ACTIONS/);assert.ok(events.includes('regulatory-logic-rendered'));
});

test('every reachable answer combination and side respects cap, labels, exclusions and priority trimming',()=>{
 const {fields,ids:questions,chooseActions,normalize,priorityRank}=setup();
 const stepChoices=[['none'],['unknown'],['approval'],['notification'],['voluntary'],['approval','notification'],['approval','voluntary'],['notification','voluntary'],['approval','notification','voluntary']];
 const choices=Array.from(questions,id=>id==='reg-transaction-steps'?stepChoices:Array.from(fields[id].options,([value])=>value));
 const raw={},seen=new Set();let count=0,trimmed=0;
 const visit=i=>{
  if(i<questions.length){for(const value of choices[i]){raw[questions[i]]=value;visit(i+1);}return;}
  const r={...raw};normalize(r);const key=JSON.stringify(r);if(seen.has(key))return;seen.add(key);
  for(const side of ['Buyer','Seller','Balanced']){
   const originals=chooseActions(raw,side,false),cards=chooseActions(raw,side);count++;
   assert.equal(JSON.stringify(cards),JSON.stringify(chooseActions(r,side)));assert.ok(cards.length<=9);assert.equal(new Set(ids(cards)).size,cards.length);
   assert.ok(!ids(cards).includes(side==='Seller'?'RG11':'RG13'));
   const absorbed=new Set();if(ids(originals).includes('RG06')&&ids(originals).includes('RG08'))absorbed.add('RG08');
   const conflict=r['reg-deadlines']==='completed'&&(['gaps','compliance','both'].includes(r['reg-permission-issues'])||(r['reg-transaction-steps'][0]!=='none'&&r['reg-step-status']!=='completed'));
   if(conflict&&ids(originals).includes('RG03')&&ids(originals).includes('RG02'))absorbed.add('RG02');
   for(const dropped of originals.filter(a=>!ids(cards).includes(a.id)&&!absorbed.has(a.id))){trimmed++;assert.equal(cards.length,9);assert.ok(cards.every(a=>priorityRank[a.priority]>=priorityRank[dropped.priority]));}
   for(const a of cards){assert.ok(priorityRank[a.priority]);assert.equal((a.description.match(/[.!?]/g)||[]).length,1);assert.ok(a.description.split(/\s+/).length<=32,a.description);}
  }
 };visit(0);assert.ok(count>20000);assert.ok(trimmed>0);console.log(`Regulatory: ${seen.size} reachable answer sets, ${count} perspective evaluations, ${trimmed} lower-ranked recommendations trimmed`);
});

test('Hub recognizes regulatory rows, refresh events and canonical workflow phases',async()=>{
 const hub=await readFile(new URL('../dist/deal-hub.js',import.meta.url),'utf8');
 const available=hub.slice(hub.indexOf('  const available ='),hub.indexOf('  const snapshot ='));
 assert.match(available,/regulatory-licences-and-transaction-approvals/);
 assert.match(hub.slice(hub.indexOf('  const refreshIssuePicks')),/regulatory-licences-and-transaction-approvals/);
 assert.match(hub,/addEventListener\("regulatory-logic-rendered"/);
 const commit=hub.slice(hub.indexOf('  function commitPicks()'),hub.indexOf('  const libraryPhase'));
 assert.match(commit,/regulatory-licences-and-transaction-approvals/);
});

test('regulatory Hub capture saves retained cards once, preserves edits and prevents duplicates',async()=>{
 const hub=await readFile(new URL('../dist/deal-hub.js',import.meta.url),'utf8');
 const commit=hub.slice(hub.indexOf('  function commitPicks()'),hub.indexOf('  const libraryPhase'));
 const {context:app,chooseActions}=setup();
 const actions=chooseActions(state('both',['approval','notification','voluntary'],'blocked','fundamental','completed'),'Seller');
 const existing={id:'edited',issueId:issue.id,stableActionId:actions[0].id,title:'My wording',instruction:'Keep my legal edits'};
 const stateHub={actions:[existing]},picks=new Map();
 const fill=()=>{for(const a of actions)picks.set(a.id,{issueId:issue.id,actionId:a.id,side:'Seller',title:a.title,instruction:a.description,priority:a.priority});};fill();
 let next=0;
 const context=vm.createContext({picks,state:stateHub,picking:true,window:app.window,statuses:['To Review'],actionKey:(...v)=>v.join('|'),issueById:()=>issue,hasEquivalentAction:item=>stateHub.actions.some(a=>a.stableActionId===item.actionId),uid:()=>String(++next),libraryPhase:p=>p,phaseFor:()=> 'incorrect',save(){},decorateRecommendations(){},renderHub(){},toast(){},CustomEvent:class{},document:{dispatchEvent(){}}});
 vm.runInContext(commit+'commitPicks();',context);
 assert.equal(stateHub.actions.length,9);assert.equal(stateHub.actions[0],existing);assert.equal(existing.instruction,'Keep my legal edits');
 for(const a of stateHub.actions.slice(1)){const selected=actions.find(s=>s.id===a.stableActionId);assert.equal(a.instruction,selected.description);assert.equal(a.priority,selected.priority);assert.equal(a.side,'Seller');assert.equal(a.dealPhase,app.window.DealLogicActionRegistry.actionFor(issue.id,'','',a.stableActionId).phase);}
 assert.ok(!stateHub.actions.some(a=>a.stableActionId==='RG02'||a.stableActionId==='RG08'));
 fill();vm.runInContext('commitPicks();',context);assert.equal(stateHub.actions.length,9);
});


test('approved regulatory notes follow actions and share the completed UI/report gate',()=>{
 const {context,card,report,legalNotes}=setup();
 assert.deepEqual(Array.from(legalNotes,n=>n.title),['Controller approval','NSI completion risk','Post-completion merger intervention']);
 for(const r of [state(),{'reg-permissions':'no','reg-transaction-steps':['none']}]){
  context.answers=r;context.renderLogic(issue);context.exportReport();
  assert.ok(card.innerHTML.indexOf('<h4>Notes</h4>')>card.innerHTML.indexOf('<h4>Recommended actions</h4>'));
  assert.equal((card.innerHTML.match(/class="logic-note"/g)||[]).length,3);
  for(const n of legalNotes){assert.ok(card.innerHTML.includes(n.text));assert.ok(card.innerHTML.includes(`href="${n.url}" target="_blank" rel="noopener noreferrer"`));assert.ok(report().includes(`${n.title}: ${n.text}`));assert.ok(report().includes(n.url));}
 }
 context.answers={};context.renderLogic(issue);context.exportReport();
 assert.doesNotMatch(card.innerHTML,/logic-note|<h4>Notes/);assert.doesNotMatch(report(),/LEGAL NOTES|section 191F/);
});
