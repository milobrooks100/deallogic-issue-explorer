import test from "node:test";
import assert from "node:assert/strict";
import { DealSyncConflict, projectStoreKey, syncDealState } from "../dist/account-deal-sync.js";

const projects = (...ids) => JSON.stringify({ projects: ids.map(id => ({ id })) });
const issue = (id, issueId = "ip") => `deallogic:deal-project:${id}:issue:${issueId}`;

function backend(entries) {
  const data = new Map(entries);
  const firestore = {
    serverTimestamp: () => 1,
    getDocsFromServer: async () => ({ docs: [...data].map(([key]) => ({ data: () => ({ key }) })) }),
    async runTransaction(_db, change) {
      const writes = [];
      await change({
        get: async ref => ({ data: () => data.has(ref) ? { value: data.get(ref) } : undefined }),
        set: (ref, item) => writes.push(() => data.set(ref, item.value)),
        delete: ref => writes.push(() => data.delete(ref))
      });
      writes.forEach(commit => commit());
    }
  };
  return { data, sync: options => syncDealState({ firestore, doc: key => key, ...options }) };
}

test("deletion clears local and server-only answers, and stale devices cannot restore a deleted deal or its answers", async () => {
  const before = projects("quick-workspace", "deal", "deal-2");
  const after = projects("quick-workspace", "deal-2");
  const { data, sync } = backend([[projectStoreKey, before], [issue("deal"), "local"], [issue("deal", "legacy"), "only on server"], [issue("deal-2"), "keep"]]);
  await sync({ key: projectStoreKey, baseline: before, value: after, issueIds: ["ip", "employment"] });
  assert.deepEqual([...data], [[projectStoreKey, after], [issue("deal-2"), "keep"]]);
  await assert.rejects(sync({ key: projectStoreKey, baseline: before, value: projects("quick-workspace", "deal", "deal-2", "new") }), DealSyncConflict);
  await assert.rejects(sync({ key: issue("deal", "employment"), baseline: null, value: "stale write" }), DealSyncConflict);
  assert.equal(data.get(projectStoreKey), after);
});

test("sync rejects an older edit and accepts retrying a write already committed", async () => {
  const key = issue("quick-workspace");
  const { data, sync } = backend([[key, "first"]]);
  await sync({ key, baseline: "first", value: "latest" });
  await sync({ key, baseline: "first", value: "latest" });
  await assert.rejects(sync({ key, baseline: "first", value: "stale" }), DealSyncConflict);
  assert.equal(data.get(key), "latest");
});
