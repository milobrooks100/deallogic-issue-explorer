import { readFileSync } from "node:fs";

const webConfig = JSON.parse(readFileSync(new URL("../firebase.web.json", import.meta.url), "utf8"));

export class AccountLifecycleError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

// Use the user's Firebase credentials, so the existing owner-only Firestore
// rules also apply to backend deletion. Never accept a user ID from the client.
export async function changeAccount({ action, idToken, fetchImpl = fetch, now = Date.now(), config = {
  apiKey: process.env.FIREBASE_API_KEY || webConfig.apiKey,
  projectId: process.env.FIREBASE_PROJECT_ID || webConfig.projectId
} }) {
  if (!["reset", "delete"].includes(action)) throw new AccountLifecycleError("Choose reset or delete.", 400);
  if (typeof idToken !== "string" || !idToken || idToken.length > 16000) throw new AccountLifecycleError("Sign in again before continuing.", 401);
  if (!config.apiKey || !config.projectId) throw new AccountLifecycleError("Account service is not configured.", 503);

  async function call(url, options = {}, errorMessage = "Account operation could not be completed.") {
    let response;
    try { response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(15000) }); }
    catch { throw new AccountLifecycleError(errorMessage); }
    if (!response.ok) throw new AccountLifecycleError(errorMessage, response.status === 401 ? 401 : 502);
    return response.json();
  }
  const authUrl = method => `https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${encodeURIComponent(config.apiKey)}`;
  const authOptions = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) };
  const account = await call(authUrl("lookup"), authOptions, "Your session could not be verified. Sign in again and retry.");
  const user = account.users?.[0];
  if (!user?.localId || !user.emailVerified || user.disabled) throw new AccountLifecycleError("A verified account is required.", 403);

  // Decode claims only after Firebase has authenticated the complete token.
  let claims;
  try { claims = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")); }
  catch { throw new AccountLifecycleError("Sign in again before continuing.", 401); }
  if (claims.sub !== user.localId || claims.aud !== config.projectId || claims.iss !== `https://securetoken.google.com/${config.projectId}` ||
      !Number.isFinite(claims.auth_time) || now / 1000 - claims.auth_time > 300 || claims.auth_time > now / 1000 + 60) {
    throw new AccountLifecycleError("Confirm your current password again before continuing.", 401);
  }

  const database = `projects/${config.projectId}/databases/(default)`;
  const statePath = `${database}/documents/users/${encodeURIComponent(user.localId)}/state`;
  const headers = { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" };
  let removed = 0;
  // Re-read the first page after each batch: deleting earlier pages must not
  // skip records. Every account setting, deal, answer and action lives here.
  for (;;) {
    const snapshot = await call(`https://firestore.googleapis.com/v1/${statePath}?pageSize=200`, { headers }, "Saved account data could not be read. Retry to finish clearing the account.");
    const documents = snapshot.documents || [];
    if (!documents.length) break;
    if (documents.some(document => !document.name?.startsWith(`${statePath}/`) || document.name.slice(statePath.length + 1).includes("/"))) {
      throw new AccountLifecycleError("Account data could not be cleared safely.");
    }
    await call(`https://firestore.googleapis.com/v1/${database}/documents:commit`, {
      method: "POST", headers, body: JSON.stringify({ writes: documents.map(document => ({ delete: document.name })) })
    }, "Some saved data may already be removed. Retry to finish clearing the account.");
    removed += documents.length;
  }
  // Keep authentication until the data is gone, so a failed operation can be
  // retried with the same account. Reset deliberately retains the login.
  if (action === "delete") await call(authUrl("delete"), authOptions, "Saved data was cleared, but account deletion could not finish. Retry to delete your sign-in account.");
  return { action, removed };
}
