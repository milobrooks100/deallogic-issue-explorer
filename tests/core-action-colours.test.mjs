import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const fixed = readFileSync(new URL("../dist/workflow-colours.css", import.meta.url), "utf8");
const registrySource = readFileSync(new URL("../dist/action-registry.js", import.meta.url), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(registrySource, sandbox);

// Pin the agreed palette so a missing mapping or accidental colour change fails.
const palette = {
  search: ["#e7eef2", "#547083"],
  wrench: ["#f1eaf7", "#76628d"],
  handshake: ["#f8eee6", "#986d57"],
  "circle-check": ["#e8f1e8", "#55765d"],
  "file-pen-line": ["#e6f0f7", "#567a94"],
  "shield-check": ["#f8f0d9", "#8d7441"],
  banknote: ["#f6e8ed", "#956477"],
  "file-search": ["#e6f2f2", "#4e777a"],
  "lock-keyhole": ["#eeeaf5", "#706384"],
  "arrow-down-up": ["#f3ece4", "#8b6c4e"],
  "calendar-check": ["#e7f0ec", "#537665"],
  "circle-arrow-right": ["#e9edf7", "#576f9a"],
  "arrow-left-right": ["#f2e9e4", "#8a6255"],
  ellipsis: ["#eef0ef", "#65716e"]
};

test("every registered core icon has its fixed palette shared across all three action views", () => {
  const icons = [...new Set(Object.values(sandbox.window.DealLogicActionRegistry.coreActionIcons))];
  assert.deepEqual(icons.sort(), Object.keys(palette).sort());
  const rules = [...fixed.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const icon of icons) {
    const selectors = [
      `.library-view .action-item[data-core-icon="${icon}"] .action-symbol`,
      `.playbook-card[data-core-icon="${icon}"] .action-symbol`,
      `.logic-action[data-core-icon="${icon}"] .logic-icon`
    ];
    if (icon !== "ellipsis") selectors.push(`.explore-categories .category-symbol[data-core-icon="${icon}"]`);
    const matching = rules.filter(([, selector]) => selector.split(",").some(part => part.trim() === selectors[0]));
    assert.equal(matching.length, 1, `${icon} has one canonical palette rule`);
    const [, selector, declarations] = matching[0];
    assert.deepEqual(selector.split(",").map(part => part.trim()).sort(), selectors.sort(), `${icon} shares its rule across views`);
    assert.equal(declarations.match(/\bbackground:\s*(#[0-9a-f]{6})\s*;/)?.[1], palette[icon][0], `${icon} background`);
    assert.equal(declarations.match(/\bcolor:\s*(#[0-9a-f]{6})\s*;/)?.[1], palette[icon][1], `${icon} foreground`);
  }
});

test("app themes do not override Core M&A library icon colours", () => {
  const themes = readFileSync(new URL("../dist/app-theme.css", import.meta.url), "utf8");
  assert.doesNotMatch(themes, /\.library-view \.action-item[^\n]*\.action-symbol/);
});
