import { access, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const siteRoot = process.cwd();
const distRoot = path.join(siteRoot, "dist");
const indexPath = path.join(distRoot, "index.html");
const indexSource = await readFile(indexPath, "utf8");
const activeScripts = [
  "app-storage.js",
  "app-theme.js",
  "action-registry.js",
  "deal-hub-v8.js",
  "workspace-redesign.js",
  "company-radar.js",
  "deal-logic-templates.js",
  "debt-facilities.js",
  "action-playbooks.js",
  "onboarding.js"
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
const themeIndex = indexSource.indexOf("./app-theme.js");
const actionRegistryIndex = indexSource.indexOf("./action-registry.js");
const hubIndex = indexSource.indexOf("./deal-hub-v8.js");
const templatesIndex = indexSource.indexOf("./deal-logic-templates.js");
const playbooksIndex = indexSource.indexOf("./action-playbooks.js");
const onboardingIndex = indexSource.indexOf("./onboarding.js");
const debtIndex = indexSource.indexOf("./debt-facilities.js");
if (!(storageIndex >= 0 && storageIndex < themeIndex && themeIndex < actionRegistryIndex && actionRegistryIndex < hubIndex && hubIndex < templatesIndex && templatesIndex < debtIndex && debtIndex < playbooksIndex && playbooksIndex < onboardingIndex)) {
  throw new Error("Runtime scripts are not loaded in their required order.");
}

const registrySource = await readFile(path.join(distRoot, "action-registry.js"), "utf8");
const registrySandbox = { window: {} };
vm.runInNewContext(registrySource, registrySandbox, { filename: "action-registry.js" });
const playbookTopics = registrySandbox.window.DealLogicActionRegistry?.topics || [];
const expectedCounts = new Map([["customer-change-of-control",9],["missing-ip-assignment",11],["option-holders",9],["threatened-litigation",14],["debt-facilities-repayment",14]]);
for (const [topicId, expectedCount] of expectedCounts) {
  const topic = playbookTopics.find(item => item.id === topicId);
  if (!topic || topic.actions.length !== expectedCount) throw new Error(`Expected ${expectedCount} actions for ${topicId}.`);
}
if (playbookTopics.flatMap(topic => topic.actions).length !== 57) throw new Error("Expected 57 issue-playbook actions.");

const storageConsumers = [
  indexPath,
  path.join(distRoot, "app-theme.js"),
  path.join(distRoot, "deal-hub-v8.js"),
  path.join(distRoot, "workspace-redesign.js"),
  path.join(distRoot, "deal-logic-templates.js"),
  path.join(distRoot, "debt-facilities.js"),
  path.join(distRoot, "action-playbooks.js"),
  path.join(distRoot, "onboarding.js")
];
for (const filePath of storageConsumers) {
  const source = await readFile(filePath, "utf8");
  if (/\blocalStorage\b/.test(source)) {
    throw new Error(`${path.basename(filePath)} bypasses the DealLogicStorage adapter.`);
  }
}

console.log(`Checked ${activeScripts.length} runtime scripts and the browser-storage boundary.`);
