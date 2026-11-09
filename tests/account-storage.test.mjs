import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../dist/app-storage.js", import.meta.url), "utf8");

function makeStorage() {
  const entries = new Map();
  return {
    get length() { return entries.size; },
    key(index) { return [...entries.keys()][index] ?? null; },
    getItem(key) { return entries.has(key) ? entries.get(key) : null; },
    setItem(key, value) { entries.set(key, String(value)); },
    removeItem(key) { entries.delete(key); }
  };
}

test("guest and verified account data stay separate on the same browser", () => {
  const window = { localStorage: makeStorage() };
  vm.runInNewContext(source, { window });
  const saved = window.DealLogicStorage;
  saved.setItem("deallogic:deal-projects:v1", "guest deal");

  saved.setAccount("alice");
  assert.equal(saved.getItem("deallogic:deal-projects:v1"), null);
  saved.setItem("deallogic:deal-projects:v1", "alice deal");

  saved.setAccount("bob");
  assert.equal(saved.getItem("deallogic:deal-projects:v1"), null);
  saved.setItem("deallogic:deal-projects:v1", "bob deal");
  assert.deepEqual(Array.from(saved.pendingKeys("bob")), ["deallogic:deal-projects:v1"]);

  saved.setAccount("alice");
  assert.equal(saved.getItem("deallogic:deal-projects:v1"), "alice deal");
  saved.clearAccountCache("alice");
  assert.equal(saved.getItem("deallogic:deal-projects:v1"), null);

  saved.setAccount(null);
  assert.equal(saved.getItem("deallogic:deal-projects:v1"), "guest deal");
});

test("cloud hydration preserves local edits awaiting sync", () => {
  const window = { localStorage: makeStorage() };
  vm.runInNewContext(source, { window });
  const saved = window.DealLogicStorage;
  saved.setAccount("alice");
  saved.setItem("deallogic:deal-projects:v1", "unsynced local edit");
  saved.applyCloud("alice", [["deallogic:deal-projects:v1", "older cloud edit"], ["deallogic:app-theme", "grey"]]);
  assert.equal(saved.getItem("deallogic:deal-projects:v1"), "unsynced local edit");
  assert.equal(saved.getItem("deallogic:app-theme"), "grey");
});

test("account cleanup removes settings, deals, answers and pending writes without touching another account", () => {
  const window = { localStorage: makeStorage() };
  vm.runInNewContext(source, { window });
  const saved = window.DealLogicStorage;
  saved.setAccount("bob");
  saved.setItem("deallogic:deal-projects:v1", "bob deal");
  saved.setAccount("alice");
  for (const key of ["deallogic:deal-projects:v1", "deallogic:app-theme", "deallogic:account-avatar", "deallogic:answers:issue"]) saved.setItem(key, "saved data");
  saved.freezeAccount("alice");
  saved.clearAccountCache("alice");
  saved.setItem("deallogic:deal-projects:v1", "late stale save");
  assert.equal(saved.accountEntries("alice").length, 0);
  assert.equal(saved.pendingKeys("alice").length, 0);
  assert.equal(saved.activeUid(), "alice");
  saved.setAccount("bob");
  assert.equal(saved.getItem("deallogic:deal-projects:v1"), "bob deal");
});

test("deal deletion removes all issue keys only for the exact deal and keeps the original sync baseline after reload", () => {
  const window = { localStorage: makeStorage() };
  vm.runInNewContext(source, { window });
  let saved = window.DealLogicStorage;
  const ip = "deallogic:deal-project:a:issue:ip";
  const finance = "deallogic:deal-project:a:issue:finance";
  const other = "deallogic:deal-project:a-other:issue:ip";
  saved.setItem(ip, "guest answer");
  saved.setAccount("alice");
  saved.applyCloud("alice", [[ip, "original"], [finance, "finance"], [other, "other"]]);
  saved.setItem(ip, "pending edit");
  saved.removeDealAnswers("a");
  vm.runInNewContext(source, { window });
  saved = window.DealLogicStorage;
  assert.equal(saved.getItem(ip), null);
  assert.equal(saved.getItem(finance), null);
  assert.equal(saved.getItem(other), "other");
  assert.equal(saved.baseline("alice", ip), "original");
  assert.deepEqual(Array.from(saved.pendingKeys("alice")), [ip, finance]);
  saved.setAccount(null);
  assert.equal(saved.getItem(ip), "guest answer");
  assert.ok(!saved.guestEntries().some(([key]) => key.startsWith("deallogic:sync-base:")));
});
