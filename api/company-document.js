import { RadarError, loadDocument } from "../lib/company-radar.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });
  const view = request.query.view === "1";
  try {
    const file = await loadDocument(request.query.number, request.query.id);
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `${view ? "inline" : "attachment"}; filename="companies-house-${String(request.query.number).replace(/[^A-Za-z0-9]/g, "")}.pdf"`);
    response.setHeader("Cache-Control", "private, no-store");
    return response.status(200).send(file);
  } catch (error) {
    const status = error instanceof RadarError ? error.status : 500;
    if (!view) return response.status(status).json({ error: error.message || "Download unavailable." });
    const number = String(request.query.number || "").toUpperCase();
    const historyUrl = /^[A-Z0-9]{8}$/.test(number)
      ? `https://find-and-update.company-information.service.gov.uk/company/${number}/filing-history`
      : "https://find-and-update.company-information.service.gov.uk/";
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'");
    return response.status(status).send(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Filing PDF unavailable</title><main style="font:16px system-ui;max-width:36rem;margin:4rem auto;padding:0 1rem;line-height:1.6"><h1>Filing PDF unavailable</h1><p>This document could not be opened here. It may be unavailable or exceed the app's size limit.</p><p><a href="${historyUrl}">View this company's filing history on Companies House</a></p></main></html>`);
  }
}
