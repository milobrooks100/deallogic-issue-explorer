export const accountManagementMarkup = `
  <div class="account-data-settings settings-subsection">
    <div><h4>Account backup</h4><p>Download all projects, Deal Hub actions, saved answers and settings as a JSON file.</p><p class="account-backup-status" data-account-backup-status role="status" aria-live="polite"></p></div>
    <div class="account-actions"><button type="button" data-account-backup>Export account backup</button></div>
  </div>
  <div class="account-data-settings settings-subsection">
    <div><h4>Reset account</h4><p>Permanently delete all projects, Deal Hub actions and saved answers, and restore your avatar and settings to their defaults. Keep your sign-in account.</p></div>
    <div class="account-actions"><button type="button" data-account-manage="reset">Reset account</button></div>
  </div>
  <div class="account-data-settings settings-subsection">
    <div><h4>Delete account</h4><p>Permanently delete your account and all account data. This cannot be undone.</p></div>
    <div class="account-actions"><button type="button" class="account-danger-button" data-account-manage="delete">Delete account</button></div>
  </div>
  <dialog class="account-data-dialog" aria-labelledby="account-data-title" aria-describedby="account-data-warning">
    <form data-account-data-form>
      <h4 id="account-data-title"></h4>
      <p id="account-data-warning"></p>
      <label>Current password<input type="password" name="password" autocomplete="current-password" maxlength="256" required></label>
      <p class="account-operation-status" data-account-operation-status role="status" aria-live="polite"></p>
      <div class="account-actions"><button type="button" data-account-data-cancel>Cancel</button><button type="submit" class="account-danger-button" data-account-data-confirm></button></div>
    </form>
  </dialog>`;

export function setupAccountManagement({ card, getUser, reauthenticate, runOperation, exportBackup, reload = () => location.reload() }) {
  const backupButton = card.querySelector("[data-account-backup]");
  const backupStatus = card.querySelector("[data-account-backup-status]");
  backupButton.onclick = async () => {
    const manageButtons = card.querySelectorAll("[data-account-manage]");
    backupButton.disabled = true;
    manageButtons.forEach(button => { button.disabled = true; });
    backupButton.textContent = "Preparing backup…";
    backupStatus.textContent = "Reading your saved account data…";
    backupStatus.classList.remove("account-error");
    try {
      await exportBackup();
      backupStatus.textContent = "Backup download started.";
    } catch (error) {
      backupStatus.textContent = error?.message || "Backup could not be prepared. Please try again.";
      backupStatus.classList.add("account-error");
    } finally {
      backupButton.disabled = false;
      manageButtons.forEach(button => { button.disabled = false; });
      backupButton.textContent = "Export account backup";
    }
  };
  const dialog = card.querySelector(".account-data-dialog");
  const form = dialog.querySelector("form");
  const password = form.elements.namedItem("password");
  const status = dialog.querySelector("[data-account-operation-status]");
  const confirm = dialog.querySelector("[data-account-data-confirm]");
  const cancel = dialog.querySelector("[data-account-data-cancel]");
  let action, busy = false, started = false;
  const close = () => { if (!busy) { form.reset(); dialog.close(); if (started) reload(); } };
  cancel.onclick = close;
  dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
  card.querySelectorAll("[data-account-manage]").forEach(button => {
    button.onclick = () => {
      action = button.dataset.accountManage;
      const deleting = action === "delete";
      started = false;
      cancel.textContent = "Cancel";
      form.reset();
      status.textContent = "";
      status.classList.remove("account-error");
      dialog.querySelector("#account-data-title").textContent = deleting ? "Permanently delete your account?" : "Reset your account?";
      dialog.querySelector("#account-data-warning").textContent = deleting
        ? "Your account and all account data will be deleted permanently, including every project, Deal Hub action, saved answer and setting. This cannot be undone. Enter your current password, then confirm deletion."
        : "All projects, Deal Hub actions and saved answers will be deleted permanently. Your avatar and all saved settings will return to their starting defaults. Your email and password will stay the same. This cannot be undone. Enter your current password, then confirm the reset.";
      confirm.textContent = deleting ? "Confirm permanent deletion" : "Confirm account reset";
      dialog.showModal();
      password.focus();
    };
  });
  form.onsubmit = async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    confirm.disabled = cancel.disabled = password.disabled = true;
    status.textContent = "Confirming your password…";
    status.classList.remove("account-error");
    try {
      const user = getUser();
      if (!user?.email) throw new Error("Sign in again before continuing.");
      await reauthenticate(user, password.value);
      password.value = "";
      if (getUser()?.uid !== user.uid) throw new Error("Your account changed. Reload and try again.");
      started = true;
      status.textContent = action === "delete" ? "Permanently deleting your account and data…" : "Resetting your account…";
      await runOperation(user, action);
    } catch (error) {
      password.value = "";
      status.textContent = error?.message || "This could not be completed. Please retry.";
      status.classList.add("account-error");
      cancel.textContent = started ? "Reload account" : "Cancel";
    } finally {
      busy = false;
      confirm.disabled = cancel.disabled = password.disabled = false;
      password.focus();
    }
  };
}
