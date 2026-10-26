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

test("worker search sends one trimmed name-or-DNI search term with pagination", () => {
  const byName = rules.buildWorkerQuery("  Maria Torres  ", 2, 25);
  const byDni = rules.buildWorkerQuery("  12345678  ", 1, 25);
  assert.deepEqual(Object.fromEntries(byName), { page: "2", pageSize: "25", search: "Maria Torres" });
  assert.deepEqual(Object.fromEntries(byDni), { page: "1", pageSize: "25", search: "12345678" });
  assert.deepEqual(Object.fromEntries(rules.buildWorkerQuery("  ", 1)), { page: "1", pageSize: "25" });
});

test("availability map keeps unknown workers distinct from unavailable workers", () => {
  const available = rules.availabilityByWorkerId([
    { workerId: 7, available: true },
    { workerId: 8, available: false },
  ]);
  assert.equal(available.get(7), true);
  assert.equal(available.get(8), false);
  assert.equal(available.has(9), false);
  assert.match(rules.safeSsomaErrorMessage(Object.assign(new Error("raw server details"), { statusCode: 409 }), "participants"), /actualiza la disponibilidad/i);
  assert.doesNotMatch(rules.safeSsomaErrorMessage(Object.assign(new Error("raw server details"), { statusCode: 409 }), "participants"), /raw server details/);
});

test("signature state rejects an empty stroke set and validates a bounded PNG blob", () => {
  assert.equal(rules.canSubmitSignature(true), false);
  assert.equal(rules.canSubmitSignature(false), true);
  assert.equal(rules.signatureBlobError({ type: "image/png", size: 42 }), null);
  assert.equal(rules.signatureBlobError({ type: "image/png", size: 0 }), "La firma está vacía.");
  assert.equal(rules.signatureBlobError({ type: "image/jpeg", size: 42 }), "La firma debe generarse como PNG.");
  assert.equal(rules.signatureBlobError({ type: "image/png", size: 1_000_001 }), "La firma supera el límite de 1 MB.");
});

test("signature multipart body contains only the worker id and PNG file", () => {
  const png = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
  const form = rules.buildSignatureFormData(42, png);
  assert.equal(form.get("workerId"), "42");
  const file = form.get("signature");
  assert.equal(file.type, "image/png");
  assert.equal(file.size, 4);
  assert.equal(file.name, "signature.png");
  assert.equal([...form.keys()].length, 2);
  assert.equal(rules.isConfirmedSignature({ attendanceId: 19, status: "SIGNED" }, 19), true);
  assert.equal(rules.isConfirmedSignature({ attendanceId: 20, status: "SIGNED" }, 19), false);
});

test("signature single-flight gate ignores a duplicate submission while one is in progress", async () => {
  const lock = { current: false };
  let finish;
  const first = rules.runExclusively(lock, () => new Promise((resolve) => { finish = resolve; }));
  const duplicate = await rules.runExclusively(lock, async () => "duplicate");
  assert.deepEqual(duplicate, { started: false });
  finish("uploaded");
  assert.deepEqual(await first, { started: true, value: "uploaded" });
  assert.equal(lock.current, false);
});

test("signature upload errors map size limits without exposing server internals", () => {
  const error = Object.assign(new Error("opaque upload detail"), { statusCode: 413 });
  const message = rules.safeSsomaErrorMessage(error, "signature");
  assert.match(message, /1 MB/);
  assert.doesNotMatch(message, /opaque upload detail/);
});

test("closing requires a successful close request and a refreshed closed server state", async () => {
  let calls = 0;
  const result = await rules.closeAndVerifyTalk(
    async () => ({ versionNumber: 3 }),
    async () => { calls += 1; return { status: "closed" }; },
  );
  assert.equal(calls, 1);
  assert.equal(result.publication.versionNumber, 3);
  assert.equal(result.talk.status, "closed");
  await assert.rejects(
    rules.closeAndVerifyTalk(async () => ({ versionNumber: 3 }), async () => ({ status: "open" })),
    /no confirmó el cierre/i,
  );
  await assert.rejects(
    rules.closeAndVerifyTalk(async () => { throw new Error("close failed"); }, async () => ({ status: "closed" })),
    /close failed/,
  );
});
