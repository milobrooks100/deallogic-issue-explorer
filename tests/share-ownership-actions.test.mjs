import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../dist/share-ownership.js", import.meta.url), "utf8");
const registrySource = await readFile(new URL("../dist/action-registry.js", import.meta.url), "utf8");
const context = vm.createContext({ window: {}, current: () => null, riskScore: () => 1, renderPanel: () => {}, renderLogic: () => {}, exportReport: () => {} });
vm.runInContext(registrySource, context);
vm.runInContext(source.replace(/\}\)\(\);\s*$/, "globalThis.actionTest = { chooseActions, actionsFor, buildAnalysis, assessRisk, fields }; })();"), context);
const { chooseActions, actionsFor, buildAnalysis, assessRisk, fields } = context.actionTest;
const clean = {
  "share-ownership-verified": "verified", "share-seller-participation": "all-agreed",
  "share-transfer-restrictions": "no", "share-security-exists": "no"
};
const adverse = {
  "share-ownership-verified": "disputed", "share-seller-participation": "some-refusing",
  "share-transfer-restrictions": "yes", "share-restrictions-addressed": "not-addressed",
  "share-security-exists": "yes", "share-security-release": "release-refused"
};
const priority = (answers, id) => ["Buyer", "Seller", "Balanced"].map(side => chooseActions(answers, side).find(action => action.id === id)?.priority);
const ids = (answers, side) => Array.from(chooseActions(answers, side), action => action.id).sort();

test("clean assessments retain the agreed baseline and perspective labels", () => {
  assert.deepEqual(ids(clean, "Buyer"), ["SO01", "SO06", "SO10"]);
  assert.deepEqual(priority(clean, "SO01"), ["Recommended", "Consider", "Recommended"]);
  assert.deepEqual(priority(clean, "SO06"), ["Required", "Recommended", "Recommended"]);
  assert.deepEqual(priority(clean, "SO10"), ["Required", "Required", "Required"]);
  assert.equal(chooseActions({}).length, 0);
});

test("the adverse example preserves all required actions inside the eight-item cap", () => {
  assert.deepEqual(ids(adverse, "Buyer"), ["SO01", "SO02", "SO03", "SO04", "SO05", "SO06", "SO09", "SO10"]);
  for (const side of ["Seller", "Balanced"]) assert.deepEqual(ids(adverse, side), ["SO01", "SO02", "SO03", "SO04", "SO05", "SO07", "SO09", "SO10"]);
});

test("answer-specific triggers and perspective priorities follow the reviewed matrix", () => {
  const required = ["Required", "Required", "Required"];
  const recommended = ["Recommended", "Recommended", "Recommended"];
  const cases = [
    [{ "share-ownership-verified": "evidence-gaps" }, "SO02", required],
    [{ "share-seller-participation": "unchecked" }, "SO03", required],
    [{ "share-transfer-restrictions": "yes", "share-restrictions-addressed": "some-outstanding" }, "SO04", required],
    [{ "share-transfer-restrictions": "partly-unclear", "share-restrictions-addressed": "all-addressed" }, "SO04", ["Required", "Recommended", "Required"]],
    [{ "share-transfer-restrictions": "unchecked" }, "SO04", ["Required", "Recommended", "Required"]],
    [{ "share-security-exists": "yes", "share-security-release": "release-agreed" }, "SO05", recommended],
    [{ "share-security-exists": "yes", "share-security-release": "discussions-ongoing" }, "SO05", required],
    [{ "share-ownership-verified": "evidence-gaps" }, "SO07", ["Recommended", "Required", "Recommended"]],
    [{ "share-ownership-verified": "disputed" }, "SO08", ["Recommended", "Consider", "Recommended"]],
    [{ "share-ownership-verified": "evidence-gaps" }, "SO08", ["Consider", "Consider", "Consider"]],
    [{ "share-ownership-verified": "disputed" }, "SO09", ["Required", "Recommended", "Recommended"]],
    [{ "share-seller-participation": "some-undecided" }, "SO09", ["Recommended", "Consider", "Recommended"]]
  ];
  for (const [answers, id, expected] of cases) assert.deepEqual(priority({ ...clean, ...answers }, id), expected, JSON.stringify([answers, id]));
});

test("resolved and unchecked positions do not invent defects, consents or security", () => {
  assert.equal(chooseActions({ ...clean, "share-ownership-verified": "unchecked" }).some(action => action.id === "SO07" || action.id === "SO02"), false);
  assert.equal(chooseActions({ ...clean, "share-security-exists": "unclear" }).some(action => action.id === "SO05"), false);
  assert.equal(chooseActions({ ...clean, "share-transfer-restrictions": "yes", "share-restrictions-addressed": "all-addressed" }).some(action => action.id === "SO04"), false);
  const hidden = { ...clean, "share-restrictions-addressed": "not-addressed", "share-security-release": "release-refused" };
  assert.deepEqual(ids(hidden, "Buyer"), ids(clean, "Buyer"));
});

test("instructions distinguish document gaps, disputes, unknown restrictions and agreed releases", () => {
  const instruction = (answers, id) => actionsFor({ ...clean, ...answers }, "Buyer").find(action => action.id === id)?.description;
  assert.match(instruction({ "share-ownership-verified": "evidence-gaps" }, "SO02"), /missing ownership evidence/);
  assert.match(instruction({ "share-ownership-verified": "disputed" }, "SO02"), /ownership dispute/);
  assert.match(instruction({ "share-transfer-restrictions": "unchecked" }, "SO04"), /confirm which approvals/);
  assert.match(instruction({ "share-security-exists": "yes", "share-security-release": "release-agreed" }, "SO05"), /agreed security releases will take effect/);
});

test("all ten library actions have stable identity and the agreed toolkit icons", () => {
  const topic = context.window.DealLogicActionRegistry.byTopic.get("share-ownership-and-transfer-restrictions");
  assert.equal(topic.actions.length, 10);
  assert.deepEqual(Array.from(topic.actions, action => action.icon), ["search", "wrench", "handshake", "handshake", "wrench", "shield-check", "file-search", "banknote", "circle-check", "calendar-check"]);
  assert.equal(new Set(topic.actions.map(action => action.id)).size, 10);
});

test("every permutation and perspective stays capped without dropping required actions", () => {
  const entries = Object.entries(fields);
  const responses = {};
  let checked = 0;
  const visit = index => {
    if (index < entries.length) {
      const [id, field] = entries[index];
      for (const value of ["", ...field.options.map(([value]) => value)]) { responses[id] = value; visit(index + 1); }
      return;
    }
    const complete = Boolean(buildAnalysis(responses));
    for (const side of ["Buyer", "Seller", "Balanced"]) {
      const actions = actionsFor(responses, side);
      assert.ok(actions.length <= 8);
      if (!complete) { assert.equal(actions.length, 0); continue; }
      assert.equal(new Set(actions.map(action => action.id)).size, actions.length);
      assert.ok(actions.every(action => action.title && action.description && action.icon));
      for(const action of actions){
        assert.equal((action.description.match(/[.!?]/g)||[]).length,1);
        assert.ok(action.description.split(/\s+/).length<=32,action.description);
      }
      const required = ["SO10"];
      const ownership = responses["share-ownership-verified"];
      const restrictions = responses["share-transfer-restrictions"];
      const titleIssue = ["evidence-gaps", "disputed"].includes(ownership);
      if (ownership !== "verified") required.push("SO01");
      if (titleIssue) required.push("SO02");
      if (responses["share-seller-participation"] !== "all-agreed") required.push("SO03");
      if ((restrictions === "yes" && responses["share-restrictions-addressed"] !== "all-addressed") || (side !== "Seller" && ["partly-unclear", "unchecked"].includes(restrictions))) required.push("SO04");
      if (responses["share-security-exists"] === "yes" && responses["share-security-release"] !== "release-agreed") required.push("SO05");
      if (side === "Buyer") { required.push("SO06"); if (assessRisk(responses).score >= 4) required.push("SO09"); }
      if (side === "Seller" && (titleIssue || ["yes", "partly-unclear"].includes(restrictions) || responses["share-security-exists"] === "yes")) required.push("SO07");
      for (const id of required) assert.equal(actions.find(action => action.id === id)?.priority, "Required", `${side}: ${id}`);
    }
    checked++;
  };
  visit(0);
  assert.equal(checked, 15625);
});

test('Share Ownership catalogue uses perspective wording except neutral verification and completion mechanics',()=>{
 const registry=context.window.DealLogicActionRegistry,topic=registry.byTopic.get('share-ownership-and-transfer-restrictions');
 for(const action of topic.actions){
  const copy=['Buyer','Seller','Balanced'].map(side=>registry.forSide(action,side).description);
  assert.equal(new Set(copy).size,['SO01','SO10'].includes(action.id)?1:3,action.id);
  for(const sentence of copy){assert.equal((sentence.match(/[.!?]/g)||[]).length,1);assert.ok(sentence.split(/\s+/).length<=32,sentence);}
 }
 assert.match(registry.forSide(registry.actionFor(topic.id,'','','SO06'),'Seller').description,/each seller’s own title/);
 assert.match(registry.forSide(registry.actionFor(topic.id,'','','SO08'),'Seller').description,/Resist broad title indemnities/);
});

test('conditional instructions remain factual and change perspective where the advice differs',()=>{
 const cases=[
  [{'share-ownership-verified':'evidence-gaps'},'SO02'],
  [{'share-ownership-verified':'disputed'},'SO02'],
  [{'share-seller-participation':'unchecked'},'SO03'],
  [{'share-transfer-restrictions':'unchecked'},'SO04'],
  [{'share-security-exists':'yes','share-security-release':'release-agreed'},'SO05'],
  [{'share-ownership-verified':'evidence-gaps'},'SO08']
 ];
 for(const [changes,id] of cases){
  const descriptions=['Buyer','Seller','Balanced'].map(side=>actionsFor({...clean,...changes},side).find(a=>a.id===id).description);
  assert.notEqual(descriptions[0],descriptions[1],id);
 }
 assert.match(actionsFor({...clean,'share-ownership-verified':'evidence-gaps'},'Seller').find(a=>a.id==='SO08').description,/Assess.*before accepting/);
 assert.equal(actionsFor(clean,'invalid').map(a=>a.description).join('|'),actionsFor(clean,'Balanced').map(a=>a.description).join('|'));
});

test('Apply Deal Lens and reports use identical perspective-specific instructions and priorities',async()=>{
 const issues=JSON.parse(await readFile(new URL('../dist/issues.json',import.meta.url),'utf8'));
 const issue=issues.find(i=>i.id==='share-ownership-and-transfer-restrictions');
 const card={innerHTML:'',classList:{add(){},toggle(){}}};let report;
 const app=vm.createContext({window:{},answers:{...adverse},current:()=>issue,getTransactionSide:()=> 'Balanced',riskScore:()=>1,riskNames:['No risk','Low risk','Medium risk','High risk','Very high risk'],areas:{shares:'Shares'},renderPanel(){},renderLogic(){},exportReport(){},CustomEvent:class{},document:{querySelector:s=>s==='#logic-card'?card:null,dispatchEvent(){},createElement:()=>({click(){}})},Blob:class{constructor(parts){report=parts.join('');}},URL:{createObjectURL:()=>'',revokeObjectURL(){}}});
 vm.runInContext(registrySource,app);vm.runInContext(source,app);
 for(const side of ['Buyer','Seller','Balanced']){
  app.getTransactionSide=()=>side;app.renderLogic(issue);app.exportReport();
  for(const action of actionsFor(adverse,side)){
   assert.ok(card.innerHTML.includes(action.description));assert.ok(report.includes(action.description));
   assert.ok(report.includes(`${action.title} (${action.priority})`));assert.ok(card.innerHTML.includes(`data-action-id="${action.id}"`));
  }
  assert.ok((card.innerHTML.match(/class="logic-action"/g)||[]).length<=8);
 }
});
