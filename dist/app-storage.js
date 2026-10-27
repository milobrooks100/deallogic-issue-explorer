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
  let activeUid = window.sessionStorage?.getItem(guestSessionKey) === "true" ? null : provider.getItem(accountKey) || null;
  if (activeUid && typeof document !== "undefined") document.documentElement.classList.add("account-restoring");
  const listeners = new Set();
  const keys = () => Array.from({ length: provider.length }, (_, index) => provider.key(index));
  const scoped = key => activeUid && key.startsWith("deallogic:") ? accountPrefix(activeUid) + key : key;
  const pending = uid => {
    try {
      const keys = JSON.parse(provider.getItem(pendingKey(uid)) || "[]");
      return new Set(Array.isArray(keys) ? keys : []);
    } catch { return new Set(); }
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
    setItem(key, value) { provider.setItem(scoped(key), value); markPending(key); },
    removeItem(key) { provider.removeItem(scoped(key)); markPending(key); },
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
        .filter(key => key.startsWith("deallogic:") && !key.startsWith("deallogic:account:") && !key.startsWith("deallogic:sync-pending:") && key !== accountKey)
        .map(key => [key, provider.getItem(key)]);
    },
    accountEntries,
    pendingKeys(uid) { return [...pending(uid)]; },
    clearPending(uid, key) {
      const keys = pending(uid);
      keys.delete(key);
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
    },
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  });
})();
