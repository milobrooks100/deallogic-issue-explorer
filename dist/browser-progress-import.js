const projectStoreKey = "deallogic:deal-projects:v1";
const issueKey = /^deallogic:deal-project:([^:]+):issue:(.+)$/;

function parse(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function hasHubProgress(project) {
  const hub = project?.hub;
  return [hub?.issues, hub?.actions, hub?.groups].some(items => Array.isArray(items) && items.length);
}

// Prepare additive writes; never copy guest preferences or overwrite an account key.
export function prepareBrowserProgressImport(guestEntries, accountValue, makeId) {
  const guest = new Map(guestEntries);
  const source = parse(guest.get(projectStoreKey));
  const target = parse(accountValue);
  if (!source || !Array.isArray(source.projects)) throw new Error("Browser deal progress could not be read.");
  if (accountValue && (!target || !Array.isArray(target.projects))) throw new Error("Account deal progress could not be read safely.");

  const account = target || { version: 1, onboardingSeen: true, activeProjectId: "quick-workspace", projects: [{ id: "quick-workspace", name: "Quick workspace", side: "Balanced", isQuick: true, createdAt: new Date().toISOString(), hub: { issues: [], actions: [], groups: [] } }] };
  const existingIds = new Set(account.projects.map(project => project.id));
  const mappings = new Map();
  const writes = [];
  const issueEntries = guestEntries.filter(([key]) => issueKey.test(key));
  const usedNames = new Set(account.projects.map(project => project.name));
  const uniqueName = name => {
    let candidate = name, suffix = 2;
    while (usedNames.has(candidate)) candidate = `${name} (${suffix++})`;
    usedNames.add(candidate);
    return candidate;
  };

  for (const project of source.projects) {
    if (!project || typeof project.id !== "string") continue;
    const hasAnswers = issueEntries.some(([key]) => issueKey.exec(key)?.[1] === project.id);
    if (!hasAnswers && !hasHubProgress(project)) continue;
    let id;
    do { id = makeId(); } while (existingIds.has(id));
    existingIds.add(id);
    mappings.set(project.id, id);
    account.projects.push({
      ...project,
      id,
      name: uniqueName(project.isQuick || project.id === "quick-workspace" ? "Imported quick workspace" : project.name || "Imported deal"),
      isQuick: false,
      createdAt: new Date().toISOString()
    });
  }

  for (const [key, value] of issueEntries) {
    const match = issueKey.exec(key);
    const newId = mappings.get(match[1]);
    if (newId) writes.push([`deallogic:deal-project:${newId}:issue:${match[2]}`, value]);
  }
  if (!mappings.size) return { count: 0, writes: [] };
  writes.push([projectStoreKey, JSON.stringify(account)]);
  return { count: mappings.size, writes };
}
