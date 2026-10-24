import { RadarError, loadCompany } from "../lib/company-radar.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });
  try {
    const result = await loadCompany(request.query.number);
    response.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
    return response.status(200).json(result);
  } catch (error) {
    return response.status(error instanceof RadarError ? error.status : 500).json({ error: error.message || "Company data unavailable." });
  }
}
