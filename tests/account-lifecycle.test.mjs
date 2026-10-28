import test from "node:test";
import assert from "node:assert/strict";
import { changeAccount } from "../lib/account-lifecycle.js";
import handler from "../api/account-lifecycle.js";

const config = { apiKey: "test-api-key", projectId: "test-project" };
const now = 1800000000000;
const token = overrides => `header.${Buffer.from(JSON.stringify({
  sub: "alice", aud: config.projectId, iss: `https://securetoken.google.com/${config.projectId}`, auth_time: now / 1000, ...overrides
})).toString("base64url")}.signature`;
const name = id => `projects/${config.projectId}/databases/(default)/documents/users/alice/state/${id}`;
function firebase({ count = 0, failCommit = false, failDelete = false, user = { localId: "alice", emailVerified: true } } = {}) {
  const documents = Array.from({ length: count }, (_, index) => ({ name: name(`state-${index}`) }));
  const calls = [];
  return { documents, calls, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    const ok = data => ({ ok: true, json: async () => data });
    if (url.includes("accounts:lookup")) return ok({ users: [user] });
    if (url.includes("accounts:delete")) return failDelete ? { ok: false, status: 500 } : ok({});
    if (url.includes("documents:commit")) {
      if (failCommit) return { ok: false, status: 403 };
      const { writes } = JSON.parse(options.body);
      for (const write of writes) {
        const index = documents.findIndex(doc => doc.name === write.delete);
        assert.notEqual(index, -1);
        documents.splice(index, 1);
      }
      return ok({});
    }
    if (url.includes("/state?pageSize=200")) return ok({ documents: documents.slice(0, 200) });
    throw new Error(`Unexpected request: ${url}`);
  } };
}

test("reset removes every page of account data and preserves the sign-in account", async () => {
  const backend = firebase({ count: 451 });
  const result = await changeAccount({ action: "reset", idToken: token(), now, config, ...backend });
  assert.equal(result.removed, 451);
  assert.equal(backend.documents.length, 0);
  assert.equal(backend.calls.filter(call => call.url.includes("documents:commit")).length, 3);
  assert.equal(backend.calls.some(call => call.url.includes("accounts:delete")), false);
});

test("deletion removes Firebase identity only after confirming Firestore is empty", async () => {
  const backend = firebase({ count: 2 });
  await changeAccount({ action: "delete", idToken: token(), now, config, ...backend });
  assert.match(backend.calls.at(-1).url, /accounts:delete/);
  assert.match(backend.calls.at(-2).url, /\/state\?pageSize=200/);
  assert.equal(backend.documents.length, 0);
});

test("cloud deletion failures retain authentication so cleanup can be retried", async () => {
  const backend = firebase({ count: 2, failCommit: true });
  await assert.rejects(changeAccount({ action: "delete", idToken: token(), now, config, ...backend }), /Retry to finish/);
  assert.equal(backend.calls.some(call => call.url.includes("accounts:delete")), false);
});

test("identity deletion failure reports that saved data was already cleared", async () => {
  const backend = firebase({ count: 2, failDelete: true });
  await assert.rejects(changeAccount({ action: "delete", idToken: token(), now, config, ...backend }), /Saved data was cleared/);
  assert.equal(backend.documents.length, 0);
});

test("invalid actions and missing credentials cannot contact Firebase", async () => {
  const backend = firebase();
  await assert.rejects(changeAccount({ action: "reset", now, config, ...backend }), /Sign in again/);
  await assert.rejects(changeAccount({ action: "something-else", idToken: token(), now, config, ...backend }), /Choose reset or delete/);
  assert.equal(backend.calls.length, 0);
});

test("stale, wrong-account and wrong-project tokens cannot delete data", async () => {
  for (const claims of [{ auth_time: now / 1000 - 301 }, { sub: "bob" }, { aud: "another-project" }, { auth_time: null }]) {
    const backend = firebase({ count: 2 });
    await assert.rejects(changeAccount({ action: "delete", idToken: token(claims), now, config, ...backend }), /Confirm your current password/);
    assert.equal(backend.calls.length, 1);
  }
});

test("unverified accounts cannot delete account state", async () => {
  const backend = firebase({ user: { localId: "alice", emailVerified: false } });
  await assert.rejects(changeAccount({ action: "delete", idToken: token(), now, config, ...backend }), /verified account/);
  assert.equal(backend.calls.length, 1);
});

test("backend refuses unexpected document paths instead of deleting another user's data", async () => {
  const backend = firebase({ count: 1 });
  backend.documents[0].name = name("state-0").replace("/alice/", "/bob/");
  await assert.rejects(changeAccount({ action: "delete", idToken: token(), now, config, ...backend }), /safely/);
  assert.equal(backend.calls.some(call => call.url.includes("documents:commit")), false);
});

test("empty accounts can be reset repeatedly", async () => {
  const backend = firebase();
  for (let index = 0; index < 2; index++) assert.equal((await changeAccount({ action: "reset", idToken: token(), now, config, ...backend })).removed, 0);
});

test("HTTP endpoint accepts only POST and requires a bearer token", async () => {
  const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ method: "GET", headers: {} }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
  await handler({ method: "POST", body: { action: "delete", uid: "someone-else" }, headers: {} }, response);
  assert.equal(response.statusCode, 401);
  assert.equal(response.headers["Cache-Control"], "no-store");
});
