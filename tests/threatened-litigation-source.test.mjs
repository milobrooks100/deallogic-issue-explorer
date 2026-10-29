import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
