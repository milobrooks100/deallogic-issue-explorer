import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createAccountBackup } from "../dist/account-backup.js";

const sandbox = { window: {} };
for (const file of ["action-recovery.js", "risk-legend.js"]) vm.runInNewContext(readFileSync(new URL(`../dist/${file}`, import.meta.url), "utf8"), sandbox);
const recovery = sandbox.window.DealLogicActionRecovery;
const plain = value => JSON.parse(JSON.stringify(value));

test("undo restores full action details, its position and a pruned Company Radar issue", () => {
  const action = { id: "a", issueId: "company-radar:1", title: "Review", status: "In Negotiation", notes: "Keep this note", urgency: "High", sourceKey: "radar-1" };
  const hub = { actions: [action, { id: "b", issueId: "other" }], issues: [{ id: "company-radar:1", summary: "Register detail", risk: "3/5 · Medium risk" }, { id: "other" }] };
  const before = structuredClone(hub);
  const record = recovery.removeHubAction(hub, "a");
  assert.equal(hub.actions.length, 1);
  assert.equal(hub.issues.length, 1);
  assert.equal(recovery.restoreHubAction(hub, record), true);
  assert.deepEqual(plain(hub.actions), before.actions);
  assert.deepEqual(plain(hub.issues), before.issues);
  assert.deepEqual(plain(hub.issues.find(issue => issue.id === "company-radar:1")), before.issues[0]);
});

test("undo leaves later edits intact and never duplicates an action that was re-added", () => {
  const hub = { actions: [{ id: "a", issueId: "issue", stableActionId: "check" }, { id: "b", notes: "old" }], issues: [{ id: "issue" }] };
  const record = recovery.removeHubAction(hub, "a");
  hub.actions[0].notes = "new edit";
  hub.actions.push({ id: "replacement", issueId: "issue", stableActionId: "check" });
  assert.equal(recovery.restoreHubAction(hub, record), false);
  assert.equal(hub.actions[0].notes, "new edit");
  assert.equal(hub.actions.length, 2);
});

test("consecutive action deletions can be undone in reverse order", () => {
  const hub = { actions: [{ id: "a" }, { id: "b" }, { id: "c" }], issues: [] };
  const first = recovery.removeHubAction(hub, "a");
  const second = recovery.removeHubAction(hub, "b");
  recovery.restoreHubAction(hub, second);
  recovery.restoreHubAction(hub, first);
  assert.deepEqual(hub.actions.map(action => action.id), ["a", "b", "c"]);
  assert.equal(recovery.removeHubAction(hub, "missing"), null);
});

test("backup merges cloud data with pending local creates, edits and deletions losslessly", () => {
  const backup = createAccountBackup({
    user: { uid: "alice", email: "alice@example.test", accessToken: "must-not-export" },
    cloudEntries: [["deallogic:deal-projects:v1", "old cloud"], ["deallogic:app-theme", "navy"], ["deallogic:deleted", "old"], ["deallogic:remote-only", '{"title":"Another device"}']],
    localEntries: [["deallogic:deal-projects:v1", '{"title":"Local edit"}'], ["deallogic:account-avatar", '{"index":2}'], ["deallogic:app-theme", "grey"]],
    pendingKeys: ["deallogic:deal-projects:v1", "deallogic:account-avatar", "deallogic:deleted"],
    exportedAt: "2026-10-28T19:00:00.000Z"
  });
  const state = new Map(backup.state.map(({ key, value }) => [key, value]));
  assert.equal(state.get("deallogic:deal-projects:v1"), '{"title":"Local edit"}');
  assert.equal(state.get("deallogic:app-theme"), "navy");
  assert.equal(state.get("deallogic:account-avatar"), '{"index":2}');
  assert.equal(state.has("deallogic:deleted"), false);
  assert.equal(state.get("deallogic:remote-only"), '{"title":"Another device"}');
  assert.equal(backup.version, 1);
  assert.equal(JSON.stringify(backup).includes("must-not-export"), false);
  assert.deepEqual(JSON.parse(JSON.stringify(backup)), backup);
});

test("backup excludes session markers, other account caches and non-workspace keys", () => {
  const backup = createAccountBackup({ user: { uid: "alice" }, cloudEntries: [["firebase:authUser", "token"], ["deallogic:account:bob:deallogic:projects", "other user"], ["deallogic:last-account-uid", "bob"]], localEntries: [], pendingKeys: [] });
  assert.equal(backup.state.length, 0);
  assert.throws(() => createAccountBackup({ user: null }), /Sign in/);
});

test("risk legend labels all five levels in both inline and expandable forms", () => {
  const legend = sandbox.window.DealLogicRiskLegend;
  for (const expanded of [false, true]) {
    const html = legend.markup(expanded);
    for (const [index, label] of legend.levels.entries()) assert.ok(html.includes(`${index + 1}/5 · ${label}`));
    assert.equal((html.match(/aria-hidden="true"/g) || []).length, 5);
  }
  assert.match(legend.markup(true), /<summary>Risk colour guide<\/summary>/);
});
