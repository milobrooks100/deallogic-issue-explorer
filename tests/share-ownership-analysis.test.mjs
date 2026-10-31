import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../dist/share-ownership.js", import.meta.url), "utf8");
const registrySource = await readFile(new URL("../dist/action-registry.js", import.meta.url), "utf8");
const registryContext = vm.createContext({ window: {} });
vm.runInContext(registrySource, registryContext);
const classes = new Set();
const card = { innerHTML: "", classList: {
  add: value => classes.add(value),
  toggle: (value, active) => active ? classes.add(value) : classes.delete(value)
} };
const context = vm.createContext({
  window: registryContext.window, getTransactionSide: () => "Balanced",
  CustomEvent: class { constructor(type) { this.type = type; } },
  answers: {}, current: () => ({ id: "share-ownership-and-transfer-restrictions" }),
  riskScore: () => 1, renderPanel: () => {}, exportReport: () => {},
  renderLogic: () => { card.innerHTML = "Other issue"; },
  document: { dispatchEvent: () => {}, querySelector: selector => selector === "#logic-card" ? card : null }
});
vm.runInContext(source.replace(/\}\)\(\);\s*$/, "globalThis.analysisTest = { buildAnalysis, fields, visibleIds }; })();"), context);
const { buildAnalysis, fields, visibleIds } = context.analysisTest;
const clean = {
  "share-ownership-verified": "verified", "share-seller-participation": "all-agreed",
  "share-transfer-restrictions": "no", "share-security-exists": "no"
};

test("analysis waits for every applicable answer, including follow-ups", () => {
  assert.equal(buildAnalysis({}), null);
  assert.equal(buildAnalysis({ "share-ownership-verified": "disputed" }), null);
  assert.equal(buildAnalysis({ ...clean, "share-transfer-restrictions": "yes" }), null);
  assert.equal(buildAnalysis({ ...clean, "share-transfer-restrictions": "partly-unclear" }), null);
  assert.equal(buildAnalysis({ ...clean, "share-security-exists": "yes" }), null);
  assert.equal(buildAnalysis({ ...clean, "share-ownership-verified": "invalid", "share-security-release": "release-refused" }), null);
});

test("a clear position produces qualified prose and one concise implication", () => {
  const result = buildAnalysis(clean);
  assert.match(result.summary, /All sellers have verified ownership/);
  assert.match(result.summary, /All shareholders needed for the acquisition have agreed to sell/);
  assert.match(result.summary, /No restrictions/);
  assert.match(result.summary, /No security/);
  assert.equal(result.implications.length, 1);
  assert.match(result.implications[0], /currently indicated by the recorded answers/);
  assert.doesNotMatch(result.summary, /binding|guaranteed|risk-free/);
});

test("all adverse themes remain represented within three implications", () => {
  const result = buildAnalysis({ ...clean,
    "share-ownership-verified": "disputed", "share-seller-participation": "some-refusing",
    "share-transfer-restrictions": "yes", "share-restrictions-addressed": "not-addressed",
    "share-security-exists": "yes", "share-security-release": "release-refused"
  });
  assert.match(result.summary, /ownership dispute/);
  assert.match(result.summary, /refusing to sell/);
  assert.match(result.summary, /restrictions have not yet been addressed/);
  assert.match(result.summary, /release has been refused/);
  assert.equal(result.implications.length, 3);
  assert.match(result.implications[0], /ownership dispute/);
  assert.match(result.implications[1], /shareholder refusal.*transfer requirements/);
  assert.match(result.implications[2], /potential completion blocker/);
});

test("unclear and unchecked answers never become positive conclusions", () => {
  const result = buildAnalysis({
    "share-ownership-verified": "unchecked", "share-seller-participation": "unchecked",
    "share-transfer-restrictions": "partly-unclear", "share-restrictions-addressed": "all-addressed",
    "share-security-exists": "unclear"
  });
  assert.match(result.summary, /ownership.*has not yet been checked/);
  assert.match(result.summary, /scope.*remains unclear.*recorded as addressed/);
  assert.match(result.summary, /unclear whether there is security/);
  assert.equal(result.implications.length, 3);
  assert.doesNotMatch(result.summary, /All sellers have verified|No restrictions|No security/);
});

test("agreed releases remain future completion steps and old hidden answers are ignored", () => {
  const result = buildAnalysis({ ...clean, "share-security-exists": "yes", "share-security-release": "release-agreed" });
  assert.match(result.summary, /release arrangements agreed for completion/);
  assert.doesNotMatch(result.summary, /security has been released|shares are free/);
  assert.match(result.implications[0], /effective release of security/);
  const hidden = buildAnalysis({ ...clean, "share-restrictions-addressed": "not-addressed", "share-security-release": "release-refused" });
  assert.equal(hidden.summary, buildAnalysis(clean).summary);
  assert.deepEqual(Array.from(hidden.implications), Array.from(buildAnalysis(clean).implications));
});

test("summary changes with the facts while implications remain stable within an outcome family", () => {
  const gaps = buildAnalysis({ ...clean, "share-ownership-verified": "evidence-gaps" });
  const unchecked = buildAnalysis({ ...clean, "share-ownership-verified": "unchecked" });
  assert.notEqual(gaps.summary, unchecked.summary);
  assert.deepEqual(Array.from(gaps.implications), Array.from(unchecked.implications));
  const pending = { ...clean, "share-transfer-restrictions": "yes" };
  assert.notEqual(buildAnalysis({ ...pending, "share-restrictions-addressed": "some-outstanding" }).summary,
    buildAnalysis({ ...pending, "share-restrictions-addressed": "not-addressed" }).summary);
  assert.deepEqual(Array.from(buildAnalysis({ ...pending, "share-restrictions-addressed": "some-outstanding" }).implications),
    Array.from(buildAnalysis({ ...pending, "share-restrictions-addressed": "not-addressed" }).implications));
});

test("every answer permutation has a consistent completion gate and bounded readable output", () => {
  const entries = Object.entries(fields);
  const responses = {};
  let checked = 0, completed = 0;
  const visit = index => {
    if (index < entries.length) {
      const [id, field] = entries[index];
      for (const value of ["", ...field.options.map(([value]) => value)]) { responses[id] = value; visit(index + 1); }
      return;
    }
    const result = buildAnalysis(responses);
    const complete = visibleIds(responses).every(id => fields[id].options.some(([value]) => value === responses[id]));
    assert.equal(result !== null, complete);
    if (result) {
      assert.ok(result.summary.split(/\s+/).length <= 110);
      assert.equal(result.summary.split(/(?<=\.)\s+/).length, 4);
      assert.match(result.summary, /^[A-Z].*\.$/);
      assert.doesNotMatch(result.summary, /undefined|null|Unanswered|share-[a-z-]+/);
      assert.ok(result.implications.length >= 1 && result.implications.length <= 3);
      assert.equal(new Set(result.implications).size, result.implications.length);
      for (const implication of result.implications) {
        assert.ok(implication.split(/\s+/).length <= 30);
        assert.match(implication, /^[A-Z].*\.$/);
      }
      completed++;
    }
    checked++;
  };
  visit(0);
  assert.equal(checked, 15625);
  assert.equal(completed, 5472);
});

test("renderer shows standby until complete, and replaces analysis after answers are cleared", () => {
  const issue = context.current();
  context.answers = {};
  context.renderLogic(issue);
  assert.match(card.innerHTML, /Answer all relevant questions/);
  assert.equal(classes.has("logic-standby"), true);
  context.answers = clean;
  context.renderLogic(issue);
  assert.match(card.innerHTML, /<h4>Summary<\/h4>/);
  assert.match(card.innerHTML, /<h4>Key deal implications<\/h4>/);
  assert.match(card.innerHTML, /Recommended actions/);
  assert.doesNotMatch(card.innerHTML, /<h4>Notes/);
  assert.equal(classes.has("logic-standby"), false);
  context.answers = { ...clean, "share-seller-participation": "" };
  context.renderLogic(issue);
  assert.doesNotMatch(card.innerHTML, /logic-conclusion/);
  assert.equal(classes.has("logic-standby"), true);
  context.renderLogic({ id: "option-holders" });
  assert.equal(card.innerHTML, "Other issue");
});
