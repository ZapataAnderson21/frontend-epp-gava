const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("SSOMA request creation uses the three-step atomic flow", () => {
  const source = read("src/modules/Requests/NewRequest.tsx");
  assert.match(source, /Datos generales/);
  assert.match(source, /Recursos SSOMA/);
  assert.match(source, /Revisar y registrar/);
  assert.match(source, /requestApi}ssoma/);
  assert.match(source, /clientRequestId/);
  assert.match(
    source,
    /navigate\(`\/admin\/requests\/\$\{result\.data\.requestId\}`/,
  );
});

test("work clothing planning is grouped by line and supports multiple workers", () => {
  const form = read("src/modules/Requests/NewRequest.tsx");
  const planner = read("src/modules/Requests/components/EpiPlanningModal.tsx");
  assert.match(form, /getRequestLineKey\(planningElement\)/);
  assert.match(form, /getRequestLineFamily\(line\) === "uniform"/);
  assert.match(planner, /multiple/);
  assert.match(planner, /plannedQuantity: 1/);
});

test("request detail exposes additions, email history and real delivery history", () => {
  const detail = read("src/modules/Requests/SsomaRequestDetail.tsx");
  const requestRoute = read("src/modules/Requests/Request.tsx");
  const history = read(
    "src/modules/Requests/components/WorkerClothingHistoryModal.tsx",
  );
  assert.match(detail, /resourceAdditions/);
  assert.match(detail, /workerPlans: additionPlans\.map/);
  assert.match(detail, /Gestionar revisión y atención/);
  assert.match(requestRoute, /flow.*attention/);
  assert.match(detail, /Historial de envíos/);
  assert.match(detail, /workClothingDispatches/);
  assert.match(history, /deliveries\/worker/);
  assert.match(history, /aria-modal="true"/);
});
