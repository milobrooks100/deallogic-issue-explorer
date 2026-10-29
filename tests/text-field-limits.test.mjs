import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("every active editable text field declares a character limit", () => {
  for (const file of ["index.html", "account.js", "deal-hub.js", "company-radar.js", "workspace-redesign.js", "action-playbooks.js", "debt-facilities.js"]) {
    const source = readFileSync(new URL(`../dist/${file}`, import.meta.url), "utf8");
    const tags = source.match(/<(?:input|textarea)\b[^>]*>/g) || [];
    for (const tag of tags) {
      const type = tag.match(/\btype="([^"]+)"/)?.[1] || "text";
      if (/^<textarea\b/.test(tag) || ["text", "email", "password", "search", "url"].includes(type)) {
        assert.match(tag, /\bmaxlength="\d+"/, `${file}: ${tag.slice(0, 100)}`);
      }
    }
  }
  const index = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(index, /input\.id = "other-consent-prospects"; input\.maxLength = 200/);
  assert.match(index, /title\.maxLength = 60/);
  assert.match(index, /description\.maxLength = 160/);
});
