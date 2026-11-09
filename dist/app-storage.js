/*
 * Browser persistence boundary.
 *
 * Guest data keeps its existing keys. Verified accounts use separate local
 * keys, which are mirrored to Firestore by account.js.
 */
(() => {
  const provider = window.localStorage;
  const accountKey = "deallogic:last-account-uid";
  const guestSessionKey = "deallogic:guest-session";
  const accountPrefix = uid => `deallogic:account:${uid}:`;
  const pendingKey = uid => `deallogic:sync-pending:${uid}`;
  const baselinePrefix = uid => `deallogic:sync-base:${uid}:`;
  const baselineKey = (uid, key) => baselinePrefix(uid) + key;
  const guarded = key => key === "deallogic:deal-projects:v1" || key.startsWith("deallogic:deal-project:");
  let activeUid = window.sessionStorage?.getItem(guestSessionKey) === "true" ? null : provider.getItem(accountKey) || null;
  if (activeUid && typeof document !== "undefined") document.documentElement.classList.add("account-restoring");
  const listeners = new Set();
  const frozenAccounts = new Set();
  const keys = () => Array.from({ length: provider.length }, (_, index) => provider.key(index));
  const scoped = key => activeUid && key.startsWith("deallogic:") ? accountPrefix(activeUid) + key : key;
  const pending = uid => {
    try {
      const keys = JSON.parse(provider.getItem(pendingKey(uid)) || "[]");
      return new Set(Array.isArray(keys) ? keys : []);
    } catch { return new Set(); }
  };
  const captureBaseline = key => {
    if (activeUid && guarded(key) && !pending(activeUid).has(key)) {
      provider.setItem(baselineKey(activeUid, key), JSON.stringify(provider.getItem(scoped(key))));
    }
  };
  const markPending = key => {
    if (!activeUid || !key.startsWith("deallogic:")) return;
    const keys = pending(activeUid);
    keys.add(key);
    provider.setItem(pendingKey(activeUid), JSON.stringify([...keys]));
    listeners.forEach(listener => listener(key));
  };
  const accountEntries = uid => {
    const prefix = accountPrefix(uid);
    return keys().filter(key => key.startsWith(prefix))
      .map(key => [key.slice(prefix.length), provider.getItem(key)]);
  };

  window.DealLogicStorage = Object.freeze({
    getItem(key) { return provider.getItem(scoped(key)); },
    setItem(key, value) { if (activeUid && frozenAccounts.has(activeUid)) return; captureBaseline(key); provider.setItem(scoped(key), value); markPending(key); },
    removeItem(key) { if (activeUid && frozenAccounts.has(activeUid)) return; captureBaseline(key); provider.removeItem(scoped(key)); markPending(key); },
    removeDealAnswers(id) {
      if (activeUid && frozenAccounts.has(activeUid)) return;
      const prefix = `deallogic:deal-project:${id}:issue:`;
      for (const key of keys().filter(key => key.startsWith(scoped(prefix)))) {
        const localKey = prefix + key.slice(scoped(prefix).length);
        captureBaseline(localKey);
        provider.removeItem(key);
        markPending(localKey);
      }
    },
    freezeAccount(uid) { frozenAccounts.add(uid); },
    activeUid() { return activeUid; },
    guestSession() { return window.sessionStorage?.getItem(guestSessionKey) === "true"; },
    useGuestForSession() {
      window.sessionStorage?.setItem(guestSessionKey, "true");
      activeUid = null;
      provider.removeItem(accountKey);
    },
    endGuestSession() { window.sessionStorage?.removeItem(guestSessionKey); },
    setAccount(uid) {
      activeUid = uid || null;
      if (activeUid) provider.setItem(accountKey, activeUid);
      else provider.removeItem(accountKey);
    },
    guestEntries() {
      return keys()
        .filter(key => key.startsWith("deallogic:") && !key.startsWith("deallogic:account:") && !key.startsWith("deallogic:sync-pending:") && !key.startsWith("deallogic:sync-base:") && key !== accountKey)
        .map(key => [key, provider.getItem(key)]);
    },
    accountEntries,
    pendingKeys(uid) { return [...pending(uid)]; },
    baseline(uid, key) {
      const raw = provider.getItem(baselineKey(uid, key));
      return raw === null ? undefined : JSON.parse(raw);
    },
    advanceBaseline(uid, key, value) {
      if (guarded(key)) provider.setItem(baselineKey(uid, key), JSON.stringify(value));
    },
    clearPending(uid, key) {
      const keys = pending(uid);
      keys.delete(key);
      provider.removeItem(baselineKey(uid, key));
      provider.setItem(pendingKey(uid), JSON.stringify([...keys]));
    },
    accountItem(uid, key) { return provider.getItem(accountPrefix(uid) + key); },
    applyCloud(uid, entries) {
      const dirty = pending(uid);
      const remote = new Map(entries);
      for (const [key] of accountEntries(uid)) {
        if (!remote.has(key) && !dirty.has(key)) provider.removeItem(accountPrefix(uid) + key);
      }
      for (const [key, value] of remote) {
        if (!dirty.has(key)) provider.setItem(accountPrefix(uid) + key, value);
      }
    },
    clearAccountCache(uid) {
      for (const [key] of accountEntries(uid)) provider.removeItem(accountPrefix(uid) + key);
      provider.removeItem(pendingKey(uid));
      for (const key of keys().filter(key => key.startsWith(baselinePrefix(uid)))) provider.removeItem(key);
    },
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  });
})();
