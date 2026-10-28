const workspaceKey = key => typeof key === "string" && key.startsWith("deallogic:") &&
  !key.startsWith("deallogic:account:") && !key.startsWith("deallogic:sync-pending:") &&
  key !== "deallogic:last-account-uid" && key !== "deallogic:guest-session";

export function createAccountBackup({ user, cloudEntries, localEntries, pendingKeys, exportedAt = new Date().toISOString() }) {
  if (!user?.uid) throw new Error("Sign in before exporting your account.");
  const values = new Map(cloudEntries.filter(([key, value]) => workspaceKey(key) && typeof value === "string"));
  const local = new Map(localEntries);
  for (const key of pendingKeys) {
    if (!workspaceKey(key)) continue;
    const value = local.get(key);
    if (typeof value === "string") values.set(key, value);
    else values.delete(key);
  }
  return {
    format: "deallogic-account-backup", version: 1, exportedAt,
    account: { uid: user.uid, email: user.email || "" },
    // Preserve the original storage strings losslessly, including settings
    // and answers that are not part of a Deal Hub table or briefing export.
    state: [...values].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => ({ key, value }))
  };
}

export function downloadAccountBackup(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2) + "\n"], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `deallogic-account-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
