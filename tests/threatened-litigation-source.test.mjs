import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const registrySource = await readFile(new URL("../dist/action-registry.js", import.meta.url), "utf8");
const index = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const issues = JSON.parse(await readFile(new URL("../dist/issues.json", import.meta.url), "utf8"));
const issue = issues.find(item => item.id === "threatened-litigation");

function arrayAfter(name) {
  const source = index.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`))?.[1];
  assert.ok(source, `${name} must be defined in the current interface`);
  return JSON.parse(source);
}

test("shipped litigation questions match the current interface", () => {
  const questions = arrayAfter("litigationQuestions");
  const ids = arrayAfter("litigationQuestionIds");
  assert.equal(questions.length, 6);
  assert.deepEqual(issue.key_questions.map(item => item.question), questions);
  assert.deepEqual(issue.key_questions.map(item => item.id), ids);
  assert.ok(!index.includes("identify-claim-and-status"));
});

const expectedOptions = {
  "litigation-threat-exists": ["Unanswered", "No", "Yes", "Possibly", "Not yet checked"],
  "litigation-stage-deadlines": ["Unanswered", "Informal allegation or demand only", "Formal pre-action correspondence or letter before claim received", "Court, tribunal or arbitration proceedings commenced", "Hearing or significant deadline falls before or close to completion", "Stage or deadlines are unclear"],
  "litigation-merits": ["Unanswered", "Reviewed — claim appears weak and the target has strong defences", "Reviewed — merits and defences are finely balanced", "Reviewed — claim appears credible and the target has material adverse exposure", "Partly reviewed — preliminary assessment only or material evidence is missing", "Not yet assessed"],
  "litigation-impact": ["Unanswered", "Minimal", "Manageable — meaningful exposure but absorbable", "Material — could materially affect price, operations, a key asset or completion", "Fundamental — could undermine the transaction and target's business entirely", "Not yet quantified or assessed"],
  "litigation-risk-transfer": ["Unanswered", "Yes — cover or recovery is confirmed, required notices and approvals are satisfied", "Potentially — notice has been given, but coverage or recovery remains undecided", "Potentially — cover or recovery may exist, but notice, consent or other steps remain outstanding", "No — cover or recovery is unavailable, denied or insufficient", "Not reviewed or unknown"],
  "litigation-resolution": ["Unanswered", "Already resolved — binding settlement, withdrawal or full release completed", "Resolution documents are signed, but final steps remain outstanding", "A credible resolution route is likely before completion, but it is not yet binding", "Resolution is possible, but timing or terms are uncertain", "Resolution before completion is unlikely or no viable route has been identified", "Not assessed"]
};

function sourceBetween(start, end) {
  const from = index.indexOf(start);
  const to = index.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `Could not locate ${start}`);
  return index.slice(from, to);
}

function litigationHarness() {
  const saved = [];
  const sandbox = {
    window: {},
    answers: {},
    DealLogicStorage: { setItem: (...args) => saved.push(args) },
    storedKey: () => "saved-litigation",
    saved
  };
  const source = [
    sourceBetween("const litigationQuestionIds =", "const litigationGuidance ="),
    sourceBetween("const litigationRiskScore =", "const riskScoreBeforeThreatenedLitigation ="),
    sourceBetween("const litigationAnswerComplete =", "const litigationActionMarkup ="),
    "globalThis.litigation = { litigationQuestionIds, litigationAnswerOptions, litigationNormalizeAnswers, litigationAnswerComplete, litigationRiskScore, litigationSummary, litigationImplications, litigationActions };"
  ].join("\n");
  vm.runInNewContext(registrySource, sandbox);
  vm.runInNewContext(source, sandbox);
  return sandbox;
}

test("the shipped choices exactly match the shortened answers", () => {
  const { litigation } = litigationHarness();
  assert.deepEqual(JSON.parse(JSON.stringify(litigation.litigationAnswerOptions)), expectedOptions);
  for (const [id, options] of Object.entries(expectedOptions)) {
    assert.equal(new Set(options).size, options.length, `${id} has duplicate choices`);
  }
});

test("saved answers with previous wording are replaced with current choices", () => {
  const state = litigationHarness();
  state.answers["litigation-threat-exists"] = "Possibly — relevant allegations or circumstances exist, but the records are incomplete or inconsistent";
  state.answers["litigation-impact"] = "Immaterial — within ordinary-course tolerances and no material non-financial remedy is threatened";
  state.answers["litigation-risk-transfer"] = "Potentially — timely notice has been given, but coverage or recovery remains undecided";
  state.litigation.litigationNormalizeAnswers();
  assert.equal(state.answers["litigation-threat-exists"], "Possibly");
  assert.equal(state.answers["litigation-impact"], "Minimal");
  assert.equal(state.answers["litigation-risk-transfer"], expectedOptions["litigation-risk-transfer"][2]);
  assert.equal(state.saved.length, 1);
  state.litigation.litigationNormalizeAnswers();
  assert.equal(state.saved.length, 1);
});

test("shortened choices drive the summary, risk and recommendations", () => {
  const state = litigationHarness();
  const ids = state.litigation.litigationQuestionIds;
  const choices = [2, 4, 3, 3, 4, 5];
  ids.forEach((id, index) => { state.answers[id] = expectedOptions[id][choices[index]]; });
  assert.equal(state.litigation.litigationAnswerComplete(), true);
  assert.equal(state.litigation.litigationRiskScore(), 5);
  const summary = state.litigation.litigationSummary();
  assert.match(summary, /A hearing or significant deadline/);
  assert.match(summary, /Cover or recovery is unavailable/);
  assert.ok(!summary.includes("Urgent relief"));
  assert.ok(state.litigation.litigationActions(issue, "Buyer", false).some(action => action.id === "specific-litigation-indemnity"));
  state.answers[ids[0]] = "No";
  assert.equal(state.litigation.litigationRiskScore(), 1);
  assert.deepEqual(Array.from(state.litigation.litigationActions(issue, "Buyer")), []);
});

test("confirmed recovery does not raise risk for the answers shown in the screenshots", () => {
  const state = litigationHarness();
  const ids = state.litigation.litigationQuestionIds;
  const choices = [3, 4, 1, 1, 4, 0];
  ids.forEach((id, index) => { state.answers[id] = expectedOptions[id][choices[index]]; });
  assert.equal(state.litigation.litigationRiskScore(), 2);
  state.answers[ids[4]] = expectedOptions[ids[4]][1];
  assert.equal(state.litigation.litigationRiskScore(), 2);
});

test("confirmed recovery never raises risk across the litigation answer combinations", () => {
  const state = litigationHarness();
  const ids = state.litigation.litigationQuestionIds;
  for (const threat of [2, 3]) {
    for (let stage = 0; stage < expectedOptions[ids[1]].length; stage++) {
      for (let merits = 0; merits < expectedOptions[ids[2]].length; merits++) {
        for (let impact = 0; impact < expectedOptions[ids[3]].length; impact++) {
          for (let resolution = 0; resolution < expectedOptions[ids[5]].length; resolution++) {
            [threat, stage, merits, impact, 1, resolution].forEach((choice, index) => {
              state.answers[ids[index]] = expectedOptions[ids[index]][choice];
            });
            const withConfirmedRecovery = state.litigation.litigationRiskScore();
            for (const alternative of [0, 2, 3, 4, 5]) {
              state.answers[ids[4]] = expectedOptions[ids[4]][alternative];
              const alternativeRisk = state.litigation.litigationRiskScore();
              assert.ok(withConfirmedRecovery <= alternativeRisk,
                `Confirmed recovery raised risk relative to choice ${alternative} for ${[threat, stage, merits, impact, resolution].join(",")}`);
            }
          }
        }
      }
    }
  }
});

test("an actual credible threat starts above a possible threat", () => {
  const state = litigationHarness();
  const threatId = state.litigation.litigationQuestionIds[0];
  state.answers[threatId] = "Possibly";
  assert.equal(state.litigation.litigationRiskScore(), 2);
  state.answers[threatId] = "Yes";
  assert.equal(state.litigation.litigationRiskScore(), 3);
});

test("Yes never scores below Possibly with the same remaining answers", () => {
  const state = litigationHarness();
  const ids = state.litigation.litigationQuestionIds;
  for (let stage = 0; stage < expectedOptions[ids[1]].length; stage++) {
    for (let merits = 0; merits < expectedOptions[ids[2]].length; merits++) {
      for (let impact = 0; impact < expectedOptions[ids[3]].length; impact++) {
        for (let transfer = 0; transfer < expectedOptions[ids[4]].length; transfer++) {
          for (let resolution = 0; resolution < expectedOptions[ids[5]].length; resolution++) {
            [3, stage, merits, impact, transfer, resolution].forEach((choice, index) => {
              state.answers[ids[index]] = expectedOptions[ids[index]][choice];
            });
            const possibleRisk = state.litigation.litigationRiskScore();
            state.answers[ids[0]] = "Yes";
            const actualRisk = state.litigation.litigationRiskScore();
            assert.ok(actualRisk >= possibleRisk,
              `Yes scored below Possibly for ${[stage, merits, impact, transfer, resolution].join(",")}`);
          }
        }
      }
    }
  }
});

const disputed = [2, 4, 3, 4, 3, 4];
function setChoices(state, choices) {
  state.litigation.litigationQuestionIds.forEach((id, index) => { state.answers[id] = expectedOptions[id][choices[index]]; });
}
test('litigation uses canonical perspective wording with three neutral factual reviews', () => {
  const state = litigationHarness(), registry = state.window.DealLogicActionRegistry;
  const neutral = new Set(['conduct-dispute-diligence','obtain-contentious-advice','confirm-insurance-and-recovery-rights']);
  setChoices(state, disputed);
  assert.equal(registry.byTopic.get(issue.id).actions.length,14);
  for (const action of registry.byTopic.get(issue.id).actions) {
    const descriptions = ['Buyer','Seller','Balanced'].map(side => registry.forSide(action,side).description);
    assert.equal(new Set(descriptions).size, neutral.has(action.id) ? 1 : 3, action.id);
    for (const text of descriptions) { assert.equal((text.match(/[.!?]/g)||[]).length,1); assert.ok(text.split(/\s+/).length <= 32,text); }
  }
  for (const side of ['Buyer','Seller','Balanced']) for (const action of state.litigation.litigationActions(issue,side,false)) {
    assert.equal(action.description,registry.forSide(registry.actionFor(issue.id,'','',action.id),side).description);
  }
  assert.equal(JSON.stringify(state.litigation.litigationActions(issue,'invalid')),JSON.stringify(state.litigation.litigationActions(issue,'Balanced')));
});

test('all completed litigation permutations preserve every triggered component within nine cards', () => {
  const state=litigationHarness(), ids=state.litigation.litigationQuestionIds, ranks={Required:3,Recommended:2,Consider:1};
  let count=0, maximum=0;
  const visit=i=>{
    if(i<ids.length){for(let j=1;j<expectedOptions[ids[i]].length;j++){state.answers[ids[i]]=expectedOptions[ids[i]][j];visit(i+1);}return;}
    for(const side of ['Buyer','Seller','Balanced']){
      const raw=state.litigation.litigationActions(issue,side,false), cards=state.litigation.litigationActions(issue,side);count++;maximum=Math.max(maximum,cards.length);
      assert.ok(cards.length<=9);assert.equal(new Set(cards.map(a=>a.id)).size,cards.length);
      assert.deepEqual(cards.flatMap(a=>Array.from(a.constituentIds)).sort(),raw.map(a=>a.id).sort());
      for(const card of cards){
        assert.equal(ranks[card.priority],Math.max(...raw.filter(a=>card.constituentIds.includes(a.id)).map(a=>ranks[a.priority])));
        assert.equal((card.description.match(/[.!?]/g)||[]).length,1);assert.ok(card.description.split(/\s+/).length<=32,card.description);
      }
    }
  };visit(0);assert.equal(count,45000);assert.equal(maximum,9);
});

test('litigation reports and rendered cards share selected wording, priorities and component identities',()=>{
 const state=litigationHarness();let report='',side='Seller';
 const card={innerHTML:'',classList:{add(){},remove(){}}};
 Object.assign(state,{getTransactionSide:()=>side,current:()=>issue,isThreatenedLitigation:()=>true,exportReport(){},renderLogic(){},riskScore:()=>state.litigation.litigationRiskScore(),areas:{disputes:'Disputes'},riskNames:['No risk','Low risk','Medium risk','High risk','Very high risk'],escapeLogicText:s=>s,
  litigationQuestions:issue.key_questions.map(q=>q.question),CustomEvent:class{},Blob:class{constructor(parts){report=parts.join('')}},URL:{createObjectURL(){return 'report'},revokeObjectURL(){}},document:{querySelector:s=>s==='#logic-card'?card:null,createElement:()=>({click(){}}),dispatchEvent(){}}});
 vm.runInNewContext(sourceBetween('const exportReportBeforeThreatenedLitigation =','const litigationAnswerComplete =')+'\n'+sourceBetween('const litigationActionMarkup =','    </script>'),state);
 for(side of ['Buyer','Seller','Balanced']){
  setChoices(state,disputed);state.renderLogic(issue);state.exportReport();assert.ok(report.includes(`RECOMMENDED ACTIONS (${side})`));
  for(const action of state.litigation.litigationActions(issue,side)){
   assert.ok(report.includes(`${action.title} (${action.priority})`));assert.ok(report.includes(action.description));assert.ok(card.innerHTML.includes(action.description));assert.ok(card.innerHTML.includes(`data-constituent-ids="${action.constituentIds.join(',')}"`));
  }
 }
 state.answers[issue.key_questions[0].id]='No';state.exportReport();assert.doesNotMatch(report,/Response: A hearing|The claim could undermine|RECOMMENDED ACTIONS \(Seller\)[\s\S]*Specific indemnity/);
 state.answers={};state.exportReport();assert.doesNotMatch(report,/RECOMMENDED ACTIONS|SUMMARY/);
});

test('combined litigation Hub capture retains Seller components and priorities without overwriting saved edits',async()=>{
 const state=litigationHarness();setChoices(state,disputed);
 const cards=state.litigation.litigationActions(issue,'Seller'),card=cards.find(a=>a.constituentIds.includes('specific-litigation-indemnity'));
 assert.ok(card.constituentIds.length>1);
 const components=state.litigation.litigationActions(issue,'Seller',false).filter(a=>card.constituentIds.includes(a.id));
 const hub=await readFile(new URL('../dist/deal-hub.js',import.meta.url),'utf8'),commit=hub.slice(hub.indexOf('  function commitPicks()'),hub.indexOf('  const libraryPhase'));
 const edited={issueId:issue.id,stableActionId:components[0].id,title:'My edited title',instruction:'Keep my advice'};
 const saved={actions:[edited]},picks=new Map([['selected',{issueId:issue.id,actionId:card.id,side:'Seller',title:card.title,instruction:card.description,priority:card.priority,components}]]);
 const app={state:saved,picks,picking:true,window:state.window,actionKey:(...v)=>v.join('|'),issueById:()=>({id:issue.id}),hasEquivalentAction:item=>saved.actions.some(a=>a.stableActionId===item.actionId),uid:()=> 'new',statuses:['To Review'],libraryPhase:p=>p,phaseFor:()=> 'wrong',save(){},decorateRecommendations(){},renderHub(){},toast(){},CustomEvent:class{},document:{dispatchEvent(){}}};
 vm.runInNewContext(commit+'commitPicks();',app);assert.equal(saved.actions.length,components.length);assert.equal(saved.actions[0],edited);assert.equal(edited.instruction,'Keep my advice');
 for(const action of saved.actions.slice(1)){const original=components.find(a=>a.id===action.stableActionId);assert.equal(action.side,'Seller');assert.equal(action.instruction,original.description);assert.equal(action.priority,original.priority);assert.equal(action.dealPhase,original.phase);}
});
