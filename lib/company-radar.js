const API = "https://api.company-information.service.gov.uk";
const DOCUMENT_API = "https://document-api.company-information.service.gov.uk";

export class RadarError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

export function companyNumber(value) {
  const number = String(value || "").trim().toUpperCase();
  return /^(?:[A-Z]{2}\d{6}|\d{8})$/.test(number) ? number : "";
}

export function publicCompanyUrl(number, suffix = "") {
  return `https://find-and-update.company-information.service.gov.uk/company/${encodeURIComponent(number)}${suffix}`;
}

function key() {
  const value = process.env.COMPANIES_HOUSE_API_KEY;
  if (!value) throw new RadarError("Company Radar is awaiting its Companies House API key.", 503);
  return value;
}

export async function companiesHouseGet(path, { document = false, accept = "application/json", redirect = "follow" } = {}) {
  const base = document ? DOCUMENT_API : API;
  const url = new URL(path, base);
  if (url.origin !== base) throw new RadarError("Invalid Companies House resource.", 400);
  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Basic ${Buffer.from(`${key()}:`).toString("base64")}`, Accept: accept },
      signal: AbortSignal.timeout(8000), redirect
    });
  } catch {
    throw new RadarError("Companies House is temporarily unavailable.", 502);
  }
  if (response.status === 429) throw new RadarError("Companies House is busy. Please try again shortly.", 503);
  if (response.status === 404) return null;
  if (!response.ok && response.status !== 302) throw new RadarError("Companies House could not provide this record.", 502);
  return response;
}

const address = value => value ? [value.premises, value.address_line_1, value.address_line_2, value.locality, value.region, value.postal_code, value.country].filter(Boolean).join(", ") : "";
const ordered = (items, dateKey = "date") => [...items].sort((a, b) => String(b[dateKey] || "").localeCompare(String(a[dateKey] || "")));
const normalizeFiling = item => ({
  id: item.transaction_id, date: item.date, category: item.category, description: item.description,
  type: item.type, pages: item.pages, documentId: item.links?.document_metadata?.split("/document/")[1]?.split(/[/?#]/)[0] || ""
});

export async function loadFilings(number, startIndex = 0) {
  const valid = companyNumber(number);
  if (!valid || !Number.isInteger(startIndex) || startIndex < 0) throw new RadarError("Invalid filing request.", 400);
  const response = await companiesHouseGet(`/company/${valid}/filing-history?items_per_page=100&start_index=${startIndex}`);
  if (!response) return { filings: [], total: 0 };
  const data = await response.json();
  return { filings: (data.items || []).map(normalizeFiling), total: Number(data.total_count ?? data.total_results ?? data.items?.length ?? 0) };
}

export function buildFlags(profile, sections, now = new Date()) {
  const flags = [];
  const add = (id, level, title, detail, source = "") => flags.push({ id, level, title, detail, source });
  const companyUrl = publicCompanyUrl(profile.company_number);
  const status = profile.company_status;
  const daysUntil = value => value ? Math.ceil((Date.parse(value) - now.getTime()) / 86400000) : NaN;
  const recent = value => Number.isFinite(daysUntil(value)) && daysUntil(value) <= 0 && daysUntil(value) >= -90;
  if (status && status !== "active") add("status", ["liquidation", "administration", "receivership", "insolvency-proceedings"].includes(status) ? "red" : "amber", `Company status: ${status.replaceAll("-", " ")}`, "Review the current register status and relevant filings.", companyUrl);
  else if (status === "active") add("status", "green", "Active on the register", "This describes register status only; it is not a diligence conclusion.", companyUrl);
  if (profile.company_status_detail === "active-proposal-to-strike-off") add("strike-off", "red", "Proposal to strike off", "Check the notice and any subsequent filings.", publicCompanyUrl(profile.company_number, "/filing-history"));
  if (profile.date_of_cessation) add("cessation", "red", "Cessation date recorded", `Recorded ${profile.date_of_cessation}. Verify the register status and history.`, companyUrl);
  if (profile.accounts?.next_accounts?.overdue === true) add("accounts", "red", "Accounts marked overdue", `Due ${profile.accounts.next_accounts.due_on || "date not supplied"}${Number.isFinite(daysUntil(profile.accounts.next_accounts.due_on)) ? ` (${Math.max(0, -daysUntil(profile.accounts.next_accounts.due_on))} days ago)` : ""}. Last period end: ${profile.accounts?.last_accounts?.period_end_on || "not shown"}; type: ${profile.accounts?.last_accounts?.type || "not shown"}.`, companyUrl);
  else if (profile.accounts?.next_accounts?.due_on) {
    const days = Math.ceil((Date.parse(profile.accounts.next_accounts.due_on) - now.getTime()) / 86400000);
    if (Number.isFinite(days) && days >= 0 && days <= 30) add("accounts", "amber", "Accounts due soon", `Due ${profile.accounts.next_accounts.due_on} (${days} days). Last period end: ${profile.accounts?.last_accounts?.period_end_on || "not shown"}; type: ${profile.accounts?.last_accounts?.type || "not shown"}.`, companyUrl);
    else if (Number.isFinite(days) && days < 0) add("accounts-date", "amber", "Accounts due date has passed", `Due ${profile.accounts.next_accounts.due_on}, but the register has not marked this overdue. Verify the latest filing and applicable obligation.`, publicCompanyUrl(profile.company_number, "/filing-history"));
  } else add("accounts", "grey", "Accounts deadline not shown", "Check the filing history and the company's filing obligations.", publicCompanyUrl(profile.company_number, "/filing-history"));
  if (profile.accounts?.last_accounts?.period_end_on && daysUntil(profile.accounts.last_accounts.period_end_on) < -540) add("accounts-old", "amber", "Latest accounts period is over 18 months old", `Last period ended ${profile.accounts.last_accounts.period_end_on}. Check applicable filing obligations and later filings.`, publicCompanyUrl(profile.company_number, "/filing-history"));
  if (profile.confirmation_statement?.overdue === true) add("confirmation", "red", "Confirmation statement marked overdue", `Due ${profile.confirmation_statement.next_due || "date not supplied"}${Number.isFinite(daysUntil(profile.confirmation_statement.next_due)) ? ` (${Math.max(0, -daysUntil(profile.confirmation_statement.next_due))} days ago)` : ""}. Last made up to: ${profile.confirmation_statement.last_made_up_to || "not shown"}.`, companyUrl);
  else if (profile.confirmation_statement?.next_due) {
    const days = Math.ceil((Date.parse(profile.confirmation_statement.next_due) - now.getTime()) / 86400000);
    if (Number.isFinite(days) && days >= 0 && days <= 30) add("confirmation", "amber", "Confirmation statement due soon", `Due ${profile.confirmation_statement.next_due} (${days} days). Last made up to: ${profile.confirmation_statement.last_made_up_to || "not shown"}.`, companyUrl);
    else if (Number.isFinite(days) && days < 0) add("confirmation-date", "amber", "Confirmation statement due date has passed", `Due ${profile.confirmation_statement.next_due}, but the register has not marked this overdue. Verify the latest filing.`, publicCompanyUrl(profile.company_number, "/filing-history"));
  } else add("confirmation", "grey", "Confirmation statement deadline not shown", "Check the filing history and the company's filing obligations.", publicCompanyUrl(profile.company_number, "/filing-history"));
  if (profile.registered_office_is_in_dispute) add("office-dispute", "red", "Registered office address disputed", "Check the address status on the register.", companyUrl);
  if (profile.undeliverable_registered_office_address) add("office-undeliverable", "red", "Registered office mail undeliverable", "Check the address status on the register.", companyUrl);
  if (sections.insolvency?.data?.cases?.length || sections.insolvency?.data?.status) add("insolvency", "red", "Insolvency record found", "Review the case details and dates.", publicCompanyUrl(profile.company_number, "/filing-history"));
  const charges = sections.charges?.data?.items;
  if (Array.isArray(charges)) {
    const open = charges.filter(item => ["outstanding", "part-satisfied"].includes(item.status));
    for (const [index, charge] of open.entries()) add(`charge-${charge.id || index}`, "amber", `${charge.status === "part-satisfied" ? "Part-satisfied" : "Outstanding"} charge`, `Created ${charge.created_on || "date not shown"}; secured party: ${(charge.persons_entitled || []).map(person => person.name).filter(Boolean).join(", ") || "not shown"}. The register does not establish the current debt balance.`, publicCompanyUrl(profile.company_number, `/charges/${encodeURIComponent(charge.id || "")}`));
  }
  for (const [name, section] of Object.entries(sections)) {
    if (section?.status === "partial") add(`${name}-partial`, "grey", `Additional ${name.replace(/([A-Z])/g, " $1").toLowerCase()} records not checked`, "Only the first page was checked. Review the full register.", publicCompanyUrl(profile.company_number, name === "charges" ? "/charges" : name === "officers" ? "/officers" : name === "psc" || name === "pscStatements" ? "/persons-with-significant-control" : "/filing-history"));
    if (section?.status === "unavailable") add(`${name}-unavailable`, "grey", `${name.replace(/([A-Z])/g, " $1")} records unavailable`, "Refresh this check or review the source register.", companyUrl);
  }
  const pscStatements = sections.pscStatements?.data?.items || [];
  if (sections.psc?.status === "ok" && !(sections.psc.data?.items || []).some(person => !person.ceased_on && !person.ceased) && !pscStatements.some(statement => !statement.ceased_on)) add("psc-none", "grey", "No current PSC entry returned", "This does not establish that nobody controls the company. Verify the register and transaction documents.", publicCompanyUrl(profile.company_number, "/persons-with-significant-control"));
  for (const [index, statement] of pscStatements.entries()) if (!statement.ceased_on) add(`psc-statement-${statement.etag || index}`, "amber", "Active PSC statement", `${statement.statement || "Statement details not shown"}. Check its meaning on the register.`, publicCompanyUrl(profile.company_number, "/persons-with-significant-control"));
  for (const [index, person] of (sections.psc?.data?.items || []).entries()) if (!person.ceased_on && !person.ceased && !(person.natures_of_control || []).length) add(`psc-control-${person.links?.self || index}`, "amber", "PSC control detail not shown", `${person.name || person.description || "PSC entry"}: verify the nature of control.`, publicCompanyUrl(profile.company_number, "/persons-with-significant-control"));
  for (const [index, officer] of (sections.officers?.data?.items || []).entries()) {
    const event = recent(officer.resigned_on) ? "resignation" : !officer.resigned_on && recent(officer.appointed_on) ? "appointment" : "";
    if (event) add(`officer-${officer.links?.officer?.appointments || index}-${event}`, "amber", `Recent officer ${event}`, `${officer.name || "Officer"}: ${event === "resignation" ? officer.resigned_on : officer.appointed_on}. Verify authority and transaction documents.`, publicCompanyUrl(profile.company_number, "/officers"));
  }
  for (const [index, filing] of (sections.filings?.data?.items || []).entries()) if (recent(filing.date) && ["resolution", "capital", "mortgage", "insolvency"].includes(filing.category)) add(`filing-${filing.transaction_id || index}`, "amber", `Recent ${filing.category} filing`, `${filing.date}: ${filing.description || filing.type || "Review the original filing"}.`, publicCompanyUrl(profile.company_number, "/filing-history"));
  return flags.sort((a, b) => ({ red: 0, amber: 1, green: 2, grey: 3 }[a.level] - { red: 0, amber: 1, green: 2, grey: 3 }[b.level]));
}

export async function searchCompanies(query, startIndex = 0) {
  const q = String(query || "").trim();
  if (q.length < 2 || q.length > 100) throw new RadarError("Enter at least two characters to search.", 400);
  if (!Number.isInteger(startIndex) || startIndex < 0) throw new RadarError("Invalid search page.", 400);
  const response = await companiesHouseGet(`/search/companies?q=${encodeURIComponent(q)}&items_per_page=20&start_index=${startIndex}`);
  if (!response) return { results: [], total: 0 };
  const data = await response.json();
  return { results: (data.items || []).map(item => ({ number: item.company_number, name: item.title, status: item.company_status, type: item.company_type, address: item.address_snippet || address(item.address), incorporatedOn: item.date_of_creation })), total: Number.isFinite(data.total_results) ? data.total_results : null };
}

export async function loadCompany(number) {
  const valid = companyNumber(number);
  if (!valid) throw new RadarError("Enter a valid company number.", 400);
  const profileResponse = await companiesHouseGet(`/company/${valid}`);
  if (!profileResponse) throw new RadarError("Company not found on the register.", 404);
  const profile = await profileResponse.json();
  const resources = {
    officers: profile.links?.officers && `/company/${valid}/officers?items_per_page=100`,
    psc: profile.links?.persons_with_significant_control && `/company/${valid}/persons-with-significant-control?items_per_page=100`,
    pscStatements: profile.links?.persons_with_significant_control_statements && `/company/${valid}/persons-with-significant-control-statements?items_per_page=100`,
    charges: profile.links?.charges && `/company/${valid}/charges?items_per_page=100`,
    insolvency: profile.links?.insolvency && `/company/${valid}/insolvency`,
    filings: profile.links?.filing_history && `/company/${valid}/filing-history?items_per_page=100`
  };
  const entries = await Promise.all(Object.entries(resources).map(async ([name, path]) => {
    if (!path) return [name, { status: "not-listed", data: null }];
    try {
      const response = await companiesHouseGet(path);
      const data = response ? await response.json() : null;
      const count = data?.total_count ?? data?.total_results;
      const partial = Array.isArray(data?.items) && Number.isFinite(count) && count > data.items.length;
      return [name, { status: !response ? "not-listed" : partial ? "partial" : "ok", data }];
    }
    catch { return [name, { status: "unavailable", data: null }]; }
  }));
  const sections = Object.fromEntries(entries);
  const filings = ordered(sections.filings.data?.items || []).map(normalizeFiling);
  const normalized = {
    number: valid, name: profile.company_name, status: profile.company_status, statusDetail: profile.company_status_detail,
    type: profile.type, jurisdiction: profile.jurisdiction, incorporatedOn: profile.date_of_creation,
    address: address(profile.registered_office_address), sicCodes: profile.sic_codes || [], previousNames: profile.previous_company_names || [],
    accounts: profile.accounts || null, confirmationStatement: profile.confirmation_statement || null,
    officers: (Array.isArray(sections.officers.data?.items) ? sections.officers.data.items : []).filter(item => !item.resigned_on).map(item => ({ name: item.name, role: item.officer_role, appointedOn: item.appointed_on })),
    officerTotal: sections.officers.data?.total_results ?? null,
    psc: (Array.isArray(sections.psc.data?.items) ? sections.psc.data.items : []).filter(item => !item.ceased_on && !item.ceased).map(item => ({ name: item.name || item.description, kind: item.kind, control: item.natures_of_control || [], notifiedOn: item.notified_on })),
    pscStatements: (Array.isArray(sections.pscStatements.data?.items) ? sections.pscStatements.data.items : []).filter(item => !item.ceased_on).map(item => ({ statement: item.statement, notifiedOn: item.notified_on })),
    charges: (Array.isArray(sections.charges.data?.items) ? sections.charges.data.items : []).filter(item => ["outstanding", "part-satisfied"].includes(item.status)).map(item => ({ id: item.id, status: item.status, createdOn: item.created_on, entitled: (item.persons_entitled || []).map(person => person.name) })),
    insolvency: sections.insolvency.data ? { status: sections.insolvency.data.status, cases: (sections.insolvency.data.cases || []).map(item => ({ type: item.type, number: item.number, dates: item.dates })) } : null,
    filings, sections: Object.fromEntries(entries.map(([name, value]) => [name, value.status])),
    fetchedAt: new Date().toISOString(), url: publicCompanyUrl(valid)
  };
  normalized.flags = buildFlags(profile, sections);
  return normalized;
}

export async function loadDocument(number, documentId) {
  const valid = companyNumber(number);
  if (!valid || !/^[A-Za-z0-9_-]{10,100}$/.test(documentId || "")) throw new RadarError("Invalid document request.", 400);
  const metadataResponse = await companiesHouseGet(`/document/${documentId}`, { document: true });
  if (!metadataResponse) throw new RadarError("Document not found.", 404);
  const metadata = await metadataResponse.json();
  if (metadata.company_number !== valid) throw new RadarError("Document does not belong to this company.", 404);
  const pdf = metadata.resources?.["application/pdf"];
  if (!pdf) throw new RadarError("A PDF is not available for this filing.", 404);
  if (pdf.content_length > 12_000_000) throw new RadarError("This document is too large for in-app download. Open it on Companies House.", 413);
  const response = await companiesHouseGet(`/document/${documentId}/content`, { document: true, accept: "application/pdf", redirect: "manual" });
  if (response?.status !== 302) throw new RadarError("Document download is temporarily unavailable.", 502);
  const location = new URL(response.headers.get("location") || "");
  if (location.protocol !== "https:" || location.username || location.password || !["amazonaws.com", "company-information.service.gov.uk", "companieshouse.gov.uk"].some(domain => location.hostname === domain || location.hostname.endsWith(`.${domain}`))) throw new RadarError("Invalid document location.", 502);
  let file;
  try { file = await fetch(location, { signal: AbortSignal.timeout(15000) }); }
  catch { throw new RadarError("Document download is temporarily unavailable.", 502); }
  if (!file.ok || Number(file.headers.get("content-length") || 0) > 12_000_000) throw new RadarError("Document could not be downloaded. Open it on Companies House.", 502);
  const reader = file.body.getReader();
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 12_000_000) { await reader.cancel(); throw new RadarError("Document is too large for in-app download.", 413); }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}
