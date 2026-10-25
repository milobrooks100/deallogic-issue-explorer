import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../dist/debt-facilities.js", import.meta.url), "utf8");
const issues = JSON.parse(await readFile(new URL("../dist/issues.json", import.meta.url), "utf8"));
const issue = issues.find(item => item.id === "debt-facilities-repayment");
let markup = "";
const card = { querySelector: () => ({}), replaceChildren: () => {}, insertAdjacentHTML: (_where, html) => { markup = html; }, querySelectorAll: () => [] };
const summaryNode = { textContent: "" };
const implicationsNode = { children: [], replaceChildren(...children) { this.children = children; } };
const actionSection = { innerHTML: "" };
let side = "Balanced";
let clickHandler;
const context = vm.createContext({ answers: {}, current: () => issue, riskScore: () => 99, renderPanel: () => {}, renderLogic: () => {}, getTransactionSide: () => side, storedKey: () => "test-debt", DealLogicStorage: { setItem: () => {} }, document: {
  querySelector: selector => selector === ".content-grid > .card" ? card : selector === "#logic-card .logic-conclusion" ? summaryNode : selector === "#logic-card .logic-section:nth-of-type(2) ul" ? implicationsNode : selector === "#logic-card .logic-section:nth-of-type(3)" ? actionSection : null,
  createElement: tag => ({ tag, textContent: "" }),
  addEventListener: (type, handler) => { if (type === "click") clickHandler = handler; }
} });
vm.runInContext(source.replace(/\}\)\(\);\s*$/, "globalThis.__debtTest = { options, debtSummary, debtImplications, debtActions, actionCatalog }; })();"), context);
const score = answers => { context.answers = answers; return context.riskScore(); };
const questions = answers => { context.answers = answers; context.renderPanel(); return markup; };
const summary = answers => { context.answers = answers; context.renderLogic(issue); return summaryNode.textContent; };
const implications = answers => { context.answers = answers; context.renderLogic(issue); return implicationsNode.children.map(item => item.textContent); };
const actions = (answers, selectedSide = "Balanced", structure = "SPA") => {
  context.answers = { ...answers, "debt-structure": structure };
  side = selectedSide;
  return Array.from(context.__debtTest.debtActions(selectedSide, structure));
};

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

test("summary turns an unsought consent into a complete sentence", () => {
  const text = summary({
    "debt-obligations": "Yes — finance obligations or security exist",
    "debt-transaction-effect": "Lender consent or waiver required to continue",
    "debt-consent": "Not yet sought"
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
  const base = { "debt-obligations": "Yes — finance obligations or security exist" };
  assert.deepEqual(implications({ "debt-obligations": "No — confirmed from finance documents and charge records" }), ["No debt-specific completion step is currently indicated."]);
  assert.match(implications({ ...base, "debt-transaction-effect": "Repayment or cancellation required", "debt-funding": "No — shortfall or timing gap" }).join(" "), /funding shortfall/);
  assert.match(implications({ ...base, "debt-transaction-effect": "Lender consent or waiver required to continue", "debt-consent": "Not yet sought" }).join(" "), /must be sought/);
  const both = implications({ ...base, "debt-transaction-effect": "Both repayment and lender consent or waiver required", "debt-consent": "No — lender has declined or required terms are unmet", "debt-funding": "No — shortfall or timing gap", "debt-releases": "No — required releases are unresolved" });
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
  assert.equal(Object.keys(context.__debtTest.actionCatalog).length, 14);
  assert.deepEqual(actions({ "debt-obligations": "No — confirmed from finance documents and charge records" }), []);
  assert.deepEqual(actions({ "debt-obligations": "Not yet checked" }).map(action => action.id), ["D01"]);
});

test("repayment and consent routes select different transaction protections", () => {
  const base = { "debt-obligations": "Yes — finance obligations or security exist" };
  const repayment = actions({ ...base, "debt-transaction-effect": "Repayment or cancellation required", "debt-releases": "No target-group security or guarantees to release — confirmed" });
  assert.ok(repayment.some(action => action.id === "D02"));
  assert.ok(repayment.some(action => action.id === "D03"));
  assert.ok(repayment.some(action => action.id === "D09"));
  assert.ok(!repayment.some(action => action.id === "D04" || action.id === "D08"));
  const consent = actions({ ...base, "debt-transaction-effect": "Lender consent or waiver required to continue", "debt-consent": "Not yet sought" });
  assert.ok(consent.some(action => action.id === "D04"));
  assert.ok(!consent.some(action => ["D02", "D03", "D07", "D08", "D09"].includes(action.id)));
});

test("buyer, seller and balanced priorities differ where the SPA protection is negotiable", () => {
  const facts = { "debt-obligations": "Yes — finance obligations or security exist", "debt-transaction-effect": "Lender consent or waiver required to continue", "debt-consent": "Not yet sought" };
  const priority = (selectedSide, id) => actions(facts, selectedSide).find(action => action.id === id)?.priority;
  assert.equal(priority("Buyer", "D10"), "Required");
  assert.equal(priority("Seller", "D10"), "Consider");
  assert.equal(priority("Balanced", "D10"), "Recommended");
  assert.equal(priority("Buyer", "D04"), "Required");
  assert.equal(priority("Seller", "D04"), "Required");
});

test("a combined blocked route keeps essential protections within the ten-action cap", () => {
  const facts = {
    "debt-obligations": "Yes — finance obligations or security exist",
    "debt-transaction-effect": "Both repayment and lender consent or waiver required",
    "debt-payoff": "No — no written payoff obtained",
    "debt-consent": "No — lender has declined or required terms are unmet",
    "debt-funding": "No — shortfall or timing gap",
    "debt-releases": "No — required releases are unresolved",
    "debt-completion-sequence": "No — a completion dependency is unresolved"
  };
  const buyer = actions(facts, "Buyer", "APA");
  assert.equal(buyer.length, 10);
  assert.ok(buyer.every(action => action.priority === "Required"));
  for (const id of ["D02", "D03", "D04", "D06", "D07", "D08", "D09", "D10", "D11", "D14"]) assert.ok(buyer.some(action => action.id === id), id);
  assert.ok(!actions(facts, "Buyer", "SPA").some(action => action.id === "D14"));
  assert.ok(actions(facts, "Buyer", "APA").some(action => action.id === "D14"));
});

test("rendered actions match the selected structure and show their priorities", () => {
  context.answers = { "debt-obligations": "Yes — finance obligations or security exist", "debt-transaction-effect": "None — no repayment, consent or waiver required" };
  side = "Seller";
  context.renderLogic(issue);
  assert.match(actionSection.innerHTML, /data-action-id="D12"/);
  assert.match(actionSection.innerHTML, /data-level="required"/);
  assert.doesNotMatch(actionSection.innerHTML, /data-action-id="D14"/);
  clickHandler({ target: { closest: selector => selector === "[data-debt-structure]" ? { dataset: { debtStructure: "APA" } } : null } });
  assert.match(actionSection.innerHTML, /data-action-id="D14"/);
});
