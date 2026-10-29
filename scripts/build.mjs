import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const siteRoot = process.cwd();
const distRoot = path.join(siteRoot, "dist");
const issues = JSON.parse(await readFile(path.join(distRoot, "issues.json"), "utf8"));
if (!Array.isArray(issues) || !issues.length || issues.some(issue => !issue.id || !issue.title)) {
  throw new Error("Expected a non-empty collection of valid DealLogic issues.");
}

const projectFirebaseConfig = JSON.parse(await readFile(path.join(siteRoot, "firebase.web.json"), "utf8"));
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || projectFirebaseConfig.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || projectFirebaseConfig.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || projectFirebaseConfig.projectId,
  appId: process.env.FIREBASE_APP_ID || projectFirebaseConfig.appId
};
const configured = Object.values(firebaseConfig).every(Boolean);
await writeFile(path.join(distRoot, "firebase-config.js"),
  `window.DEALLOGIC_FIREBASE_CONFIG = ${JSON.stringify(configured ? firebaseConfig : null)};\n`);
console.log(`Prepared ${issues.length} DealLogic issue records.`);
