import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

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
  assert.ok(state.litigation.litigationActions(issue, "Buyer").some(action => action.id === "specific-litigation-indemnity"));
  state.answers[ids[0]] = "No";
  assert.equal(state.litigation.litigationRiskScore(), 1);
  assert.deepEqual(Array.from(state.litigation.litigationActions(issue, "Buyer")), []);
});
