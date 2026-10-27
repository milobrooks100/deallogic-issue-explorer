import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the Deal Map start tile stays white in every theme", () => {
  const base = readFileSync(new URL("../dist/deal-hub-v14.css", import.meta.url), "utf8");
  const themed = readFileSync(new URL("../dist/app-theme.css", import.meta.url), "utf8");
  assert.match(base, /\.project-start\{background:#fff;/);
  assert.doesNotMatch(themed, /\.project-start/);
});
