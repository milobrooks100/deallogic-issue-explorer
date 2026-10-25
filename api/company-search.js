import { RadarError, searchCompanies } from "../lib/company-radar.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });
  try {
    const result = await searchCompanies(request.query.q, Number(request.query.start_index ?? 0));
    response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response.status(200).json(result);
  } catch (error) {
    return response.status(error instanceof RadarError ? error.status : 500).json({ error: error.message || "Search unavailable." });
  }
}
