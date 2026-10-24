import { RadarError, loadDocument } from "../lib/company-radar.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });
  try {
    const file = await loadDocument(request.query.number, request.query.id);
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename="companies-house-${String(request.query.number).replace(/[^A-Za-z0-9]/g, "")}.pdf"`);
    response.setHeader("Cache-Control", "private, no-store");
    return response.status(200).send(file);
  } catch (error) {
    return response.status(error instanceof RadarError ? error.status : 500).json({ error: error.message || "Download unavailable." });
  }
}
