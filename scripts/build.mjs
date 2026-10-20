import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
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

try {
  await access(dataRoot);
} catch {
  console.log("No source data directory found; retaining the checked-in dist/issues.json catalogue.");
  process.exit(0);
}

const issueFiles = await findIssues(dataRoot);
const issues = await Promise.all(issueFiles.map(async (file) => JSON.parse(await readFile(file, "utf8"))));

await mkdir(distRoot, { recursive: true });
await writeFile(path.join(distRoot, "issues.json"), `${JSON.stringify(issues, null, 2)}\n`);
console.log(`Prepared ${issues.length} DealLogic issue records.`);
