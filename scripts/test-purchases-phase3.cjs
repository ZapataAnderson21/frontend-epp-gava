const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("Purchases sidebar groups the three permission-filtered entries", () => {
  const source = read("src/sections/Sidebar.tsx");

  assert.match(
    source,
    /can\("suppliers\.view"\) \|\| can\("resources\.view"\) \|\| can\("orders\.view"\)/,
  );
  for (const [label, route] of [
    ["Proveedores", "/admin/suppliers"],
    ["Recursos de OC", "/admin/resources"],
    ["Órdenes de compra", "/admin/purchase-orders"],
  ]) {
    assert.equal(source.match(new RegExp(`label="${label}"`, "g"))?.length, 1);
    assert.match(source, new RegExp(`href="${route}"`));
  }
  assert.match(source, /ariaExpanded=\{isPurchasesOpen\}/);
  assert.match(source, /ariaControls="purchases-sidebar-menu"/);
});

test("global purchase order route belongs to orders permissions", () => {
  const app = read("src/App.tsx");
  const access = read("src/permissions/AccessProvider.tsx");

  assert.match(app, /path="purchase-orders" element=\{<PurchaseOrders \/>\}/);
  assert.match(access, /"purchase-orders": "orders"/);
});

test("global table uses server pagination and all combined filters", () => {
  const source = read("src/modules/Purchases/PurchaseOrderTable.tsx");

  assert.match(source, /usePaginatedFetch<PurchaseOrder>/);
  assert.match(source, /`\$\{purchaseOrderApi\}paginated`/);
  for (const field of [
    "search",
    "projectId",
    "supplierId",
    "purchaseOrderType",
    "status",
  ]) {
    assert.match(source, new RegExp(`${field}:`));
  }
  assert.match(source, /pagination=\{pagination\}/);
  assert.match(source, /onPageChange=\{setPage\}/);
  assert.match(source, /onPageSizeChange=\{setPageSize\}/);
});

test("filter changes reset server pagination through the shared hook", () => {
  const source = read("src/hooks/usePaginatedFetch.ts");
  assert.match(source, /\[serializedParams\]/);
  assert.match(source, /setPage\(1\)/);
});

test("actions reuse project detail, edit, creation and PDF flows", () => {
  const table = read("src/modules/Purchases/PurchaseOrderTable.tsx");
  const page = read("src/modules/Purchases/PurchaseOrders.tsx");

  assert.match(
    table,
    /\/admin\/projects\/\$\{order\.projectId\}\/purchase-orders\/\$\{order\.purchaseOrderId\}/,
  );
  assert.match(
    table,
    /\/admin\/projects\/\$\{order\.projectId\}\/purchase-orders\/edit\/\$\{order\.purchaseOrderId\}/,
  );
  assert.match(table, /can\("orders\.manage"\)/);
  assert.match(table, /can\("orders\.export"\)/);
  assert.match(table, /\$\{purchaseOrderApi\}pdf\//);
  assert.match(
    page,
    /\/admin\/projects\/\$\{newProjectId\}\/purchase-orders\/new/,
  );
  assert.match(page, /disabled=\{!newProjectId\}/);
});

test("existing project purchase order routes remain registered", () => {
  const source = read("src/App.tsx");
  assert.match(source, /<Route path="purchase-orders">/);
  assert.match(source, /<Route index element=\{<PurchaseOrdersProject \/>\}/);
  assert.match(source, /path=":purchaseOrderId" element=\{<PurchaseOrder \/>\}/);
  assert.match(source, /path="new" element=\{<NewPurchaseOrder \/>\}/);
  assert.match(source, /path="edit\/:purchaseOrderId"/);
});
