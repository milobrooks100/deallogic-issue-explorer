import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../dist/debt-facilities.js", import.meta.url), "utf8");
const issues = JSON.parse(await readFile(new URL("../dist/issues.json", import.meta.url), "utf8"));
const issue = issues.find(item => item.id === "debt-facilities-repayment");
let markup = "";
const card = { querySelector: () => ({}), replaceChildren: () => {}, insertAdjacentHTML: (_where, html) => { markup = html; }, querySelectorAll: () => [] };
const context = vm.createContext({ answers: {}, current: () => issue, riskScore: () => 99, renderPanel: () => {}, document: { querySelector: () => card } });
vm.runInContext(source, context);
const score = answers => { context.answers = answers; return context.riskScore(); };
const questions = answers => { context.answers = answers; context.renderPanel(); return markup; };

test("debt questions have distinct answer keys", () => {
  assert.equal(issue.key_questions.length, 7);
  assert.equal(new Set(issue.key_questions.map(question => question.id)).size, 7);
});

test("follow-up questions match the repayment or consent route", () => {
  assert.match(questions({}), /id="debt-obligations"/);
  assert.doesNotMatch(markup, /id="debt-payoff"/);
  const base = { "debt-obligations": "Yes — finance obligations or security exist" };
  assert.match(questions({ ...base, "debt-transaction-effect": "Repayment or cancellation required" }), /id="debt-payoff"/);
  assert.doesNotMatch(markup, /id="debt-consent"/);
  assert.match(questions({ ...base, "debt-transaction-effect": "Lender consent or waiver required to continue" }), /id="debt-consent"/);
  assert.doesNotMatch(markup, /id="debt-payoff"/);
});

test("confirmed absence and unreviewed debt have different risk", () => {
  assert.equal(score({ "debt-obligations": "No — confirmed from finance documents and charge records" }), 1);
  assert.equal(score({ "debt-obligations": "Not yet checked" }), 2);
});

test("unconfirmed payoff, funding gap and unresolved releases escalate risk", () => {
  const base = { "debt-obligations": "Yes — finance obligations or security exist", "debt-transaction-effect": "Repayment or cancellation required" };
  assert.equal(score({ ...base, "debt-payoff": "No — no written payoff obtained" }), 4);
  assert.equal(score({ ...base, "debt-funding": "No — shortfall or timing gap" }), 5);
  assert.equal(score({ ...base, "debt-releases": "No — required releases are unresolved" }), 5);
});

test("a declined lender consent is a critical completion risk", () => {
  assert.equal(score({ "debt-obligations": "Yes — finance obligations or security exist", "debt-transaction-effect": "Lender consent or waiver required to continue", "debt-consent": "No — lender has declined or required terms are unmet" }), 5);
});

test("a documented and funded payoff with agreed releases reduces risk", () => {
  assert.equal(score({
    "debt-obligations": "Yes — finance obligations or security exist",
    "debt-transaction-effect": "Repayment or cancellation required",
    "debt-payoff": "Yes — current written payoff covers all amounts and release conditions",
    "debt-funding": "Yes — sufficient committed funds and agreed funds flow",
    "debt-releases": "Yes — all required releases are agreed for completion",
    "debt-completion-sequence": "Yes — all required steps are coordinated for completion"
  }), 2);
});
