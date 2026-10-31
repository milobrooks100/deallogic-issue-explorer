import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../dist/share-ownership.js", import.meta.url), "utf8");
const context = vm.createContext({
  current: () => ({ id: "other-issue" }), riskScore: () => 99,
  renderPanel: () => {}, renderLogic: () => {}, exportReport: () => {}
});
vm.runInContext(source.replace(/\}\)\(\);\s*$/, "globalThis.riskTest = { assessRisk, fields }; })();"), context);
const assess = answers => context.riskTest.assessRisk(answers);
const clean = {
  "share-ownership-verified": "verified", "share-seller-participation": "all-agreed",
  "share-transfer-restrictions": "no", "share-security-exists": "no"
};

test("untouched is not assessed; incomplete or unchecked responses are provisional", () => {
  assert.equal(assess({}).score, null);
  assert.equal(assess({ "share-ownership-verified": "verified" }).score, 2);
  assert.equal(assess({ "share-ownership-verified": "verified" }).provisional, true);
  assert.equal(assess(clean).score, 1);
  assert.equal(assess(clean).provisional, false);
  assert.equal(assess({ ...clean, "share-ownership-verified": "unchecked" }).provisional, true);
});

test("each answer establishes its agreed floor against otherwise clean facts", () => {
  const cases = [
    ["share-ownership-verified", "evidence-gaps", 2],
    ["share-ownership-verified", "disputed", 4],
    ["share-ownership-verified", "unchecked", 2],
    ["share-seller-participation", "some-undecided", 3],
    ["share-seller-participation", "some-refusing", 4],
    ["share-seller-participation", "unchecked", 2],
    ["share-transfer-restrictions", "yes", 3],
    ["share-transfer-restrictions", "partly-unclear", 3],
    ["share-transfer-restrictions", "unchecked", 2],
    ["share-security-exists", "yes", 3],
    ["share-security-exists", "unclear", 3],
    ["share-security-exists", "unchecked", 2]
  ];
  for (const [id, answer, expected] of cases) assert.equal(assess({ ...clean, [id]: answer }).score, expected, `${id}: ${answer}`);
  for (const [answer, expected] of [["all-addressed", 1], ["some-outstanding", 3], ["not-addressed", 3], ["unclear", 3]]) {
    assert.equal(assess({ ...clean, "share-transfer-restrictions": "yes", "share-restrictions-addressed": answer }).score, expected);
  }
  for (const [answer, expected] of [["release-agreed", 2], ["discussions-ongoing", 3], ["release-refused", 5], ["unclear", 3]]) {
    assert.equal(assess({ ...clean, "share-security-exists": "yes", "share-security-release": answer }).score, expected);
  }
});

test("uncertain restrictions remain medium even if the follow-up says all addressed", () => {
  const result = assess({ ...clean, "share-transfer-restrictions": "partly-unclear", "share-restrictions-addressed": "all-addressed" });
  assert.equal(result.score, 3);
  assert.equal(result.provisional, true);
});

test("three medium components increase the result once, capped at high", () => {
  const pending = { ...clean, "share-seller-participation": "some-undecided", "share-transfer-restrictions": "yes", "share-restrictions-addressed": "some-outstanding" };
  assert.equal(assess(pending).score, 3);
  assert.equal(assess({ ...pending, "share-security-exists": "yes", "share-security-release": "discussions-ongoing" }).score, 4);
  assert.equal(assess({ ...pending, "share-ownership-verified": "disputed" }).score, 4);
  assert.equal(assess({ ...pending, "share-seller-participation": "some-refusing" }).score, 4);
});

test("cures recalculate the result without cancelling another component's floor", () => {
  const blocked = { ...clean, "share-ownership-verified": "disputed", "share-security-exists": "yes", "share-security-release": "release-refused" };
  assert.equal(assess(blocked).score, 5);
  assert.equal(assess({ ...blocked, "share-ownership-verified": "verified" }).score, 5);
  assert.equal(assess({ ...blocked, "share-security-release": "release-agreed" }).score, 4);
  assert.equal(assess({ ...blocked, "share-security-release": "release-agreed", "share-ownership-verified": "verified" }).score, 2);
});

test("hidden follow-ups never affect the assessment", () => {
  const result = assess({ ...clean, "share-restrictions-addressed": "not-addressed", "share-security-release": "release-refused" });
  assert.equal(result.score, 1);
  assert.equal(result.provisional, false);
  assert.equal(assess({ "share-security-release": "release-refused" }).score, null);
});

test("all answer permutations stay in range and only a visible refused release produces five", () => {
  const entries = Object.entries(context.riskTest.fields);
  let checked = 0;
  const responses = {};
  const visit = index => {
    if (index < entries.length) {
      const [id, field] = entries[index];
      for (const value of ["", ...field.options.map(([value]) => value)]) { responses[id] = value; visit(index + 1); }
      return;
    }
    const result = assess(responses);
    assert.ok(result.score === null || (Number.isInteger(result.score) && result.score >= 1 && result.score <= 5));
    assert.equal(result.score === 5, responses["share-security-exists"] === "yes" && responses["share-security-release"] === "release-refused");
    if (result.score === 1) {
      assert.equal(responses["share-ownership-verified"], "verified");
      assert.equal(responses["share-seller-participation"], "all-agreed");
      assert.equal(responses["share-security-exists"], "no");
      assert.ok(responses["share-transfer-restrictions"] === "no" || (responses["share-transfer-restrictions"] === "yes" && responses["share-restrictions-addressed"] === "all-addressed"));
    }
    checked++;
  };
  visit(0);
  assert.equal(checked, 15625);
});

test("other issues retain their existing risk implementation", () => {
  assert.equal(context.riskScore(), 99);
});
