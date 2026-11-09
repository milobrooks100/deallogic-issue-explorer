export const projectStoreKey = "deallogic:deal-projects:v1";
const issueKeyPattern = /^deallogic:deal-project:([^:]+):issue:/;
const projectIds = value => new Set(value === null ? ["quick-workspace"] : JSON.parse(value).projects.map(project => project.id));

export class DealSyncConflict extends Error {}

export async function syncDealState({ firestore, db, collection, doc, key, baseline, value, issueIds = [] }) {
  const dealId = issueKeyPattern.exec(key)?.[1];
  if (key !== projectStoreKey && !dealId) return false;
  const read = async (transaction, ref) => (await transaction.get(ref)).data()?.value ?? null;
  const target = doc(key);
  const answerKeys = new Set();
  if (key === projectStoreKey && typeof baseline === "string") {
    const remaining = projectIds(value);
    const deleted = new Set([...projectIds(baseline)].filter(id => !remaining.has(id)));
    if (deleted.size) {
      // Include known issue keys even when they do not exist yet, and older
      // keys from the server that this browser might never have loaded.
      for (const id of deleted) {
        for (const issueId of issueIds) answerKeys.add(`deallogic:deal-project:${id}:issue:${issueId}`);
      }
      const snapshot = await firestore.getDocsFromServer(collection);
      for (const item of snapshot.docs) {
        const candidate = item.data().key;
        if (deleted.has(issueKeyPattern.exec(candidate)?.[1])) answerKeys.add(candidate);
      }
    }
  }

  await firestore.runTransaction(db, async transaction => {
    const current = await read(transaction, target);
    if (dealId && value !== null) {
      const projects = await read(transaction, doc(projectStoreKey));
      if (!projectIds(projects).has(dealId)) throw new DealSyncConflict("This deal was deleted on another device.");
    }
    if (current === value) return; // A previous attempt may have committed before losing its connection.
    if (current !== baseline) throw new DealSyncConflict("Deal progress changed on another device.");
    if (value === null) transaction.delete(target);
    else transaction.set(target, { key, value, updatedAt: firestore.serverTimestamp() });
    // Commit the list and its answer removals together. Concurrent answer
    // transactions read the list, so they cannot commit after the deletion.
    for (const answerKey of answerKeys) transaction.delete(doc(answerKey));
  });
  return true;
}
