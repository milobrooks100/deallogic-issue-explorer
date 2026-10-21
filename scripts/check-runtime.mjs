import { access, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const siteRoot = process.cwd();
const distRoot = path.join(siteRoot, "dist");
const indexPath = path.join(distRoot, "index.html");
const indexSource = await readFile(indexPath, "utf8");
const activeScripts = [
  "app-storage.js",
  "deal-hub-v8.js",
  "workspace-redesign.js",
  "deal-logic-templates.js"
];

for (const filename of activeScripts) {
  const filePath = path.join(distRoot, filename);
  await access(filePath);
  const source = await readFile(filePath, "utf8");
  new vm.Script(source, { filename });
  if (!indexSource.includes(`./${filename}`)) {
    throw new Error(`${filename} is not referenced by dist/index.html`);
  }
}

const storageIndex = indexSource.indexOf("./app-storage.js");
const hubIndex = indexSource.indexOf("./deal-hub-v8.js");
const templatesIndex = indexSource.indexOf("./deal-logic-templates.js");
if (!(storageIndex >= 0 && storageIndex < hubIndex && hubIndex < templatesIndex)) {
  throw new Error("Runtime scripts are not loaded in their required order.");
}

const storageConsumers = [
  indexPath,
  path.join(distRoot, "deal-hub-v8.js"),
  path.join(distRoot, "workspace-redesign.js"),
  path.join(distRoot, "deal-logic-templates.js")
];
for (const filePath of storageConsumers) {
  const source = await readFile(filePath, "utf8");
  if (/\blocalStorage\b/.test(source)) {
    throw new Error(`${path.basename(filePath)} bypasses the DealLogicStorage adapter.`);
  }
}

console.log(`Checked ${activeScripts.length} runtime scripts and the browser-storage boundary.`);
