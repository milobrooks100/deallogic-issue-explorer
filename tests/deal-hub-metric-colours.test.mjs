import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Deal Hub summary colours do not follow the app theme", () => {
  const fixed = readFileSync(new URL("../dist/workflow-colours.css", import.meta.url), "utf8");
  const themed = readFileSync(new URL("../dist/app-theme.css", import.meta.url), "utf8");
  assert.match(fixed, /\.workspace-metrics\s*\{\s*background:\s*linear-gradient\(/);
  for (let index = 1; index <= 4; index++) {
    assert.match(fixed, new RegExp(`\\.metric:nth-child\\(${index}\\) \\.metric-icon \\{ background: #[0-9a-f]{6}; color: #[0-9a-f]{6}; \\}`));
  }
  assert.doesNotMatch(themed, /\.workspace-metrics|\.metric:nth-child\([^)]*\) \.metric-icon/);
});
