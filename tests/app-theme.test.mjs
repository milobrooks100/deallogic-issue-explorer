import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../dist/app-theme.js", import.meta.url), "utf8");

function createThemeSession(saved) {
  const values = new Map(saved ? [["deallogic:app-theme", saved]] : []);
  const inputs = Object.fromEntries(["grey", "navy", "forest"].map(theme => [theme, { checked: false }]));
  const handlers = {};
  const meta = { content: "", setAttribute(name, value) { if (name === "content") this.content = value; } };
  const status = { textContent: "" };
  const document = {
    documentElement: { dataset: {} },
    querySelector(selector) {
      if (selector === 'meta[name="theme-color"]') return meta;
      return inputs[selector.match(/value="([^"]+)"/)?.[1]] || null;
    },
    getElementById(id) { return id === "theme-status" ? status : null; },
    addEventListener(name, handler) { handlers[name] = handler; }
  };
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  vm.runInNewContext(source, { document, DealLogicStorage: storage, Object }, { filename: "app-theme.js" });
  handlers.DOMContentLoaded();
  return { document, values, inputs, handlers, meta, status };
}

test("saved app colour is applied before settings render and selected in the picker", () => {
  const session = createThemeSession("navy");
  assert.equal(session.document.documentElement.dataset.appTheme, "navy");
  assert.equal(session.meta.content, "#f1f5f9");
  assert.equal(session.inputs.navy.checked, true);
});

test("changing app colour persists and an unknown saved value falls back to grey", () => {
  const session = createThemeSession("invalid");
  assert.equal(session.document.documentElement.dataset.appTheme, "grey");
  session.handlers.change({ target: { value: "forest", matches: selector => selector === 'input[name="app-theme"]' } });
  assert.equal(session.document.documentElement.dataset.appTheme, "forest");
  assert.equal(session.values.get("deallogic:app-theme"), "forest");
  assert.equal(session.meta.content, "#f1f5ef");
  assert.equal(session.status.textContent, "Dark green colour selected.");
});
