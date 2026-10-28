import { AccountLifecycleError, changeAccount } from "../lib/account-lifecycle.js";

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }
  const token = /^Bearer (\S+)$/i.exec(request.headers.authorization || "")?.[1];
  try {
    const result = await changeAccount({ action: request.body?.action, idToken: token });
    return response.status(200).json(result);
  } catch (error) {
    return response.status(error instanceof AccountLifecycleError ? error.status : 500)
      .json({ error: error instanceof AccountLifecycleError ? error.message : "Account operation could not be completed. Please retry." });
  }
}
