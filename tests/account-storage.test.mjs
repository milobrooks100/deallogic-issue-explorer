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
