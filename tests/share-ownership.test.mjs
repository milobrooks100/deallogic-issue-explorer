import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const read = path => readFile(new URL(path, import.meta.url), "utf8");
const [source, registrySource, issueSource, compiled, html, hubSource, css] = await Promise.all([
  read("../dist/share-ownership.js"), read("../dist/action-registry.js"), read("../lib/issues/share-ownership-transfer-restrictions.json"), read("../dist/issues.json"), read("../dist/index.html"), read("../dist/deal-hub-v8.js"), read("../dist/share-ownership.css")
]);
const issue = JSON.parse(issueSource);
const issues = JSON.parse(compiled);
const workspaceSource = await read("../dist/workspace-redesign.js");
let selectedIssue = issue, side = "Balanced", priorCalls = [], events = [], exportBlob;
const classes = new Set();
const card = { innerHTML: "", classList: { add: name => classes.add(name), toggle: (name, on) => on ? classes.add(name) : classes.delete(name) } };
const context = vm.createContext({
  window: {}, answers: {}, current: () => selectedIssue,
  riskScore: () => 77, renderPanel: () => priorCalls.push("panel"), renderLogic: () => priorCalls.push("logic"), exportReport: () => priorCalls.push("export"),
  getTransactionSide: () => side, riskNames: ["No risk", "Low risk", "Medium risk", "High risk", "Very high risk"],
  Blob, URL: { createObjectURL: blob => { exportBlob = blob; return "blob:test"; }, revokeObjectURL: () => {} },
  CustomEvent: class { constructor(type) { this.type = type; } },
  document: { querySelector: selector => selector === "#logic-card" ? card : null, dispatchEvent: event => events.push(event.type), createElement: () => ({ click() {} }) }
});
vm.runInContext(registrySource, context);
vm.runInContext(source, context);
const api = context.window.DealLogicShareOwnership;
const topic = context.window.DealLogicActionRegistry.byTopic.get(issue.id);
const choice = (id, state) => issue.key_questions.find(q => q.id === id).answer_options[state];
const input = ({ register = "clear", evidence = "clear", interests = ["none"], restrictions = ["none"], readiness = "ready" } = {}) => ({
  "share-register": choice("share-register", register), "share-evidence": choice("share-evidence", evidence),
  "share-interests": interests.map(state => choice("share-interests", state)), "share-restrictions": restrictions.map(state => choice("share-restrictions", state)), "share-readiness": choice("share-readiness", readiness)
});
const assess = (answers, perspective = "Balanced", definition = issue) => api.assess(answers, perspective, definition);
const ids = result => Array.from(result.actions, action => action.id);

test("new share-sale issue has exactly five questions, twelve actions and executable rules", () => {
  assert.equal(issue.key_questions.length, 5);
  assert.equal(new Set(issue.key_questions.map(q => q.id)).size, 5);
  assert.equal(issue.transaction_context.transaction_type, "share-sale");
  assert.equal(issue.category, "corporate-and-shares");
  assert.deepEqual(issues.find(item => item.id === issue.id), issue);
  assert.equal(topic.actions.length, 12);
  assert.equal(issue.recommended_actions.length, 12);
  for (const action of topic.actions) {
    assert.equal(issue.recommended_actions.find(item => item.id === action.id).recommendation, action.description);
    assert.ok(issue.decision_rules.some(rule => rule.then.action_ids.includes(action.id)));
    assert.match(css, new RegExp(`data-action-key="${action.id}"`));
    assert.ok(action.icon && action.phase);
  }
  const changed = structuredClone(issue);
  changed.decision_rules = changed.decision_rules.filter(rule => !rule.then.action_ids.includes("SO12"));
  assert.ok(!ids(assess(input({ register: "conflict" }), "Buyer", changed)).includes("SO12"));
});

test("the existing five playbooks and Option Holders remain separate", () => {
  assert.equal(issues.length, 6);
  const counts = { "customer-change-of-control": 9, "missing-ip-assignment": 11, "option-holders": 9, "threatened-litigation": 14, "debt-facilities-repayment": 14 };
  for (const [id, count] of Object.entries(counts)) assert.equal(context.window.DealLogicActionRegistry.byTopic.get(id).actions.length, count);
  assert.ok(!issue.key_questions.some(q => /option|allotment/i.test(q.question)));
  assert.ok(!topic.actions.some(a => /allot|ratif|option scheme|scheme tax/i.test(`${a.title} ${a.description}`)));
  assert.match(issue.notes, /Defective allotments are outside this issue/);
  assert.match(issue.notes, /Option Holders remains a separate issue/);
});

test("a verified clean position and a wholly unassessed position have different risk", () => {
  assert.equal(assess({}).risk, 2);
  assert.equal(assess({}).complete, false);
  const result = assess(input());
  assert.equal(result.risk, 1);
  assert.deepEqual(ids(result), ["SO10", "SO08"]);
  assert.equal(assess({ "share-register": choice("share-register", "unknown") }).risk, 3);
});

test("isolated missing certificates stay low risk and never generate a title indemnity or condition", () => {
  for (const readiness of ["ready", "pending", "unknown"]) {
    const result = assess(input({ evidence: "certificate", readiness }));
    assert.equal(result.risk, 2);
    assert.ok(ids(result).includes("SO02"));
    for (const id of ["SO03", "SO11", "SO12"]) assert.ok(!ids(result).includes(id), id);
    assert.match(result.summary, /gap alone does not establish invalid ownership/);
  }
});

test("missing other records creates uncertainty without asserting invalid title", () => {
  for (const changes of [{ register: "missing" }, { register: "incomplete" }, { evidence: "gaps" }, { evidence: "both" }]) {
    const result = assess(input(changes));
    assert.equal(result.risk, 3);
    assert.ok(ids(result).includes("SO01"));
    assert.ok(!ids(result).includes("SO03"));
    assert.ok(!ids(result).includes("SO12"));
    assert.match(result.implications.join(" "), /missing documents alone do not prove invalid ownership/i);
  }
});

test("conflicting records escalate despite a missing certificate or ready answer", () => {
  for (const changes of [{ register: "conflict", evidence: "certificate" }, { evidence: "conflict" }, { register: "conflict", evidence: "both" }]) {
    const result = assess(input(changes));
    assert.equal(result.risk, 4);
    for (const id of ["SO01", "SO03", "SO11", "SO12"]) assert.ok(ids(result).includes(id), id);
    assert.match(result.summary, /unresolved title evidence or transfer analysis still needs verification/);
    assert.doesNotMatch(result.summary, /All identified evidence and transfer steps are recorded as effective/);
    if (changes.evidence === "certificate") assert.match(result.summary, /evidence gap is separate from the recorded title conflict/);
  }
});

test("adverse claims and blocked completion steps are very high risk on every side", () => {
  for (const perspective of ["Buyer", "Seller", "Balanced"]) {
    assert.equal(assess(input({ interests: ["claim"] }), perspective).risk, 5);
    const blocked = assess(input({ restrictions: ["consent"], readiness: "blocked" }), perspective);
    assert.equal(blocked.risk, 5);
    assert.ok(ids(blocked).includes("SO06"));
    assert.ok(ids(blocked).includes("SO11"));
    assert.ok(!ids(blocked).includes("SO12"));
  }
});

test("overlapping nominees, representatives, security and transfer rights retain every relevant response", () => {
  const result = assess(input({ register: "conflict", evidence: "both", interests: ["nominee", "representative", "security", "claim"], restrictions: ["board", "preemption", "consent", "tagdrag", "other"], readiness: "blocked" }));
  assert.equal(result.actions.length, 12);
  assert.equal(new Set(ids(result)).size, 12);
  for (const text of ["nominee", "personal representative", "security", "adverse ownership claim", "board approval", "pre-emption", "shareholder or investor consent", "tag-along", "adherence"]) assert.ok(result.summary.includes(text), text);
  assert.ok(result.implications.length <= 3);
});

test("transfer requirements use documents and do not imply that every sale engages every right", () => {
  const preemption = assess(input({ restrictions: ["preemption"], readiness: "pending" }));
  assert.ok(ids(preemption).includes("SO06"));
  assert.ok(!ids(preemption).includes("SO07"));
  assert.match(preemption.implications.join(" "), /board approval alone cannot waive another holder's rights/);
  const drag = assess(input({ restrictions: ["tagdrag"], readiness: "pending" }));
  assert.ok(ids(drag).includes("SO07"));
  assert.match(drag.summary, /tag-along or drag-along/);
  const unknown = assess(input({ restrictions: ["unknown"] }));
  assert.equal(unknown.risk, 3);
  assert.ok(ids(unknown).includes("SO01"));
  assert.ok(!ids(unknown).includes("SO06"));
});

test("ready steps reduce execution risk and priority without concealing actual arrangements", () => {
  const pending = input({ interests: ["nominee", "security"], restrictions: ["consent", "tagdrag"], readiness: "pending" });
  const ready = { ...pending, "share-readiness": choice("share-readiness", "ready") };
  assert.equal(assess(pending).risk, 3);
  assert.equal(assess(ready).risk, 1);
  assert.ok(!ids(assess(ready)).includes("SO11"));
  for (const perspective of ["Buyer", "Seller", "Balanced"]) for (const id of ["SO04", "SO05", "SO06", "SO07"]) {
    assert.equal(assess(pending, perspective).actions.find(a => a.id === id).priority, "Required");
    assert.equal(assess(ready, perspective).actions.find(a => a.id === id).priority, "Recommended");
  }
});

test("negotiated SPA protection varies by perspective in both label and drafting instruction", () => {
  const facts = input({ register: "conflict", readiness: "pending" });
  const selected = perspective => assess(facts, perspective).actions.find(a => a.id === "SO12");
  assert.equal(selected("Buyer").priority, "Required");
  assert.equal(selected("Balanced").priority, "Recommended");
  assert.equal(selected("Seller").priority, "Consider");
  assert.match(selected("Seller").description, /cap, duration and claim conduct/);
  assert.match(selected("Balanced").description, /Avoid double recovery/);
  assert.notEqual(selected("Buyer").description, selected("Seller").description);
});

test("multi-select exclusive answers and stale values cannot suppress an adverse claim", () => {
  let answers = input();
  answers = api.updateAnswer(answers, issue, "share-interests", "nominee", true);
  assert.deepEqual(Array.from(api.readAnswers(answers, issue)["share-interests"]), ["nominee"]);
  assert.equal(answers["share-readiness"], undefined);
  answers = api.updateAnswer(answers, issue, "share-interests", "security", true);
  assert.deepEqual(Array.from(api.readAnswers(answers, issue)["share-interests"]), ["nominee", "security"]);
  answers = api.updateAnswer(answers, issue, "share-interests", "unknown", true);
  assert.deepEqual(Array.from(api.readAnswers(answers, issue)["share-interests"]), ["unknown"]);
  const stale = input(); stale["share-interests"].push(choice("share-interests", "claim"));
  assert.equal(assess(stale).risk, 5);
  const obsolete = input(); obsolete["share-restrictions"] = ["obsolete option"];
  assert.equal(assess(obsolete).risk, 3);
  assert.match(assess(obsolete).summary, /not yet been cleared/);
});

test("changing any factual answer clears earlier readiness but changing readiness preserves facts", () => {
  const original = input();
  const updated = api.updateAnswer(original, issue, "share-register", choice("share-register", "conflict"));
  assert.equal(updated["share-readiness"], undefined);
  assert.equal(original["share-readiness"], choice("share-readiness", "ready"));
  const ready = api.updateAnswer(updated, issue, "share-readiness", choice("share-readiness", "ready"));
  assert.equal(assess(ready).risk, 4);
});

test("all single-question choices and overlapping interests produce readable bounded output on all sides", () => {
  const profiles = [{}];
  for (const question of issue.key_questions) for (const label of Object.values(question.answer_options)) profiles.push({ ...input(), [question.id]: question.multiple ? [label] : label });
  const subsets = keys => Array.from({ length: 2 ** keys.length - 1 }, (_, i) => keys.filter((_, bit) => (i + 1) & (1 << bit)));
  for (const interests of subsets(["nominee", "representative", "security", "claim"])) for (const restrictions of subsets(["board", "preemption", "consent", "tagdrag", "other"])) {
    for (const evidence of ["clear", "certificate", "both", "conflict"]) for (const readiness of ["ready", "pending", "blocked", "unknown"]) profiles.push(input({ interests, restrictions, evidence, readiness }));
  }
  for (const facts of profiles) for (const perspective of ["Buyer", "Seller", "Balanced"]) {
    const result = assess(facts, perspective);
    assert.ok(result.risk >= 1 && result.risk <= 5);
    assert.match(result.summary, /^[A-Z].*\.$/);
    assert.doesNotMatch(result.summary, /\b(?:undefined|null|Unanswered)\b/);
    assert.ok(result.implications.length > 0 && result.implications.length <= 3);
    assert.ok(result.actions.length > 0 && result.actions.length <= 12);
    assert.equal(new Set(ids(result)).size, result.actions.length);
    for (const action of result.actions) {
      assert.ok(["Required", "Recommended", "Consider"].includes(action.priority));
      assert.ok(topic.actions.some(item => item.id === action.id));
    }
  }
  assert.ok(profiles.length > 7400);
});

test("render waits for the five answers, then emits stable Hub IDs, icons and priorities", () => {
  events = [];
  context.answers = {};
  context.renderLogic(issue);
  assert.ok(classes.has("logic-standby"));
  assert.deepEqual(events, []);
  context.answers = input({ evidence: "certificate" });
  context.renderLogic(issue);
  assert.ok(!classes.has("logic-standby"));
  assert.match(card.innerHTML, /data-action-id="SO02" data-action-key="SO02"/);
  assert.match(card.innerHTML, /data-lucide="file-text"/);
  assert.match(card.innerHTML, /logic-conclusion/);
  assert.match(card.innerHTML, /data-level="recommended"/);
  assert.deepEqual(events, ["share-ownership-logic-rendered"]);
  assert.match(hubSource, /byTopic\.has\(issue.id\)/);
  assert.match(hubSource, /"share-ownership-logic-rendered",decorateRecommendations/);
  assert.match(hubSource, /iconKey:item.iconKey/);
  assert.match(hubSource, /dealPhase:item.phase \? libraryPhase\(item.phase\) : phaseFor/);
  assert.match(workspaceSource, /'lock-keyhole':'lockKeyhole'/);
  assert.ok(html.indexOf("./share-ownership.js") > html.indexOf("./debt-facilities.js"));
  assert.ok(html.indexOf("./share-ownership.js") < html.indexOf("./action-playbooks.js"));
});

test("downloaded report contains current answers, risk, summary, side, actions and legal sources", async () => {
  side = "Seller";
  context.answers = input({ register: "conflict", evidence: "certificate" });
  context.exportReport();
  const text = await exportBlob.text();
  assert.match(text, /Perspective: Seller/);
  assert.match(text, /Risk score: 4\/5/);
  assert.match(text, /Share certificates are also missing/);
  assert.match(text, /Consider: Targeted title indemnity/);
  assert.match(text, /https:\/\/www.legislation.gov.uk/);
  assert.match(text, /Defective allotments are outside this issue/);
});

test("risk, rendering and export delegate unchanged for existing issues", () => {
  selectedIssue = issues.find(item => item.id === "option-holders");
  priorCalls = [];
  assert.equal(context.riskScore(), 77);
  context.renderPanel(); context.renderLogic(selectedIssue); context.exportReport();
  assert.deepEqual(priorCalls, ["panel", "logic", "export"]);
  selectedIssue = issue;
});
