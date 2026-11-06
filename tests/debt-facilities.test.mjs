import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../dist/debt-facilities.js", import.meta.url), "utf8");
const registrySource = await readFile(new URL("../dist/action-registry.js", import.meta.url), "utf8");
const issues = JSON.parse(await readFile(new URL("../dist/issues.json", import.meta.url), "utf8"));
const issue = issues.find(item => item.id === "debt-facilities-repayment");
let markup = "";
const card = { querySelector: () => ({}), replaceChildren: () => {}, insertAdjacentHTML: (_where, html) => { markup = html; }, querySelectorAll: () => [] };
const summaryNode = { textContent: "" };
const implicationsNode = { children: [], replaceChildren(...children) { this.children = children; } };
const actionSection = { innerHTML: "" };
const logicClasses = new Set();
const logicCard = { innerHTML: "", classList: { add: value => logicClasses.add(value), remove: value => logicClasses.delete(value), contains: value => logicClasses.has(value) } };
let side = "Balanced";
let report;
const events = [];
const context = vm.createContext({ window:{},exportReport(){report="Other issue";},riskNames:["No risk","Low risk","Medium risk","High risk","Very high risk"],areas:{finance:"Finance"},Blob:class{constructor(parts){report=parts.join("");}},URL:{createObjectURL:()=>"",revokeObjectURL(){}}, answers: {}, current: () => issue, riskScore: () => 99, renderPanel: () => {}, renderLogic: () => { logicCard.innerHTML = ""; }, getTransactionSide: () => side, storedKey: () => "test-debt", DealLogicStorage: { setItem: () => {} }, CustomEvent: class { constructor(type) { this.type = type; } }, document: {
  querySelector: selector => selector === ".content-grid > .card" ? card : selector === "#logic-card" ? logicCard : selector === "#logic-card .logic-conclusion" ? summaryNode : selector === "#logic-card .logic-section:nth-of-type(2) ul" ? implicationsNode : selector === "#logic-card .logic-section:nth-of-type(3)" ? actionSection : null,
  createElement: tag => ({ tag, textContent: "", click(){} }),
  dispatchEvent: event => { events.push(event.type); }
} });
vm.runInContext(registrySource,context);
vm.runInContext(source.replace(/\}\)\(\);\s*$/, "globalThis.__debtTest = { options, debtSummary, debtImplications, debtActions, ids, visibleIds, debtAnswersComplete, normalizeAnswers }; })();"), context);
const score = answers => { context.answers = answers; return context.riskScore(); };
const questions = answers => { context.answers = answers; context.renderPanel(); return markup; };
const summary = answers => { context.answers = answers; return context.__debtTest.debtSummary(); };
const implications = answers => { context.answers = answers; return Array.from(context.__debtTest.debtImplications()); };
const actions = (answers, selectedSide = "Balanced", consolidate = true) => {
  context.answers = answers;
  side = selectedSide;
  return Array.from(context.__debtTest.debtActions(selectedSide,consolidate));
};

test("debt questions have distinct answer keys", () => {
  assert.equal(issue.key_questions.length, 7);
  assert.equal(new Set(issue.key_questions.map(question => question.id)).size, 7);
});

test("follow-up questions match the repayment or consent route", () => {
  assert.match(questions({}), /id="debt-obligations"/);
  assert.doesNotMatch(markup, /id="debt-payoff"/);
  const base = { "debt-obligations": "Yes" };
  assert.match(questions({ ...base, "debt-transaction-effect": "Repayment or cancellation" }), /id="debt-payoff"/);
  assert.doesNotMatch(markup, /id="debt-consent"/);
  assert.match(questions({ ...base, "debt-transaction-effect": "Consent or waiver" }), /id="debt-consent"/);
  assert.doesNotMatch(markup, /id="debt-payoff"/);
});

test("confirmed absence and unreviewed debt have different risk", () => {
  assert.equal(score({ "debt-obligations": "No — confirmed" }), 1);
  assert.equal(score({ "debt-obligations": "Not checked" }), 2);
});

test("unconfirmed payoff, funding gap and unresolved releases escalate risk", () => {
  const base = { "debt-obligations": "Yes", "debt-transaction-effect": "Repayment or cancellation" };
  assert.equal(score({ ...base, "debt-payoff": "No written confirmation" }), 4);
  assert.equal(score({ ...base, "debt-funding": "Shortfall or timing gap" }), 5);
  assert.equal(score({ ...base, "debt-releases": "Unresolved" }), 5);
});

test("a declined lender consent is a critical completion risk", () => {
  assert.equal(score({ "debt-obligations": "Yes", "debt-transaction-effect": "Consent or waiver", "debt-consent": "Declined or conditions unmet" }), 5);
});

test("a documented and funded payoff with agreed releases reduces risk", () => {
  assert.equal(score({
    "debt-obligations": "Yes",
    "debt-transaction-effect": "Repayment or cancellation",
    "debt-payoff": "Yes — fully confirmed",
    "debt-funding": "Yes",
    "debt-releases": "All agreed",
    "debt-completion-sequence": "Yes"
  }), 2);
});

test("summary turns an unsought consent into a complete sentence", () => {
  const text = summary({
    "debt-obligations": "Yes",
    "debt-transaction-effect": "Consent or waiver",
    "debt-consent": "Not sought"
  });
  assert.match(text, /The required lender consent or waiver has not yet been sought\./);
  assert.match(text, /completion sequence remains unconfirmed\./);
  assert.doesNotMatch(text, /payoff|release package/);
});

test("every valid answer combination produces readable summary sentences", () => {
  const entries = Object.entries(context.__debtTest.options);
  const selected = {};
  let count = 0;
  const visit = index => {
    if (index === entries.length) {
      const text = summary(selected);
      assert.ok(text.length > 20);
      assert.match(text, /\.$/);
      assert.doesNotMatch(text, /\b(?:undefined|null|Unanswered)\b/);
      count += 1;
      return;
    }
    const [id, choices] = entries[index];
    for (const choice of choices) { selected[id] = choice; visit(index + 1); }
  };
  visit(0);
  assert.equal(count, 112500);
});

test("debt implications change with the transaction route and open completion risks", () => {
  const base = { "debt-obligations": "Yes" };
  assert.deepEqual(implications({ "debt-obligations": "No — confirmed" }), ["No debt-specific completion step is currently indicated."]);
  assert.match(implications({ ...base, "debt-transaction-effect": "Repayment or cancellation", "debt-funding": "Shortfall or timing gap" }).join(" "), /funding shortfall/);
  assert.match(implications({ ...base, "debt-transaction-effect": "Consent or waiver", "debt-consent": "Not sought" }).join(" "), /must be sought/);
  const both = implications({ ...base, "debt-transaction-effect": "Both repayment and consent or waiver", "debt-consent": "Declined or conditions unmet", "debt-funding": "Shortfall or timing gap", "debt-releases": "Unresolved" });
  assert.equal(both.length, 3);
  assert.match(both[0], /lender's refusal/);
  assert.match(both[1], /funding shortfall/);
  assert.match(both[2], /release package/);
});

test("all answer combinations produce one to three complete implications", () => {
  const entries = Object.entries(context.__debtTest.options);
  const selected = {};
  let count = 0;
  const visit = index => {
    if (index === entries.length) {
      const lines = implications(selected);
      assert.ok(lines.length >= 1 && lines.length <= 3);
      for (const line of lines) {
        assert.match(line, /^[A-Z].*\.$/);
        assert.doesNotMatch(line, /\b(?:undefined|null|Unanswered)\b/);
      }
      count += 1;
      return;
    }
    const [id, choices] = entries[index];
    for (const choice of choices) { selected[id] = choice; visit(index + 1); }
  };
  visit(0);
  assert.equal(count, 112500);
});

test("only the approved fourteen action descriptions are used", () => {
  assert.equal(context.window.DealLogicActionRegistry.byTopic.get(issue.id).actions.length, 14);
  assert.deepEqual(actions({ "debt-obligations": "No — confirmed" }), []);
  assert.deepEqual(actions({ "debt-obligations": "Not checked" }).map(action => action.id), ["D01"]);
});

test("Action Library contains the same fourteen Debt Facilities actions", () => {
  const registryContext = vm.createContext({ window: {} });
  vm.runInContext(registrySource, registryContext);
  const topic = registryContext.window.DealLogicActionRegistry.byTopic.get(issue.id);
  assert.equal(topic.actions.length, 14);
  for (const action of topic.actions) {
    assert.ok(action.id && action.title && action.description && action.icon && action.phase);
    const resolved = context.window.DealLogicActionRegistry.actionFor(issue.id,"","",action.id);
    assert.equal(action.description,resolved.description);
  }
});

test("repayment and consent routes select different transaction protections", () => {
  const base = { "debt-obligations": "Yes" };
  const repayment = actions({ ...base, "debt-transaction-effect": "Repayment or cancellation", "debt-releases": "None required — confirmed" }, "Balanced", false);
  assert.ok(repayment.some(action => action.id === "D02"));
  assert.ok(repayment.some(action => action.id === "D03"));
  assert.ok(repayment.some(action => action.id === "D09"));
  assert.ok(!repayment.some(action => action.id === "D04" || action.id === "D08"));
  const consent = actions({ ...base, "debt-transaction-effect": "Consent or waiver", "debt-consent": "Not sought" });
  assert.ok(consent.some(action => action.id === "D04"));
  assert.ok(!consent.some(action => ["D02", "D03", "D07", "D08", "D09"].includes(action.id)));
});

test("buyer, seller and balanced priorities differ where the SPA protection is negotiable", () => {
  const facts = { "debt-obligations": "Yes", "debt-transaction-effect": "Consent or waiver", "debt-consent": "Not sought" };
  const priority = (selectedSide, id) => actions(facts, selectedSide).find(action => action.id === id)?.priority;
  assert.equal(priority("Buyer", "D10"), "Required");
  assert.equal(priority("Seller", "D10"), "Consider");
  assert.equal(priority("Balanced", "D10"), "Recommended");
  assert.equal(priority("Buyer", "D04"), "Required");
  assert.equal(priority("Seller", "D04"), "Required");
});

test("a combined blocked route keeps essential protections within the nine-card cap", () => {
  const facts = {
    "debt-obligations": "Yes",
    "debt-transaction-effect": "Both repayment and consent or waiver",
    "debt-payoff": "No written confirmation",
    "debt-consent": "Declined or conditions unmet",
    "debt-funding": "Shortfall or timing gap",
    "debt-releases": "Unresolved",
    "debt-completion-sequence": "Unresolved dependency"
  };
  const buyer = actions(facts, "Buyer");
  assert.equal(buyer.length, 9);
  const covered=buyer.flatMap(action=>Array.from(action.constituentIds));
  for (const id of ["D02", "D03", "D04", "D06", "D07", "D08", "D09", "D10", "D11"]) assert.ok(covered.includes(id),id);
  assert.equal(buyer.find(action => action.id === "D14")?.priority, "Recommended");
});

test("APA action appears with an asset-sale qualification and no sale-type selector", () => {
  context.answers = { "debt-obligations": "Yes", "debt-transaction-effect": "None" };
  side = "Seller";
  context.renderLogic(issue);
  assert.match(logicCard.innerHTML, /data-action-id="D12"/);
  assert.match(logicCard.innerHTML, /data-level="required"/);
  assert.match(logicCard.innerHTML, /data-action-id="D14"/);
  assert.match(logicCard.innerHTML, /In cases of asset sales/);
  assert.doesNotMatch(logicCard.innerHTML, /data-debt-structure|Share sale|Asset sale/);
});

test("deal logic waits for all visible answers on each question route", () => {
  const render = answers => { context.answers = answers; context.renderLogic(issue); return logicCard.classList.contains("logic-standby"); };
  const base = { "debt-obligations": "Yes" };
  events.length = 0;
  assert.equal(render({}), true);
  assert.match(logicCard.innerHTML, /Answer all relevant questions to generate your deal analysis/);
  assert.equal(render(base), true);
  assert.equal(events.at(-1),"debt-facilities-logic-rendered");
  events.length=0;
  assert.equal(render({ "debt-obligations": "Not checked" }), false);
  assert.deepEqual(events, ["debt-facilities-logic-rendered"]);
  assert.equal(render({ ...base, "debt-transaction-effect": "Unclear" }), false);
  assert.equal(render({ ...base, "debt-transaction-effect": "Repayment or cancellation" }), true);
  assert.equal(render({ ...base, "debt-transaction-effect": "Repayment or cancellation", "debt-payoff": "Not requested", "debt-funding": "Not assessed", "debt-releases": "Not assessed", "debt-completion-sequence": "Not agreed" }), false);
  assert.equal(render({ ...base, "debt-transaction-effect": "Consent or waiver", "debt-consent": "Not sought" }), true);
  assert.equal(render({ ...base, "debt-transaction-effect": "Consent or waiver", "debt-consent": "Not sought", "debt-completion-sequence": "Not agreed" }), false);
  assert.equal(render({ ...base, "debt-transaction-effect": "Both repayment and consent or waiver", "debt-payoff": "Not requested", "debt-consent": "Not sought", "debt-funding": "Not assessed", "debt-releases": "Not assessed", "debt-completion-sequence": "Not agreed" }), false);
  assert.ok(events.includes("debt-facilities-logic-rendered"));
});

const blocked={
 'debt-obligations':'Yes — finance obligations or security exist',
 'debt-transaction-effect':'Both repayment and lender consent or waiver required',
 'debt-payoff':'No — no written payoff obtained',
 'debt-consent':'No — lender has declined or required terms are unmet',
 'debt-funding':'No — shortfall or timing gap',
 'debt-releases':'No — required releases are unresolved',
 'debt-completion-sequence':'No — a completion dependency is unresolved'
};
test('canonical debt catalogue distinguishes perspectives while retaining five neutral practical actions',()=>{
 const registry=context.window.DealLogicActionRegistry,topic=registry.byTopic.get(issue.id),neutral=new Set(['D01','D03','D06','D09','D13']);
 for(const action of topic.actions){
  const descriptions=['Buyer','Seller','Balanced'].map(side=>registry.forSide(action,side).description);
  assert.equal(new Set(descriptions).size,neutral.has(action.id)?1:3,action.id);
  for(const d of descriptions){assert.equal((d.match(/[.!?]/g)||[]).length,1);assert.ok(d.split(/\s+/).length<=32,d);}
 }
 for(const side of ['Buyer','Seller','Balanced'])for(const action of actions(blocked,side,false))assert.equal(action.description,registry.forSide(registry.actionFor(issue.id,'','',action.id),side).description);
 assert.equal(actions(blocked,'invalid').map(a=>a.description).join('|'),actions(blocked,'Balanced').map(a=>a.description).join('|'));
});

test('all 337500 answer and perspective combinations stay within nine cards without dropping triggered protections',()=>{
 const {options,ids}=context.__debtTest,ranks={Required:3,Recommended:2,Consider:1},responses={};let count=0,maximum=0;
 const visit=i=>{if(i<ids.length){for(const value of options[ids[i]]){responses[ids[i]]=value;visit(i+1);}return;}
  for(const side of ['Buyer','Seller','Balanced']){
   const raw=actions(responses,side,false),cards=actions(responses,side);count++;maximum=Math.max(maximum,cards.length);
   assert.ok(cards.length<=9);assert.equal(new Set(cards.map(a=>a.id)).size,cards.length);
   const covered=cards.flatMap(a=>Array.from(a.constituentIds));assert.deepEqual(covered.sort(),raw.map(a=>a.id).sort());
   for(const action of raw)assert.ok(ranks[cards.find(card=>card.constituentIds.includes(action.id)).priority]>=ranks[action.priority]);
   for(const card of cards){assert.equal((card.description.match(/[.!?]/g)||[]).length,1);assert.ok(card.description.split(/\s+/).length<=32,card.description);}
  }
 };visit(0);assert.equal(count,337500);assert.equal(maximum,9);
});

test('Debt Facilities reports use the live capped actions and selected perspective and exclude hidden answers',()=>{
 for(const selectedSide of ['Buyer','Seller','Balanced']){
  context.answers={...blocked};side=selectedSide;context.renderLogic(issue);context.exportReport();
  assert.ok(report.includes(`RECOMMENDED ACTIONS (${side})`));
  for(const action of actions(blocked,side)){
   assert.ok(report.includes(action.description));assert.ok(logicCard.innerHTML.includes(action.description));
   assert.ok(report.includes(`${action.title} (${action.priority})`));
   assert.ok(logicCard.innerHTML.includes(`data-constituent-ids="${action.constituentIds.join(',')}"`));
  }
 }
 context.answers={'debt-obligations':blocked['debt-obligations'],'debt-transaction-effect':'Lender consent or waiver required to continue','debt-consent':'Not yet sought','debt-completion-sequence':'Not yet agreed','debt-funding':blocked['debt-funding']};
 context.exportReport();assert.doesNotMatch(report,/Response: No — shortfall or timing gap|Funding and shortfall allocation/);
 context.answers={'debt-obligations':'No — confirmed from finance documents and charge records',...Object.fromEntries(Object.entries(blocked).filter(([id])=>id!=='debt-obligations'))};
 context.exportReport();assert.doesNotMatch(report,/Response: No — lender has declined|Repayment covenant/);
 context.answers={};context.exportReport();assert.doesNotMatch(report,/RECOMMENDED ACTIONS|SUMMARY/);
});

test('saving combined debt cards preserves component priorities, phases and Seller wording without replacing saved edits',async()=>{
 const hub=await readFile(new URL('../dist/deal-hub.js',import.meta.url),'utf8'),commit=hub.slice(hub.indexOf('  function commitPicks()'),hub.indexOf('  const libraryPhase'));
 const combined=actions(blocked,'Seller').find(a=>a.id==='D01'),components=actions(blocked,'Seller',false).filter(a=>combined.constituentIds.includes(a.id));
 const edited={id:'edited',issueId:issue.id,stableActionId:'D01',title:'Edited review',instruction:'Keep my manual text'};
 const state={actions:[edited]},picks=new Map([['selected',{issueId:issue.id,actionId:combined.id,side:'Seller',title:combined.title,instruction:combined.description,priority:combined.priority,components}]]);
 const app=vm.createContext({state,picks,picking:true,window:context.window,actionKey:(...v)=>v.join('|'),issueById:()=>({id:issue.id}),hasEquivalentAction:item=>state.actions.some(a=>a.stableActionId===item.actionId),uid:()=> 'new',statuses:['To Review'],libraryPhase:p=>p,phaseFor:()=> 'wrong',save(){},decorateRecommendations(){},renderHub(){},toast(){},CustomEvent:class{},document:{dispatchEvent(){}}});
 vm.runInContext(commit+'commitPicks();',app);
 assert.equal(state.actions.length,2);assert.equal(state.actions[0],edited);assert.equal(edited.instruction,'Keep my manual text');
 const saved=state.actions[1];assert.equal(saved.stableActionId,'D12');assert.equal(saved.priority,'Required');assert.equal(saved.side,'Seller');assert.equal(saved.dealPhase,'SPA drafting');
 assert.equal(saved.instruction,components.find(a=>a.id==='D12').description);
});

const previousOptions = {
  "debt-obligations": [
    "Unanswered",
    "No — confirmed from finance documents and charge records",
    "Yes — finance obligations or security exist",
    "Possibly — records are incomplete",
    "Not yet checked"
  ],
  "debt-transaction-effect": [
    "Unanswered",
    "None — no repayment, consent or waiver required",
    "Repayment or cancellation required",
    "Lender consent or waiver required to continue",
    "Both repayment and lender consent or waiver required",
    "Unclear — documents or transaction analysis incomplete"
  ],
  "debt-payoff": [
    "Unanswered",
    "Yes — current written payoff covers all amounts and release conditions",
    "Partly — figures or conditions remain open",
    "No — no written payoff obtained",
    "Not yet requested"
  ],
  "debt-consent": [
    "Unanswered",
    "Yes — written consent or waiver is effective",
    "Agreed in principle, but not signed",
    "No — lender has declined or required terms are unmet",
    "Not yet sought"
  ],
  "debt-funding": [
    "Unanswered",
    "Yes — sufficient committed funds and agreed funds flow",
    "Expected, but funding or funds flow is not final",
    "No — shortfall or timing gap",
    "Not yet assessed"
  ],
  "debt-releases": [
    "Unanswered",
    "No target-group security or guarantees to release — confirmed",
    "Yes — all required releases are agreed for completion",
    "Partly — some releases remain outstanding",
    "No — required releases are unresolved",
    "Not yet mapped"
  ],
  "debt-completion-sequence": [
    "Unanswered",
    "Yes — all required steps are coordinated for completion",
    "Partly — steps agreed in principle",
    "No — a completion dependency is unresolved",
    "Not yet agreed"
  ]
};

test("saved finance answers migrate without changing risk or actions", () => {
  const { ids, options, normalizeAnswers } = context.__debtTest;
  for (const id of ids) {
    for (const [position, value] of previousOptions[id].entries()) {
      const ready = Object.fromEntries(ids.map((key, index) => [key, options[key][index === 0 ? 2 : index === 1 ? 4 : 1]]));
      const current = { ...ready, [id]: options[id][position] };
      const historical = { ...ready, [id]: value };
      assert.equal(score(historical), score(current));
      for (const selectedSide of ["Buyer", "Seller", "Balanced"]) {
        assert.equal(JSON.stringify(actions(historical, selectedSide)), JSON.stringify(actions(current, selectedSide)));
        assert.equal(JSON.stringify(context.window.DealLogicDebtActions(historical, selectedSide)), JSON.stringify(context.window.DealLogicDebtActions(current, selectedSide)));
      }
      context.answers = historical;
      normalizeAnswers();
      assert.equal(context.answers[id], options[id][position]);
      context.exportReport();
      assert.ok(!report.includes("Response: " + value + "\n") || value === options[id][position] || !context.__debtTest.visibleIds().includes(id));
    }
  }
});

test("unassessed releases have an accurate summary and closing implication", () => {
  const { ids, options } = context.__debtTest;
  const responses = Object.fromEntries(ids.map((id, index) => [id, options[id][index === 0 ? 2 : index === 1 ? 2 : index === 5 ? 5 : 1]]));
  assert.match(summary(responses), /releases have not yet been assessed/);
  assert.ok(implications(responses).some(text => text.includes("other credit support")));
});
