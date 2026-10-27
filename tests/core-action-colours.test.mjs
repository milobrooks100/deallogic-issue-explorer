import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("all 13 core response icons keep their fixed colours in every app theme", () => {
  const fixed = readFileSync(new URL("../dist/workflow-colours.css", import.meta.url), "utf8");
  const themes = readFileSync(new URL("../dist/app-theme.css", import.meta.url), "utf8");
  for (let index = 1; index <= 13; index++) {
    assert.match(fixed, new RegExp(`\\.library-view \\.action-item:nth-child\\(${index}\\) \\.action-symbol \\{ background: #[0-9a-f]{6}; color: #[0-9a-f]{6}; \\}`));
  }
  assert.doesNotMatch(themes, /\.library-view \.action-item[^\n]*\.action-symbol/);
});
