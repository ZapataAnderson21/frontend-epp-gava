const test = require("node:test");
const assert = require("node:assert/strict");

let rules;
test.before(async () => {
  rules = await import("../src/modules/SSOMA/ssomaRules.ts");
});

test("talk list query includes pagination and only active filters", () => {
  const params = rules.buildTalkQuery({
    page: 2,
    pageSize: 10,
    search: "  fall protection  ",
    projectId: 17,
    status: "open",
    dateFrom: "2026-10-01",
    dateTo: "",
  });
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("pageSize"), "10");
  assert.equal(params.get("search"), "  fall protection  ");
  assert.equal(params.get("projectId"), "17");
  assert.equal(params.get("status"), "open");
  assert.equal(params.get("dateFrom"), "2026-10-01");
  assert.equal(params.has("dateTo"), false);
});

test("talk draft validation matches required backend fields and bounds", () => {
  const base = {
    projectId: 1,
    talkDate: "2026-10-25",
    topic: "Working at height",
    scheduledTime: "08:30",
    durationMinutes: 5,
    trainer: "Safety lead",
  };
  assert.deepEqual(rules.validateTalkDraft(base), []);
  assert.deepEqual(rules.validateTalkDraft({ ...base, projectId: 0, topic: "  " }), [
    "Selecciona un proyecto.",
    "El tema es obligatorio.",
  ]);
  assert.ok(rules.validateTalkDraft({ ...base, talkDate: "2026-02-30" }).includes("Ingresa una fecha válida."));
  assert.ok(rules.validateTalkDraft({ ...base, scheduledTime: "24:30" }).includes("La hora debe tener formato HH:mm."));
  assert.ok(rules.validateTalkDraft({ ...base, durationMinutes: 1441 }).includes("La duración debe estar entre 1 y 1440 minutos."));
});

test("signature progress excludes removed and voided attendances", () => {
  assert.deepEqual(rules.getAttendanceProgress(["SIGNED", "PENDING", "REMOVED", "VOIDED"]), {
    signed: 1,
    participants: 2,
    percent: 50,
  });
  assert.deepEqual(rules.getAttendanceProgress([]), { signed: 0, participants: 0, percent: 0 });
});
