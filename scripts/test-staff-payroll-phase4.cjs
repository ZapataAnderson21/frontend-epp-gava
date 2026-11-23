const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) =>
  fs.readFileSync(path.join(root, relative), "utf8");

test("worker type no longer exposes unspecified", () => {
  const types = read("src/data/types.ts");
  const newWorker = read("src/modules/Workers/NewWorker.tsx");
  assert.doesNotMatch(types, /Unspecified|No Especificado/);
  assert.match(newWorker, /useState<WorkerType \| null>\(null\)/);
  assert.match(newWorker, /El tipo de trabajador es requerido/);
});

test("STAFF routes and API are registered", () => {
  const app = read("src/App.tsx");
  const api = read("src/data/apiUrl.ts");
  assert.ok(app.includes('path="staff-payroll"'));
  assert.ok(app.includes('path="staff-payroll/people"'));
  assert.ok(app.includes('path="staff-payroll/new"'));
  assert.ok(app.includes('path="staff-payroll/:year/:month"'));
  assert.match(api, /staffPayrollApi/);
});

test("monthly payroll requires independent and finance permissions", () => {
  const access = read("src/permissions/AccessProvider.tsx");
  const staffAccess = read(
    "src/modules/StaffPayrolls/StaffPayrollAccess.tsx",
  );
  assert.match(access, /"staff-payroll": "staffPayroll"/);
  assert.match(staffAccess, /staffPayroll\.view/);
  assert.match(staffAccess, /finance\.view/);
});

test("sidebar keeps weekly payroll and adds monthly STAFF group", () => {
  const sidebar = read("src/sections/Sidebar.tsx");
  assert.match(sidebar, /label="Planillas"/);
  assert.match(sidebar, /label="Semanales — Técnicos y Obreros"/);
  assert.match(sidebar, /label="Mensuales — STAFF"/);
  assert.match(sidebar, /ariaControls="payroll-sidebar-menu"/);
  assert.ok(sidebar.includes('href="/admin/payrolls"'));
  assert.ok(sidebar.includes('href="/admin/staff-payroll"'));
});

test("people page exposes pending remuneration and profile setup", () => {
  const people = read("src/modules/StaffPayrolls/StaffPeople.tsx");
  assert.match(people, /Remuneración pendiente de configurar/);
  assert.match(people, /monthlyBaseRemuneration/);
  assert.match(people, /staffPayroll\.manage/);
  assert.match(people, /Buscar por nombre o DNI/);
});

test("period list is compact and opens the unified editor", () => {
  const list = read("src/modules/StaffPayrolls/StaffPayrolls.tsx");
  assert.match(list, /Nueva planilla/);
  assert.ok(list.includes("/admin/staff-payroll/new"));
  assert.doesNotMatch(list, /Nuevo período mensual/);
  assert.doesNotMatch(list, /Total bruto/);
  assert.doesNotMatch(list, /Trabajadores/);
  assert.match(list, /<Panel>/);
});

test("unified editor prepares STAFF and saves all rows once", () => {
  const editor = read(
    "src/modules/StaffPayrolls/StaffPayrollEditor.tsx",
  );
  const detail = read(
    "src/modules/StaffPayrolls/StaffPayrollDetail.tsx",
  );
  assert.match(editor, /periods\/prepare/);
  assert.match(editor, /Guardar planilla/);
  assert.match(editor, /updateProfile/);
  assert.match(
    editor,
    /Actualizar también el sueldo habitual para futuros períodos/,
  );
  assert.match(editor, /beforeunload/);
  assert.match(editor, /Total general/);
  assert.match(editor, /manualDiscounts > gross/);
  assert.doesNotMatch(editor, /staffPayrollApi \+ "entries\/" \+ entryId/);
  assert.match(detail, /StaffPayrollEditor/);
});

test("Excel download is permission-gated and does not use localStorage", () => {
  const list = read("src/modules/StaffPayrolls/StaffPayrolls.tsx");
  const detail = read(
    "src/modules/StaffPayrolls/StaffPayrollDetail.tsx",
  );
  const editor = read(
    "src/modules/StaffPayrolls/StaffPayrollEditor.tsx",
  );
  const download = read(
    "src/modules/StaffPayrolls/downloadStaffPayroll.ts",
  );
  assert.match(list, /staffPayroll\.export/);
  assert.match(editor, /staffPayroll\.export/);
  assert.ok(download.includes("/export"));
  assert.doesNotMatch(
    list + detail + editor + download,
    /localStorage\.(setItem|getItem)/,
  );
});
