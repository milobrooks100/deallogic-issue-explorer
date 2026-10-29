import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const issues = JSON.parse(await readFile(new URL("../dist/issues.json", import.meta.url), "utf8"));
const index = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const expectedIds = ["customer-change-of-control", "option-holders", "debt-facilities-repayment", "missing-ip-assignment", "threatened-litigation"];

test("every shipped issue contains only fields read by the current app", () => {
  assert.deepEqual(issues.map(issue => issue.id).sort(), expectedIds.sort());
  for (const issue of issues) {
    const allowed = ["id", "title", "category", "summary", "jurisdiction", "key_questions"];
    if (issue.id === "threatened-litigation") allowed.push("recommended_actions");
    if (issue.id === "debt-facilities-repayment") allowed.push("notes");
    assert.deepEqual(Object.keys(issue).sort(), allowed.sort(), issue.id);
    assert.ok(issue.key_questions.length > 0, issue.id);
    assert.equal(new Set(issue.key_questions.map(question => question.id)).size, issue.key_questions.length, issue.id);
    for (const question of issue.key_questions) assert.deepEqual(Object.keys(question).sort(), ["id", "question"]);
  }
});

test("option holder and IP question data matches the live form", () => {
  const optionQuestions = JSON.parse(index.match(/const optionHolderQuestions = (\[[\s\S]*?\]);/)[1]);
  assert.deepEqual(issues.find(issue => issue.id === "option-holders").key_questions.map(question => question.question), optionQuestions);
  const ipMarkup = index.slice(index.indexOf("const missingIpAssignmentMarkup"), index.indexOf("const renderPanelWithMissingIpAssignment"));
  const ipPairs = [...ipMarkup.matchAll(/ipQuestion\("([^"]+)",\s*"([^"]+)"/g)].map(match => [match[1], match[2]]);
  assert.deepEqual(issues.find(issue => issue.id === "missing-ip-assignment").key_questions.map(question => [question.id, question.question]), ipPairs);
});
