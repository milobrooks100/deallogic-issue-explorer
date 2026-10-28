import { prepareBrowserProgressImport } from "./browser-progress-import.js";
import { accountManagementMarkup, setupAccountManagement } from "./account-management.js";
import { createAccountBackup, downloadAccountBackup } from "./account-backup.js";

const config = window.DEALLOGIC_FIREBASE_CONFIG;
const storage = window.DealLogicStorage;
const guestAvatarMarkup = '<svg class="guest-avatar-art" viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="guest-avatar-clip"><circle cx="32" cy="32" r="28"/></clipPath></defs><g clip-path="url(#guest-avatar-clip)" fill="currentColor"><circle cx="32" cy="23" r="10"/><ellipse cx="32" cy="58" rx="20" ry="22"/></g><circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

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
  let syncRetryMs = 3000;
  let signingOut = false;
  let accountOperation = false;
  let accountBackupRunning = false;
  const accountChannel = typeof BroadcastChannel === "function" ? new BroadcastChannel("deallogic-account-lifecycle") : null;
  const withCloudLock = (uid, task) => navigator.locks?.request
    ? navigator.locks.request(`deallogic-cloud:${uid}`, task) : task();
  const pauseAccount = uid => {
    accountOperation = true;
    clearTimeout(syncTimer);
    storage.freezeAccount(uid);
  };
  if (accountChannel) accountChannel.onmessage = event => {
    const { uid, phase, action } = event.data || {};
    if (!uid || uid !== storage.activeUid()) return;
    if (phase === "start") {
      pauseAccount(uid);
      document.documentElement.classList.add("account-restoring");
      const overlay = document.querySelector(".account-restore");
      if (overlay) {
        overlay.querySelector("strong").textContent = action === "delete" ? "Deleting account…" : "Resetting account…";
        overlay.querySelector("p").textContent = "An account change is in progress in another tab.";
        overlay.querySelectorAll("button").forEach(button => { button.hidden = true; });
      }
    } else if (phase === "complete" || phase === "failed") {
      storage.clearAccountCache(uid);
      if (phase === "complete" && action === "delete") storage.setAccount(null);
      location.reload();
    }
  };
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
  const avatarKey = "deallogic:account-avatar";
  const avatarGroups = [
    ["Places", "Wave", "Mountains", "Sailboat", "Coastal village", "Palm sunset", "Northern lights"],
    ["Dogs", "Golden retriever", "Black Labrador", "Chocolate Labrador", "Cocker spaniel", "Irish setter", "Springer spaniel"],
    ["Animals", "Panda", "Penguin", "Flamingo", "Fox", "Giraffe", "Octopus"],
    ["People", "Sunglasses portrait", "Woman portrait", "Bearded portrait", "Blonde portrait", "Orange sunglasses portrait", "Astronaut"],
    ["Interests", "Tennis", "Golf", "Laptop", "Books", "Coffee", "Football"]
  ];
  const avatarNames = avatarGroups.flatMap(group => group.slice(1));
  const defaultAvatar = { kind: "preset", index: 0 };
  const readAvatar = () => {
    if (!verifiedUser) return defaultAvatar;
    try {
      const value = JSON.parse(storage.getItem(avatarKey) || "null");
      if (value?.kind === "preset" && Number.isInteger(value.index) && value.index >= 0 && value.index < avatarNames.length) return value;
    } catch { /* Keep the wave when an older value is malformed. */ }
    return defaultAvatar;
  };
  const avatarMarkup = avatar => {
    if (avatar.index === 22) return '<span class="avatar-art avatar-art-replacement" aria-hidden="true"></span>';
    const column = avatar.index % 6;
    const row = Math.floor(avatar.index / 6);
    const x = ((50 + column * 247) / 1336 * 100).toFixed(2);
    const y = ((5 + row * 200) / 824 * 100).toFixed(2);
    return `<span class="avatar-art" style="background-position:${x}% ${y}%" aria-hidden="true"></span>`;
  };
  const avatarChoicesMarkup = () => avatarGroups.map((group, row) => `<div class="account-avatar-group"><p class="account-avatar-group-label">${group[0]}</p><div class="account-avatar-options" role="group" aria-label="${group[0]} avatars">${group.slice(1).map((name, column) => `<button type="button" data-avatar-index="${row * 6 + column}" aria-label="Use ${name} avatar" aria-pressed="false" title="${name}">${avatarMarkup({ index: row * 6 + column })}</button>`).join("")}</div></div>`).join("");
  const refreshIcons = () => window.lucide?.createIcons({ attrs: { "stroke-width": 1.75 } });
  function renderAccountEntry() {
    const slot = document.querySelector(".project-rail [data-account-slot]");
    if (!slot) return;
    const state = verifiedUser ? "verified" : auth.currentUser ? "unverified" : "guest";
    const avatar = readAvatar();
    const renderKey = `${state}:${state === "guest" ? "silhouette" : avatar.index}`;
    if (slot.dataset.renderKey !== renderKey) {
      const heading = state === "verified" ? "My account" : state === "unverified" ? "Verify your email" : "Create account / Sign in";
      const action = state === "verified" ? "Open account settings" : state === "unverified" ? "Open email verification" : "Create an account or sign in";
      slot.innerHTML = `<button type="button" class="account-entry" title="${action}" aria-label="${action}"><span class="account-entry-avatar${state === "guest" ? " is-guest" : ""}">${state === "guest" ? guestAvatarMarkup : avatarMarkup(avatar)}</span><span class="account-entry-copy"><strong>${heading}</strong><small data-account-save-status></small></span><i class="account-entry-chevron" data-lucide="chevron-right" aria-hidden="true"></i></button>`;
      slot.dataset.renderKey = renderKey;
      slot.querySelector("button").onclick = () => window.showDealLogicView?.("settings");
      refreshIcons();
    }
    const status = slot.querySelector("[data-account-save-status]");
    if (status) status.textContent = verifiedUser
      ? storage.pendingKeys(verifiedUser.uid).length ? "Saving to account…" : "Saved to account"
      : state === "unverified" ? "Finish account setup" : "Saved in this browser";
  }
  function updateAvatarEditor() {
    const avatar = readAvatar();
    const preview = card?.querySelector("[data-account-avatar-preview]");
    if (preview) preview.innerHTML = avatarMarkup(avatar);
    card?.querySelectorAll("[data-avatar-index]").forEach(button => {
      button.setAttribute("aria-pressed", String(avatar.index === Number(button.dataset.avatarIndex)));
    });
    renderAccountEntry();
    refreshIcons();
  }
  function setupPasswordChange() {
    const form = card.querySelector("[data-password-form]");
    const reviewButton = form.querySelector("[data-password-review]");
    const confirmation = form.querySelector("[data-password-confirmation]");
    const confirmButton = form.querySelector("[data-password-confirm]");
    const status = card.querySelector("[data-password-status]");
    const resetConfirmation = () => {
      confirmation.hidden = true;
      reviewButton.hidden = false;
    };
    form.oninput = () => {
      resetConfirmation();
      status.textContent = "";
      status.classList.remove("account-error");
    };
    form.onsubmit = event => {
      event.preventDefault();
      const currentPassword = form.elements.namedItem("currentPassword").value;
      const newPassword = form.elements.namedItem("newPassword").value;
      if (currentPassword === newPassword) {
        status.textContent = "Choose a new password that differs from your current one.";
        status.classList.add("account-error");
        return;
      }
      status.textContent = "";
      confirmation.hidden = false;
      reviewButton.hidden = true;
      confirmButton.focus();
    };
    form.querySelector("[data-password-cancel]").onclick = () => {
      form.reset();
      resetConfirmation();
      status.textContent = "Password change cancelled.";
      status.classList.remove("account-error");
      reviewButton.focus();
    };
    confirmButton.onclick = async () => {
      if (!form.reportValidity()) return;
      const user = auth.currentUser;
      if (!user || !verifiedUser || user.uid !== verifiedUser.uid || !user.email) {
        status.textContent = "Sign in again before changing your password.";
        status.classList.add("account-error");
        resetConfirmation();
        return;
      }
      const currentPassword = form.elements.namedItem("currentPassword").value;
      const newPassword = form.elements.namedItem("newPassword").value;
      if (currentPassword === newPassword) {
        status.textContent = "Choose a new password that differs from your current one.";
        status.classList.add("account-error");
        resetConfirmation();
        return;
      }
      confirmButton.disabled = true;
      form.querySelector("[data-password-cancel]").disabled = true;
      status.textContent = "Changing password…";
      status.classList.remove("account-error");
      try {
        const credential = authSdk.EmailAuthProvider.credential(user.email, currentPassword);
        await authSdk.reauthenticateWithCredential(user, credential);
        if (auth.currentUser?.uid !== user.uid || verifiedUser?.uid !== user.uid) throw new Error("Account changed");
        await authSdk.updatePassword(user, newPassword);
        form.reset();
        resetConfirmation();
        status.textContent = "Password changed successfully.";
      } catch (error) {
        resetConfirmation();
        form.elements.namedItem("currentPassword").value = "";
        status.textContent = ({
          "auth/invalid-credential": "Current password was not recognised. Try again.",
          "auth/wrong-password": "Current password was not recognised. Try again.",
          "auth/weak-password": "Choose a stronger new password.",
          "auth/network-request-failed": "Connection failed. Your password was not changed. Try again."
        })[error?.code] || "Password was not changed. Please try again.";
        status.classList.add("account-error");
        form.elements.namedItem("currentPassword").focus();
      } finally {
        confirmButton.disabled = false;
        form.querySelector("[data-password-cancel]").disabled = false;
      }
    };
  }

  async function flushPending() {
    if (!verifiedUser || accountOperation || accountBackupRunning) return;
    if (syncRunning) return syncRunning;
    const uid = verifiedUser.uid;
    syncRunning = withCloudLock(uid, async () => {
      for (let pass = 0; !accountOperation && pass < 10 && storage.pendingKeys(uid).length; pass++) {
        for (const key of storage.pendingKeys(uid)) {
          const value = storage.accountItem(uid, key);
          if (value === null) await firestore.deleteDoc(stateDoc(uid, key));
          else await firestore.setDoc(stateDoc(uid, key), { key, value, updatedAt: firestore.serverTimestamp() });
          if (storage.accountItem(uid, key) === value) storage.clearPending(uid, key);
        }
      }
    });
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
  function scheduleSync(delay = 900) {
    if (accountOperation || accountBackupRunning) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      try {
        await flushPending();
        syncRetryMs = 3000;
        if (verifiedUser && !storage.pendingKeys(verifiedUser.uid).length && card?.querySelector("[data-account-message]")?.textContent === "Avatar updated. Saving to your account…") {
          message("Avatar saved to your account.");
        }
      } catch {
        message("Progress is saved in this browser, but cloud sync is unavailable. We will retry automatically.", true);
        if (verifiedUser && storage.pendingKeys(verifiedUser.uid).length) {
          scheduleSync(syncRetryMs);
          syncRetryMs = Math.min(syncRetryMs * 2, 60000);
        }
      }
    }, delay);
    updateStatus();
  }
  function updateStatus() {
    renderAccountEntry();
  }

  async function runAccountOperation(user, action) {
    const uid = user.uid;
    const idToken = await user.getIdToken(true);
    pauseAccount(uid);
    accountChannel?.postMessage({ uid, action, phase: "start" });
    // Let an in-flight save finish before deletion, and block queued saves in
    // other tabs. Removed pending writes must never restore deleted records.
    try {
      if (syncRunning) await syncRunning.catch(() => {});
      await withCloudLock(uid, async () => {
        storage.clearAccountCache(uid);
        let response;
        try {
          response = await fetch("/api/account-lifecycle", {
            method: "POST",
            headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ action })
          });
        } catch {
          throw new Error("Connection lost. Some data may already be removed. Retry to finish the account change.");
        }
        const result = await response.json().catch(() => null);
        if (!response.ok || !result || result.action !== action) {
          throw new Error(result?.error || "The account change could not be completed. Some data may already be removed. Please retry.");
        }
        storage.clearAccountCache(uid);
        accountChannel?.postMessage({ uid, action, phase: "complete" });
        if (action === "delete") {
          signingOut = true;
          verifiedUser = null;
          storage.setAccount(null);
          await authSdk.signOut(auth);
        }
        location.reload();
      });
    } catch (error) {
      accountChannel?.postMessage({ uid, action, phase: "failed" });
      throw error;
    }
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
    renderAccountEntry();
    if (verifiedUser) {
      card.innerHTML = `<span class="eyebrow">Account</span><h3>Your account</h3><p>Signed in as <strong data-account-email></strong>. Your deal progress and preferences save automatically to your account.</p><div class="account-avatar-settings settings-subsection"><div class="account-avatar-intro"><span class="account-avatar-preview" data-account-avatar-preview></span><div><h4>Your avatar</h4><p>Choose one of 30 avatars for your sidebar account button.</p></div></div><div class="account-avatar-groups">${avatarChoicesMarkup()}</div></div><div class="account-password-settings settings-subsection"><h4>Change password</h4><p>Enter your current password and a new one. You will review the change before confirming it.</p><form data-password-form><label>Current password<input type="password" name="currentPassword" maxlength="256" autocomplete="current-password" required></label><label>New password<input type="password" name="newPassword" maxlength="256" autocomplete="new-password" minlength="6" required></label><div class="account-password-actions"><button type="submit" data-password-review>Review password change</button><div class="account-password-confirmation" data-password-confirmation role="group" aria-label="Confirm password change" hidden><strong>Change your password?</strong><p>This will replace the password you use to sign in.</p><div><button type="button" data-password-confirm>Confirm password change</button><button type="button" data-password-cancel>Cancel</button></div></div></div></form><p class="account-password-status" data-password-status role="status" aria-live="polite"></p></div><div data-account-import class="settings-subsection"></div><div class="account-security-settings settings-subsection"><div><h4>Session</h4><p>Sign out on this device when you are finished.</p></div><div class="account-actions"><button type="button" data-account-signout>Sign out</button></div></div>${accountManagementMarkup}<p class="account-message" data-account-message role="status" aria-live="polite"></p>`;
      card.querySelector("[data-account-email]").textContent = verifiedUser.email;
      card.querySelectorAll("[data-avatar-index]").forEach(button => button.onclick = () => {
        storage.setItem(avatarKey, JSON.stringify({ kind: "preset", index: Number(button.dataset.avatarIndex) }));
        updateAvatarEditor();
        message("Avatar updated. Saving to your account…");
      });
      updateAvatarEditor();
      setupPasswordChange();
      setupAccountManagement({
        card,
        getUser: () => auth.currentUser?.uid === verifiedUser?.uid ? verifiedUser : null,
        reauthenticate: async (user, password) => {
          try {
            await authSdk.reauthenticateWithCredential(user, authSdk.EmailAuthProvider.credential(user.email, password));
          } catch (error) { throw new Error(friendlyError(error)); }
        },
        runOperation: runAccountOperation,
        exportBackup: async () => {
          const user = verifiedUser;
          if (!user || accountOperation) throw new Error("Sign in before exporting your account.");
          accountBackupRunning = true;
          try {
            if (syncRunning) await syncRunning.catch(() => {});
            await withCloudLock(user.uid, async () => {
              let snapshot;
              try { snapshot = await firestore.getDocsFromServer(stateCollection(user.uid)); }
              catch { throw new Error("Your cloud data could not be read. Check your connection and retry to export a complete backup."); }
              if (accountOperation || verifiedUser?.uid !== user.uid || storage.activeUid() !== user.uid) {
                throw new Error("Your account changed. Reload and try again.");
              }
              const backup = createAccountBackup({
                user,
                cloudEntries: snapshot.docs.map(doc => [doc.data().key, doc.data().value]),
                localEntries: storage.accountEntries(user.uid),
                pendingKeys: storage.pendingKeys(user.uid)
              });
              downloadAccountBackup(backup);
            });
          } finally {
            accountBackupRunning = false;
            if (verifiedUser && storage.pendingKeys(verifiedUser.uid).length) scheduleSync();
          }
        }
      });
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
        } catch {
          signingOut = false;
          if (verifiedUser && storage.pendingKeys(verifiedUser.uid).length) scheduleSync(syncRetryMs);
          message("Your latest changes are still saving. We will retry automatically before you sign out.", true);
        }
      };
      if (storage.guestEntries().length) {
        const slot = card.querySelector("[data-account-import]");
        slot.innerHTML = `<div><h4>Browser progress</h4><p>Add this browser's saved work as separate deals. Your existing account deals will not change.</p></div><button type="button" data-account-import-button>Import browser progress</button>`;
        slot.querySelector("button").onclick = async () => {
          let plan;
          try {
            plan = prepareBrowserProgressImport(storage.guestEntries(), storage.getItem("deallogic:deal-projects:v1"), () => crypto.randomUUID());
          } catch (error) { message(error.message, true); return; }
          if (!plan.count) { message("There is no browser deal progress to import."); return; }
          if (!confirm(`Add ${plan.count} browser ${plan.count === 1 ? "deal" : "deals"} to your account? Your existing deals will stay unchanged.`)) return;
          const button = slot.querySelector("button");
          button.disabled = true;
          for (const [key, value] of plan.writes) storage.setItem(key, value);
          try { await drainPending(); location.reload(); }
          catch { message("Imported deals are saved on this browser. Account sync will retry automatically.", true); button.disabled = false; }
        };
      }
      return;
    }
    if (user && !user.emailVerified) {
      card.innerHTML = `<span class="eyebrow">Account</span><h3>Verify your email</h3><p>We sent a verification link to <strong data-account-email></strong>. Open it, then return here.</p><div class="account-actions"><button type="button" data-account-verified>I've verified my email</button><button type="button" data-account-resend>Resend email</button><button type="button" data-account-signout>Use another email</button></div><p class="account-message" data-account-message role="status" aria-live="polite"></p>`;
      card.querySelector("[data-account-email]").textContent = user.email;
      card.querySelector("[data-account-verified]").onclick = () => loadAccount(user).catch(error => message(friendlyError(error), true));
      card.querySelector("[data-account-resend]").onclick = () => authSdk.sendEmailVerification(user).then(() => message("Verification email sent.")).catch(error => message(friendlyError(error), true));
      card.querySelector("[data-account-signout]").onclick = () => authSdk.signOut(auth).then(() => render());
      return;
    }
    card.innerHTML = `<span class="eyebrow">Account</span><h3>Save your deal progress</h3><p>Create an account or sign in with your email address and password. New accounts need email verification before cloud saving begins.</p><form data-account-form><label>Email address<input name="email" type="email" maxlength="254" autocomplete="email" required></label><label>Password<input name="password" type="password" maxlength="256" autocomplete="current-password" minlength="6" required></label><div class="account-form-actions"><button type="submit" data-account-action="create">Create account</button><button type="submit" data-account-action="sign-in">Sign in</button></div></form><button type="button" class="account-text-button" data-account-reset>Forgot password?</button><p class="account-message" data-account-message role="status" aria-live="polite"></p>`;
    card.querySelector("[data-account-form]").onsubmit = async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const email = form.elements.namedItem("email").value.trim();
      const password = form.elements.namedItem("password").value;
      const action = event.submitter?.dataset.accountAction || "create";
      const buttons = form.querySelectorAll("[type=submit]");
      buttons.forEach(button => { button.disabled = true; });
      try {
        if (action === "create") {
          const { user: created } = await authSdk.createUserWithEmailAndPassword(auth, email, password);
          await authSdk.sendEmailVerification(created);
          render();
          message("Verification email sent. Check your inbox and spam folder.");
        } else {
          await authSdk.signInWithEmailAndPassword(auth, email, password);
        }
      } catch (error) { message(friendlyError(error), true); }
      finally { buttons.forEach(button => { button.disabled = false; }); }
    };
    card.querySelector("[data-account-reset]").onclick = async () => {
      const email = card.querySelector("[name=email]").value.trim();
      if (!email) { message("Enter your email address first.", true); return; }
      try { await authSdk.sendPasswordResetEmail(auth, email); message("If an account exists for that address, a reset email is on its way."); }
      catch (error) { message(friendlyError(error), true); }
    };
  }

  function mount() {
    const settings = document.querySelector(".settings-panel");
    if (!settings) return;
    card = document.createElement("section");
    card.className = "settings-section account-settings";
    card.setAttribute("aria-label", "Account settings");
    settings.prepend(card);
    document.addEventListener("deal-project-rail-rendered", renderAccountEntry);
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
  } else {
    document.documentElement.classList.remove("account-restoring");
    if (storage.guestSession() && config?.apiKey && config?.authDomain && config?.projectId && config?.appId) {
      const showGuestEntry = () => {
        const slot = document.querySelector(".project-rail [data-account-slot]");
        if (!slot) return;
        slot.innerHTML = `<button type="button" class="account-entry" title="Return to your account" aria-label="Return to your account"><span class="account-entry-avatar is-guest">${guestAvatarMarkup}</span><span class="account-entry-copy"><strong>Create account / Sign in</strong><small>Saved in this browser</small></span><i class="account-entry-chevron" data-lucide="chevron-right" aria-hidden="true"></i></button>`;
        slot.querySelector("button").onclick = () => { storage.endGuestSession(); location.reload(); };
        window.lucide?.createIcons({ attrs: { "stroke-width": 1.75 } });
      };
      document.addEventListener("deal-project-rail-rendered", showGuestEntry);
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showGuestEntry, { once: true });
      else showGuestEntry();
    }
  }
}
