import test from "node:test";
import assert from "node:assert/strict";
import { buildFlags, companyNumber, loadCompany, loadDocument, loadFilings, searchCompanies } from "../lib/company-radar.js";

test("filing history requests later Companies House pages", async t => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.COMPANIES_HOUSE_API_KEY;
  process.env.COMPANIES_HOUSE_API_KEY = "test-key";
  let requested;
  globalThis.fetch = async url => {
    requested = new URL(url);
    return new Response(JSON.stringify({ total_count: 125, items: [{ transaction_id: "last-filing", category: "confirmation-statement" }] }), { status: 200 });
  };
  t.after(() => { globalThis.fetch = oldFetch; if (oldKey === undefined) delete process.env.COMPANIES_HOUSE_API_KEY; else process.env.COMPANIES_HOUSE_API_KEY = oldKey; });
  const result = await loadFilings("12345678", 100);
  assert.equal(requested.searchParams.get("start_index"), "100");
  assert.equal(requested.searchParams.get("items_per_page"), "100");
  assert.equal(result.total, 125);
  assert.equal(result.filings[0].category, "confirmation-statement");
});

test("company numbers are constrained to register-style identifiers", () => {
  assert.equal(companyNumber(" sc123456 "), "SC123456");
  assert.equal(companyNumber("12345678"), "12345678");
  assert.equal(companyNumber("../../secret"), "");
});

test("flags distinguish recorded exceptions from review points", () => {
  const profile = { company_number: "12345678", company_status: "active", accounts: { next_accounts: { overdue: true, due_on: "2026-01-01" } }, confirmation_statement: { next_due: "2026-11-01", overdue: false } };
  const sections = { charges: { data: { items: [{ status: "outstanding" }, { status: "fully-satisfied" }] } }, insolvency: { data: null } };
  const flags = buildFlags(profile, sections, new Date("2026-10-24T00:00:00Z"));
  assert.equal(flags.find(flag => flag.id === "accounts").level, "red");
  assert.equal(flags.find(flag => flag.id === "charges").level, "amber");
  assert.equal(flags.find(flag => flag.id === "confirmation").level, "amber");
  assert.equal(flags.find(flag => flag.id === "status").level, "green");
  assert.equal(flags.some(flag => flag.id === "insolvency"), false);
});

test("company lookup keeps partial data visible when a secondary resource fails", async t => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.COMPANIES_HOUSE_API_KEY;
  process.env.COMPANIES_HOUSE_API_KEY = "test-key";
  const response = body => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = async url => {
    const path = new URL(url).pathname;
    if (path === "/company/12345678") return response({ company_number: "12345678", company_name: "Example Limited", company_status: "active", links: { officers: "/company/12345678/officers", filing_history: "/company/12345678/filing-history" } });
    if (path.endsWith("/officers")) throw new Error("service down");
    if (path.endsWith("/filing-history")) return response({ items: [{ transaction_id: "filing-1", date: "2026-01-02", category: "accounts", type: "AA", links: { document_metadata: "https://document-api.company-information.service.gov.uk/document/1234567890abcdef" } }] });
    throw new Error(`Unexpected request: ${path}`);
  };
  t.after(() => { globalThis.fetch = oldFetch; if (oldKey === undefined) delete process.env.COMPANIES_HOUSE_API_KEY; else process.env.COMPANIES_HOUSE_API_KEY = oldKey; });
  const result = await loadCompany("12345678");
  assert.equal(result.name, "Example Limited");
  assert.equal(result.sections.officers, "unavailable");
  assert.equal(result.filings[0].documentId, "1234567890abcdef");
  assert.equal(result.flags.find(flag => flag.id === "status").level, "green");
});

test("document download checks company ownership and does not forward the API key", async t => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.COMPANIES_HOUSE_API_KEY;
  process.env.COMPANIES_HOUSE_API_KEY = "test-key";
  const seen = [];
  globalThis.fetch = async (url, options) => {
    seen.push({ url: String(url), authorization: options?.headers?.Authorization });
    if (String(url).endsWith("/document/1234567890abcdef")) return new Response(JSON.stringify({ company_number: "12345678", resources: { "application/pdf": { content_length: 3 } } }), { status: 200 });
    if (String(url).endsWith("/content")) return new Response(null, { status: 302, headers: { Location: "https://example.s3.amazonaws.com/file.pdf" } });
    return new Response(new Uint8Array([37, 80, 68]), { status: 200 });
  };
  t.after(() => { globalThis.fetch = oldFetch; if (oldKey === undefined) delete process.env.COMPANIES_HOUSE_API_KEY; else process.env.COMPANIES_HOUSE_API_KEY = oldKey; });
  const file = await loadDocument("12345678", "1234567890abcdef");
  assert.equal(file.toString(), "%PD");
  assert.ok(seen[0].authorization?.startsWith("Basic "));
  assert.equal(seen[2].authorization, undefined);
  assert.rejects(() => loadDocument("87654321", "1234567890abcdef"), { status: 404 });
});

test("search requires a key but never exposes it in returned results", async t => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.COMPANIES_HOUSE_API_KEY;
  process.env.COMPANIES_HOUSE_API_KEY = "test-key";
  globalThis.fetch = async () => new Response(JSON.stringify({ items: [{ title: "Example Limited", company_number: "12345678", company_status: "active" }] }), { status: 200 });
  t.after(() => { globalThis.fetch = oldFetch; if (oldKey === undefined) delete process.env.COMPANIES_HOUSE_API_KEY; else process.env.COMPANIES_HOUSE_API_KEY = oldKey; });
  const result = await searchCompanies("Example");
  assert.equal(result.results[0].number, "12345678");
  assert.equal(JSON.stringify(result).includes("test-key"), false);
});

test("company search can request results beyond the first page", async t => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.COMPANIES_HOUSE_API_KEY;
  process.env.COMPANIES_HOUSE_API_KEY = "test-key";
  let requested;
  globalThis.fetch = async url => {
    requested = new URL(url);
    return new Response(JSON.stringify({ total_results: 45, items: [{ title: "Later Limited", company_number: "12345678" }] }), { status: 200 });
  };
  t.after(() => { globalThis.fetch = oldFetch; if (oldKey === undefined) delete process.env.COMPANIES_HOUSE_API_KEY; else process.env.COMPANIES_HOUSE_API_KEY = oldKey; });
  const result = await searchCompanies("Later", 20);
  assert.equal(requested.searchParams.get("start_index"), "20");
  assert.equal(requested.searchParams.get("items_per_page"), "20");
  assert.equal(result.total, 45);
  assert.equal(result.results[0].name, "Later Limited");
  await assert.rejects(() => searchCompanies("Later", -1), { status: 400 });
});
