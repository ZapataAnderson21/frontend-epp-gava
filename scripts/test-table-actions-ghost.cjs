const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) =>
  fs.readFileSync(path.join(root, relative), "utf8");

test("ActionButton exposes an accessible ghost variant and unclipped tooltip", () => {
  const source = read("src/components/ActionButton.tsx");
  assert.match(source, /variant.*ghost/);
  assert.match(source, /createPortal/);
  assert.match(source, /role="tooltip"/);
  assert.match(source, /aria-label=/);
  assert.match(source, /aria-describedby=/);
  assert.match(source, /focus-visible:/);
  assert.match(source, /motion-reduce:/);
  assert.match(source, /disabled:cursor-not-allowed/);
  assert.match(source, /fixed/);
});

test("shared view edit and delete actions use descriptive ghost buttons", () => {
  const see = read("src/common/button/SeeButton.tsx");
  const edit = read("src/common/button/EditButton.tsx");
  const remove = read("src/common/button/DeleteButton.tsx");
  for (const source of [see, edit, remove]) {
    assert.match(source, /variant="ghost"/);
  }
  assert.match(see, /label = "Visualizar"/);
  assert.match(edit, /label = "Editar"/);
  assert.match(remove, /label = "Eliminar"/);
  for (const source of [see, edit, remove]) {
    assert.match(source, /label=\{label\}/);
  }
  assert.match(remove, /tone="danger"/);
});

test("STAFF payroll actions are icon-only ghost actions with preserved permissions", () => {
  const list = read("src/modules/StaffPayrolls/StaffPayrolls.tsx");
  assert.match(list, /Eye/);
  assert.match(list, /FileSpreadsheet/);
  assert.match(list, /label="Abrir planilla"/);
  assert.match(list, /label="Exportar Excel"/);
  assert.match(list, /staffPayroll\.export/);
  assert.doesNotMatch(list, />\s*Abrir\s*</);
  assert.doesNotMatch(list, />\s*Excel\s*</);
});

test("direct table actions use the shared ghost convention", () => {
  const files = [
    "src/modules/Purchases/PurchaseOrderTable.tsx",
    "src/modules/Projects/routes/Project/outlet/Incomes/Incomes.tsx",
    "src/modules/Projects/routes/Project/outlet/ProjectGantt/TaskTable.tsx",
    "src/modules/Projects/routes/Project/outlet/PurchaseOrders/components/UnitValuesModal.tsx",
    "src/modules/StaffPayrolls/StaffPeople.tsx",
  ];
  for (const file of files) {
    const source = read(file);
    assert.match(source, /ActionButton/);
    assert.match(source, /variant="ghost"/);
  }
});

test("primary text buttons keep their solid component contract", () => {
  const add = read("src/common/button/AddButton.tsx");
  const action = read("src/components/ActionButton.tsx");
  assert.match(add, /bgColor="#0047a3"/);
  assert.match(action, /variant = "solid"/);
});
