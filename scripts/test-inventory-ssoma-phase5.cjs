const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("catalog defines the five inventory families and three SSOMA groups", () => {
  const source = read("src/modules/Elements/inventoryCatalog.ts");
  for (const family of [
    "electricalEquipment",
    "tools",
    "ladders",
    "materials",
    "electricalHarness",
  ]) {
    assert.match(source, new RegExp(`key: "${family}"`));
  }
  for (const group of ["workwear", "ppe", "safety"]) {
    assert.match(source, new RegExp(`key: "${group}"`));
  }
});

test("area pages reuse the existing catalog engine and shared UI", () => {
  const page = read("src/modules/Elements/CatalogAreaPage.tsx");
  assert.match(page, /ElementTable/);
  assert.match(page, /<Panel>/);
  assert.match(page, /HeaderPanel/);
  assert.match(page, /DeleteConfirmDialog/);
  assert.match(page, /element\.controlType === "consumable"/);
  assert.match(page, /inventory\.manage/);
});

test("new and edit forms support inventory families and ESE control", () => {
  for (const file of [
    "src/modules/Elements/NewElement.tsx",
    "src/modules/Elements/Element.tsx",
  ]) {
    const source = read(file);
    assert.match(source, /electricalEquipment/);
    assert.match(source, /electricalHarness/);
    assert.match(source, /safetyControlType/);
    assert.match(source, /consumable/);
    assert.match(source, /returnable/);
  }
});

test("routes separate areas while preserving historical inventory links", () => {
  const app = read("src/App.tsx");
  const access = read("src/permissions/AccessProvider.tsx");
  assert.match(app, /ssoma-resources/);
  assert.match(app, /legacyFamily/);
  assert.match(app, /path="elements"/);
  assert.match(access, /"ssoma-resources": "inventory"/);
});

test("sidebar exposes both areas with the existing inventory permission", () => {
  const sidebar = read("src/sections/Sidebar.tsx");
  assert.match(sidebar, /Recursos SSOMA/);
  assert.match(sidebar, /\/admin\/ssoma-resources/);
  assert.match(sidebar, /permission="inventory\.view"/);
});
