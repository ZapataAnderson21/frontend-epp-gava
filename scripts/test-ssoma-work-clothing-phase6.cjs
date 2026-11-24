const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("requests expose one required SSOMA kind selector and safe families", () => {
  const form = read("src/modules/Requests/NewRequest.tsx");
  const tabs = read("src/modules/Requests/requestFamilies.tsx");
  assert.match(form, /Tipo de requerimiento/);
  assert.match(form, /projectStart/);
  assert.match(form, /duringExecution/);
  assert.match(tabs, /Ropa de Trabajo/);
  assert.match(tabs, /key: "epp"/);
  assert.match(tabs, /key: "ese"/);
  assert.doesNotMatch(tabs, /key: "officeMaterial"/);
  assert.doesNotMatch(tabs, /key: "ssomaSupply"/);
});

test("work clothing persists size variants instead of discarding them", () => {
  const hook = read("src/hooks/HandleForm.tsx");
  const picker = read("src/modules/Requests/components/RequestItemPicker.tsx");
  assert.match(hook, /elementRequest\.elementVariantId \?\? null/);
  assert.match(picker, /selectedVariant/);
  assert.match(picker, /Talla/);
});

test("central work-clothing intake sends the selected size variant", () => {
  const element = read("src/modules/Elements/Element.tsx");
  assert.match(element, /Selecciona la talla de la prenda/);
  assert.match(element, /elementVariantId: payload\.elementVariantId/);
  assert.match(element, /elementVariants=\{element\?\.variants \?\? \[\]\}/);
});

test("work clothing page supports dispatch receipt custody delivery return and history", () => {
  const page = read("src/modules/WorkClothing/WorkClothing.tsx");
  for (const route of [
    "dispatches",
    "receive",
    "custody",
    "deliveries",
    "returns",
    "pdf",
  ]) {
    assert.match(page, new RegExp(route));
  }
  assert.match(page, /crypto\.randomUUID/);
  assert.match(page, /workClothing\.dispatch/);
  assert.match(page, /workClothing\.receive/);
  assert.match(page, /workClothing\.deliver/);
  assert.match(page, /workClothing\.return/);
});

test("sidebar has one requests link and the clothing delivery document", () => {
  const sidebar = read("src/sections/Sidebar.tsx");
  assert.equal((sidebar.match(/href="\/admin\/requests"/g) || []).length, 1);
  assert.match(sidebar, /Entrega de Ropa de Trabajo/);
  assert.match(sidebar, /\/admin\/ssoma\/work-clothing/);
});

test("project inventory operation is removed while central inventory remains", () => {
  const app = read("src/App.tsx");
  const navbar = read(
    "src/modules/Projects/routes/Project/outlet/PurchaseOrders/components/Navbar.tsx",
  );
  assert.doesNotMatch(app, /path="inventory" element=\{<ProjectInventory/);
  assert.doesNotMatch(navbar, /to="inventory"/);
  assert.match(app, /path="inventory"/);
});

test("worker detail uses historical clothing deliveries and a preselected new flow", () => {
  const worker = read("src/modules/Workers/Worker.tsx");
  assert.match(worker, /Historial de Ropa de Trabajo/);
  assert.match(worker, /deliveries\/worker/);
  assert.match(worker, /workerId=\$\{workerId\}/);
  assert.doesNotMatch(worker, /worker-assignment/);
});
