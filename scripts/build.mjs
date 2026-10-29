import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteRoot = process.cwd();
const projectRoot = path.resolve(siteRoot, "..");
const dataRoot = path.join(projectRoot, "data");
const distRoot = path.join(siteRoot, "dist");

async function findIssues(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findIssues(entryPath);
    if (entry.isFile() && entry.name.endsWith(".json")) return [entryPath];
    return [];
  }));
  return nested.flat();
}

let issues;
try {
  const issueFiles = await findIssues(dataRoot);
  issues = await Promise.all(issueFiles.map(async (file) => JSON.parse(await readFile(file, "utf8"))));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  // Public checkouts ship prepared issue data; the authoring folder is optional.
  issues = JSON.parse(await readFile(path.join(distRoot, "issues.json"), "utf8"));
}
if (!Array.isArray(issues) || !issues.length || issues.some(issue => !issue.id || !issue.title)) {
  throw new Error("Expected a non-empty collection of valid DealLogic issues.");
}

// The Option Holders questionnaire uses its tailored action registry. Remove
// the retired warranty from legacy issue data too, including on future builds.
const optionHolders = issues.find(issue => issue.id === "option-holders");
if (optionHolders) {
  optionHolders.recommended_actions = (optionHolders.recommended_actions || [])
    .filter(action => action.id !== "capitalisation-warranty");
  for (const rule of optionHolders.decision_rules || []) {
    rule.then.action_ids = rule.then.action_ids.filter(id => id !== "capitalisation-warranty");
    if (rule.id === "make-material-option-mechanics-a-cp") {
      rule.then.explanation = "Where awards remain capable of affecting the agreed acquisition, completion protection should be considered.";
    }
  }
  for (const position of optionHolders.positions || []) {
    position.action_ids = position.action_ids.filter(id => id !== "capitalisation-warranty");
  }
}

await mkdir(distRoot, { recursive: true });
await writeFile(path.join(distRoot, "issues.json"), `${JSON.stringify(issues, null, 2)}\n`);
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
