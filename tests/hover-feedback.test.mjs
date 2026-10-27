import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("workspace controls have shared hover feedback without styling disabled buttons", () => {
  const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../dist/hover-feedback.css", import.meta.url), "utf8");
  assert.ok(html.indexOf("./hover-feedback.css") > html.indexOf("./app-theme.css"));
  assert.match(css, /@media \(hover: hover\)/);
  assert.match(css, /button:not\(:disabled\):hover/);
  for (const selector of [".map .area", ".hub-export button", ".transaction-side-toggle", ".transaction-side-options button", ".library-tabs button", ".playbook-tabs button"]) {
    assert.ok(css.includes(selector), `${selector} has hover styling`);
  }
  assert.match(css, /prefers-reduced-motion: no-preference/);
});
