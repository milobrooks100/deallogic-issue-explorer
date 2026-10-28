(() => {
  const clone = value => JSON.parse(JSON.stringify(value));
  function removeHubAction(hub, id) {
    const index = hub.actions.findIndex(action => action.id === id);
    if (index < 0) return null;
    const action = clone(hub.actions[index]);
    const issue = hub.issues.find(item => item.id === action.issueId);
    const record = { action, index, issue: issue ? clone(issue) : null, issueIndex: issue ? hub.issues.indexOf(issue) : -1 };
    hub.actions.splice(index, 1);
    hub.issues = hub.issues.filter(item => !String(item.id).startsWith("company-radar:") || hub.actions.some(action => action.issueId === item.id));
    return record;
  }
  function restoreHubAction(hub, record) {
    const action = record.action;
    if (hub.actions.some(item => item.id === action.id || (action.sourceKey && item.sourceKey === action.sourceKey) ||
      (action.stableActionId && item.issueId === action.issueId && item.stableActionId === action.stableActionId))) return false;
    if (record.issue && !hub.issues.some(issue => issue.id === record.issue.id)) hub.issues.splice(Math.max(0, Math.min(record.issueIndex, hub.issues.length)), 0, clone(record.issue));
    hub.actions.splice(Math.min(record.index, hub.actions.length), 0, clone(action));
    return true;
  }
  const records = [];
  let node;
  function offerUndo(message, restore) {
    const uid = window.DealLogicStorage.activeUid();
    if (records.length && records[0].uid !== uid) records.length = 0;
    records.push({ uid, restore });
    if (!node?.isConnected) {
      node = document.createElement("aside");
      node.className = "action-recovery";
      node.setAttribute("aria-label", "Action deletion recovery");
      node.innerHTML = '<span role="status" aria-live="polite" aria-atomic="true"></span><button type="button" data-undo-deletion>Undo deletion</button><button type="button" data-dismiss-undo aria-label="Dismiss undo notification">Dismiss</button>';
      document.body.append(node);
      node.querySelector("[data-dismiss-undo]").onclick = () => { records.length = 0; node.remove(); };
      node.querySelector("[data-undo-deletion]").onclick = () => {
        const record = records.pop();
        let result = "There is no deletion to undo.";
        if (record?.uid === window.DealLogicStorage.activeUid()) {
          try { result = record.restore(); }
          catch { records.push(record); result = "The action could not be restored. Please try again."; }
        } else records.length = 0;
        node.querySelector('[role="status"]').textContent = result + (records.length ? ` ${records.length} more deletion${records.length === 1 ? "" : "s"} can be undone.` : "");
        node.querySelector("[data-undo-deletion]").disabled = !records.length;
      };
    }
    node.querySelector('[role="status"]').textContent = message + (records.length > 1 ? ` ${records.length} deletions can be undone.` : "");
    node.querySelector("[data-undo-deletion]").disabled = false;
    // Rerendering a deleted card removes its focused control. Keep recovery
    // reachable from the keyboard without an expiring time limit.
    if (document.activeElement === document.body) node.querySelector("[data-undo-deletion]").focus({ preventScroll: true });
  }
  window.DealLogicActionRecovery = Object.freeze({ removeHubAction, restoreHubAction, offerUndo });
})();
