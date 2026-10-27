import test from "node:test";
import assert from "node:assert/strict";
import { prepareBrowserProgressImport } from "../dist/browser-progress-import.js";

const project = (id, name, extras = {}) => ({ id, name, side: "Balanced", isQuick: id === "quick-workspace", hub: { issues: [], actions: [], groups: [] }, ...extras });
const store = projects => JSON.stringify({ version: 1, activeProjectId: projects[0].id, projects });

test("imports browser deals and quick-workspace answers without replacing account data", () => {
  const account = store([project("quick-workspace", "Quick workspace"), project("existing", "Important deal", { hub: { issues: [], actions: [{ id: "saved" }], groups: [] } })]);
  const guest = [
    ["deallogic:deal-projects:v1", store([project("quick-workspace", "Quick workspace"), project("guest-deal", "Acquisition", { hub: { issues: [], actions: [{ id: "guest-action" }], groups: [] } })])],
    ["deallogic:deal-project:quick-workspace:issue:debt", '{"answer":"yes"}'],
    ["deallogic:deal-project:guest-deal:issue:ip", '{"answer":"no"}'],
    ["deallogic:app-theme", "green"],
    ["deallogic:account-avatar", '{"kind":"preset","index":2}']
  ];
  let next = 0;
  const plan = prepareBrowserProgressImport(guest, account, () => `import-${++next}`);
  const writes = new Map(plan.writes);
  const merged = JSON.parse(writes.get("deallogic:deal-projects:v1"));
  assert.equal(plan.count, 2);
  assert.equal(merged.activeProjectId, "quick-workspace");
  assert.deepEqual(merged.projects.slice(0, 2), JSON.parse(account).projects);
  assert.equal(merged.projects[2].name, "Imported quick workspace");
  assert.equal(merged.projects[2].isQuick, false);
  assert.equal(merged.projects[3].name, "Acquisition");
  assert.equal(merged.projects[3].hub.actions[0].id, "guest-action");
  assert.equal(writes.get("deallogic:deal-project:import-1:issue:debt"), '{"answer":"yes"}');
  assert.equal(writes.get("deallogic:deal-project:import-2:issue:ip"), '{"answer":"no"}');
  assert.equal(writes.has("deallogic:app-theme"), false);
  assert.equal(writes.has("deallogic:account-avatar"), false);
});

test("empty browser work creates no deal or account writes", () => {
  const guest = [["deallogic:deal-projects:v1", store([project("quick-workspace", "Quick workspace")])]];
  assert.deepEqual(prepareBrowserProgressImport(guest, null, () => "unused"), { count: 0, writes: [] });
});

test("invalid account progress cannot be overwritten", () => {
  const guest = [["deallogic:deal-projects:v1", store([project("quick-workspace", "Quick workspace", { hub: { issues: [{ id: "one" }], actions: [], groups: [] } })])]];
  assert.throws(() => prepareBrowserProgressImport(guest, "not json", () => "new"), /Account deal progress/);
});
