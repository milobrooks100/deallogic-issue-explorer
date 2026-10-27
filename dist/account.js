const config = window.DEALLOGIC_FIREBASE_CONFIG;
const storage = window.DealLogicStorage;

if (!storage.guestSession() && config?.apiKey && config?.authDomain && config?.projectId && config?.appId) {
  const [{ initializeApp }, authSdk, firestore] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js")
  ]);

  const auth = authSdk.getAuth(initializeApp(config));
  const db = firestore.getFirestore();
  let verifiedUser = null;
  let syncRunning = null;
  let syncTimer = 0;
  let signingOut = false;
  let card;

  const stateCollection = uid => firestore.collection(db, "users", uid, "state");
  const stateDoc = (uid, key) => firestore.doc(db, "users", uid, "state", encodeURIComponent(key));
  const message = (value, error = false) => {
    const node = card?.querySelector("[data-account-message]");
    if (!node) return;
    node.textContent = value;
    node.classList.toggle("account-error", error);
  };
  const friendlyError = error => ({
    "auth/email-already-in-use": "An account already uses this email. Sign in instead.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a stronger password.",
    "auth/invalid-credential": "The email or password was not recognised.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "The connection failed. Please try again."
  }[error?.code] || "This could not be completed. Please try again.");

  async function flushPending() {
    if (!verifiedUser) return;
    if (syncRunning) return syncRunning;
    const uid = verifiedUser.uid;
    syncRunning = (async () => {
      for (let pass = 0; pass < 10 && storage.pendingKeys(uid).length; pass++) {
        for (const key of storage.pendingKeys(uid)) {
          const value = storage.accountItem(uid, key);
          if (value === null) await firestore.deleteDoc(stateDoc(uid, key));
          else await firestore.setDoc(stateDoc(uid, key), { key, value, updatedAt: firestore.serverTimestamp() });
          if (storage.accountItem(uid, key) === value) storage.clearPending(uid, key);
        }
      }
    })();
    let saved = false;
    try { await syncRunning; saved = true; }
    finally {
      syncRunning = null;
      if (saved && storage.pendingKeys(uid).length) scheduleSync();
      updateStatus();
    }
  }
  async function drainPending() {
    if (!verifiedUser) return;
    for (let attempt = 0; attempt < 3 && storage.pendingKeys(verifiedUser.uid).length; attempt++) await flushPending();
    if (storage.pendingKeys(verifiedUser.uid).length) throw new Error("Sync still pending");
  }
  function scheduleSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => flushPending().catch(() => {
      message("Progress is saved in this browser, but cloud sync is unavailable. Try again when connected.", true);
    }), 900);
    updateStatus();
  }
  function updateStatus() {
    const label = document.querySelector(".context-status");
    if (label && verifiedUser) label.innerHTML = `<i></i> ${storage.pendingKeys(verifiedUser.uid).length ? "Saving to account…" : "Saved to account"}`;
    const openAccount = document.querySelector(".account-open");
    if (openAccount) openAccount.textContent = verifiedUser ? "Account" : "Sign in or create account";
  }

  async function loadAccount(user) {
    await authSdk.reload(user);
    if (!user.emailVerified) {
      verifiedUser = null;
      if (storage.activeUid()) {
        storage.setAccount(null);
        location.reload();
        return;
      }
      render();
      return;
    }
    await user.getIdToken(true);
    const snapshot = await firestore.getDocs(stateCollection(user.uid));
    const entries = snapshot.docs.map(doc => [doc.data().key, doc.data().value])
      .filter(([key, value]) => typeof key === "string" && typeof value === "string" && key.startsWith("deallogic:"));
    storage.applyCloud(user.uid, entries);
    verifiedUser = user;
    const previousUid = storage.activeUid();
    storage.setAccount(user.uid);
    if (previousUid !== user.uid) {
      location.reload();
      return;
    }
    render();
    updateStatus();
    if (storage.pendingKeys(user.uid).length) scheduleSync();
  }

  function render() {
    if (!card) return;
    const user = auth.currentUser;
    if (verifiedUser) {
      card.innerHTML = `<h3>Your account</h3><p>Signed in as <strong data-account-email></strong>. Your deal progress is saved to your account.</p><div class="account-actions"><button type="button" data-account-sync>Sync now</button><button type="button" data-account-signout>Sign out</button></div><div data-account-import></div><p class="account-message" data-account-message role="status" aria-live="polite"></p>`;
      card.querySelector("[data-account-email]").textContent = verifiedUser.email;
      card.querySelector("[data-account-sync]").onclick = () => drainPending().then(() => message("Progress saved.")).catch(() => message("Cloud sync is unavailable. Your changes remain in this browser.", true));
      card.querySelector("[data-account-signout]").onclick = async () => {
        try {
          clearTimeout(syncTimer);
          await drainPending();
          const uid = verifiedUser.uid;
          signingOut = true;
          await authSdk.signOut(auth);
          verifiedUser = null;
          storage.clearAccountCache(uid);
          storage.setAccount(null);
          location.reload();
        } catch { signingOut = false; message("Cloud sync must finish before signing out. Please try again.", true); }
      };
      if (storage.guestEntries().length) {
        const slot = card.querySelector("[data-account-import]");
        slot.innerHTML = `<p>Progress saved in this browser can be copied into this account.</p><button type="button" data-account-import-button>Import browser progress</button>`;
        slot.querySelector("button").onclick = async () => {
          if (!confirm("Import this browser's saved progress into your account? Matching saved items in your account will be overwritten.")) return;
          for (const [key, value] of storage.guestEntries()) storage.setItem(key, value);
          try { await drainPending(); location.reload(); }
          catch { message("Import is still saved in this browser, but cloud sync failed. Try Sync now.", true); }
        };
      }
      return;
    }
    if (user && !user.emailVerified) {
      card.innerHTML = `<h3>Verify your email</h3><p>We sent a verification link to <strong data-account-email></strong>. Open it, then return here.</p><div class="account-actions"><button type="button" data-account-verified>I've verified my email</button><button type="button" data-account-resend>Resend email</button><button type="button" data-account-signout>Use another email</button></div><p class="account-message" data-account-message role="status" aria-live="polite"></p>`;
      card.querySelector("[data-account-email]").textContent = user.email;
      card.querySelector("[data-account-verified]").onclick = () => loadAccount(user).catch(error => message(friendlyError(error), true));
      card.querySelector("[data-account-resend]").onclick = () => authSdk.sendEmailVerification(user).then(() => message("Verification email sent.")).catch(error => message(friendlyError(error), true));
      card.querySelector("[data-account-signout]").onclick = () => authSdk.signOut(auth).then(() => render());
      return;
    }
    card.innerHTML = `<h3>Save your deal progress</h3><p>Create an account with any email address and a password. We will email you a link to verify the address before cloud saving begins.</p><div class="account-tabs" role="group" aria-label="Account action"><button type="button" data-account-mode="create" class="active">Create account</button><button type="button" data-account-mode="sign-in">Sign in</button></div><form data-account-form><label>Email address<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" autocomplete="new-password" minlength="6" required></label><button type="submit" data-account-submit>Create account</button></form><button type="button" class="account-text-button" data-account-reset>Forgot password?</button><p class="account-message" data-account-message role="status" aria-live="polite"></p>`;
    let mode = "create";
    card.querySelectorAll("[data-account-mode]").forEach(button => button.onclick = () => {
      mode = button.dataset.accountMode;
      card.querySelectorAll("[data-account-mode]").forEach(tab => tab.classList.toggle("active", tab === button));
      card.querySelector("[name=password]").autocomplete = mode === "create" ? "new-password" : "current-password";
      card.querySelector("[data-account-submit]").textContent = mode === "create" ? "Create account" : "Sign in";
      message("");
    });
    card.querySelector("[data-account-form]").onsubmit = async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const email = form.elements.namedItem("email").value.trim();
      const password = form.elements.namedItem("password").value;
      const button = form.querySelector("[type=submit]");
      button.disabled = true;
      try {
        if (mode === "create") {
          const { user: created } = await authSdk.createUserWithEmailAndPassword(auth, email, password);
          await authSdk.sendEmailVerification(created);
          render();
          message("Verification email sent. Check your inbox and spam folder.");
        } else {
          await authSdk.signInWithEmailAndPassword(auth, email, password);
        }
      } catch (error) { message(friendlyError(error), true); }
      finally { button.disabled = false; }
    };
    card.querySelector("[data-account-reset]").onclick = async () => {
      const email = card.querySelector("[name=email]").value.trim();
      if (!email) { message("Enter your email address first.", true); return; }
      try { await authSdk.sendPasswordResetEmail(auth, email); message("If an account exists for that address, a reset email is on its way."); }
      catch (error) { message(friendlyError(error), true); }
    };
  }

  function mount() {
    const settings = document.querySelector(".settings-view");
    if (!settings) return;
    card = document.createElement("section");
    card.className = "settings-card account-settings";
    settings.append(card);
    const context = document.querySelector(".workspace-context");
    if (context) {
      const openAccount = document.createElement("button");
      openAccount.type = "button";
      openAccount.className = "account-open";
      openAccount.textContent = "Sign in or create account";
      openAccount.onclick = () => window.showDealLogicView?.("settings");
      context.append(openAccount);
    }
    render();
    storage.onChange(() => { if (verifiedUser) scheduleSync(); });
    window.addEventListener("online", () => { if (verifiedUser && storage.pendingKeys(verifiedUser.uid).length) scheduleSync(); });
    authSdk.onAuthStateChanged(auth, user => {
      if (!user) {
        if (signingOut) return;
        verifiedUser = null;
        if (storage.activeUid()) {
          storage.setAccount(null);
          location.reload();
          return;
        }
        render();
        return;
      }
      loadAccount(user).then(() => document.documentElement.classList.remove("account-restoring")).catch(error => {
        const restoreMessage = document.querySelector("#account-restore-message");
        if (restoreMessage) restoreMessage.textContent = "Account progress could not be loaded. Check your connection, then retry.";
        message(`Account progress could not be loaded: ${friendlyError(error)}`, true);
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
} else {
  if (storage.activeUid()) {
    storage.setAccount(null);
    location.reload();
  } else document.documentElement.classList.remove("account-restoring");
}
