const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

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

test("authorized PDF fetch uses cookie credentials and blob URLs are revoked after use", async () => {
  const blob = new Blob(["pdf bytes"], { type: "application/pdf" });
  let request;
  const returned = await rules.fetchAuthorizedBlob("https://api.example/ssoma/talks/1/document", { Authorization: "Bearer test-token" }, async (url, init) => {
    request = { url, init };
    return { ok: true, blob: async () => blob };
  });
  assert.equal(returned, blob);
  assert.equal(request.init.credentials, "include");
  assert.equal(request.init.headers.Authorization, "Bearer test-token");
  assert.doesNotMatch(request.url, /token|Authorization/i);
  let revoked = "";
  let revokeCount = 0;
  const managedUrl = rules.createManagedObjectUrl(blob, {
    createObjectURL: () => "blob:temporary",
    revokeObjectURL: (url) => { revoked = url; revokeCount += 1; },
  });
  assert.equal(managedUrl.url, "blob:temporary");
  managedUrl.revoke();
  managedUrl.revoke();
  assert.equal(revoked, "blob:temporary");
  assert.equal(revokeCount, 1);
});

test("document versions distinguish current and superseded versions", () => {
  assert.equal(rules.documentVersionLabel("CURRENT"), "Vigente");
  assert.equal(rules.documentVersionLabel("SUPERSEDED"), "Reemplazado");
  assert.equal(rules.documentVersionLabel("PENDING"), "Estado de publicación no confirmado");
});

test("closed attendance invalidation is accepted only in a valid closed-talk revision", () => {
  const talk = { status: "closed" };
  const current = [{ ssomaTalkDocumentVersionId: 7, status: "CURRENT" }];
  const superseded = [{ ssomaTalkDocumentVersionId: 7, status: "SUPERSEDED" }];
  assert.equal(rules.canStartSsomaRevision(talk, current), true);
  assert.equal(rules.canStartSsomaRevision(talk, superseded), false);
  const payload = rules.buildRevisionPayload({ reason: " Correct attendance ", attendanceIdsToVoid: [9], topic: "Updated topic" }, [9]);
  assert.equal(payload.reason, "Correct attendance");
  assert.deepEqual(payload.attendanceIdsToVoid, [9]);
  assert.throws(() => rules.buildRevisionPayload({ reason: "x", attendanceIdsToVoid: [10] }, [9]), /cerradas seleccionadas/i);
  assert.throws(() => rules.buildRevisionPayload({ reason: " ", attendanceIdsToVoid: [] }, []), /motivo/i);
});

test("revision publication single-flight gate prevents duplicate requests", async () => {
  const lock = { current: false };
  let release;
  let calls = 0;
  const first = rules.runExclusively(lock, () => new Promise((resolve) => { calls += 1; release = resolve; }));
  const duplicate = await rules.runExclusively(lock, async () => { calls += 1; });
  assert.deepEqual(duplicate, { started: false });
  assert.equal(calls, 1);
  release("published");
  assert.deepEqual(await first, { started: true, value: "published" });
});

test("annulment requires a reason and is unavailable for closed or terminal states", () => {
  assert.equal(rules.isValidAnnulReason(" reason "), true);
  assert.equal(rules.isValidAnnulReason(" "), false);
  assert.equal(rules.isValidAnnulReason("x".repeat(1001)), false);
  assert.equal(rules.canAnnulTalk("draft"), true);
  assert.equal(rules.canAnnulTalk("inProgress"), true);
  assert.equal(rules.canAnnulTalk("open"), true);
  assert.equal(rules.canAnnulTalk("closed"), false);
  assert.equal(rules.canAnnulTalk("annulled"), false);
});

test("audit sanitization keeps approved fields and removes control secrets", () => {
  const item = rules.sanitizeAuditEvent({
    ssomaTalkAuditEventId: 1,
    ssomaTalkId: 2,
    attendanceTalkId: null,
    ssomaTalkAttendanceId: null,
    actorUserId: 3,
    eventType: "revision_published",
    previousState: "closed",
    newState: "closed",
    changedFields: { documentVersionId: 5, signatureBase64: "do-not-show", trace: "private" },
    reason: "Approved Bearer secret-value token=private-trace signature=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    serverAt: "2026-10-26T10:00:00.000Z",
    actor: { userId: 3, name: "Ada", lastName: "Lovelace" },
  });
  assert.equal(item.action, "revision_published");
  assert.equal(item.actor, "Ada Lovelace");
  assert.deepEqual(item.documentReferences, ["documentVersionId: 5"]);
  assert.doesNotMatch(JSON.stringify(item), /signatureBase64|do-not-show|secret-value|private-trace|ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\+/);
  assert.equal(rules.sanitizeAuditValue("event\u0000name"), "event name");
});

test("document error mappings cover authorization, absence, conflict, and server failure", () => {
  const error = (statusCode) => Object.assign(new Error("sensitive server body"), { statusCode });
  assert.match(rules.safeDocumentErrorMessage(error(403), "document"), /permiso/i);
  assert.match(rules.safeDocumentErrorMessage(error(404), "document"), /no está disponible/i);
  assert.match(rules.safeDocumentErrorMessage(error(409), "revision"), /impide iniciar/i);
  assert.match(rules.safeDocumentErrorMessage(error(409), "publish"), /publicación no quedó confirmada/i);
  assert.match(rules.safeDocumentErrorMessage(error(500), "publish"), /resultado puede requerir verificación/i);
  assert.doesNotMatch(rules.safeDocumentErrorMessage(error(500), "publish"), /sensitive server body/);
});

test("the nine backend SSOMA permissions map independently to visibility flags", () => {
  const expected = ["view", "manage", "sign", "invalidate", "close", "revise", "void", "export", "audit"];
  assert.deepEqual(rules.SSOMA_PERMISSION_NAMES, expected);
  for (const selected of expected) {
    const flags = rules.ssomaPermissionFlags((permission) => permission === `ssoma.${selected}`);
    assert.deepEqual(Object.entries(flags).filter(([, enabled]) => enabled).map(([name]) => name), [selected]);
  }
  const app = readFileSync("src/App.tsx", "utf8");
  const access = readFileSync("src/permissions/AccessProvider.tsx", "utf8");
  const sidebar = readFileSync("src/sections/Sidebar.tsx", "utf8");
  const talk = readFileSync("src/modules/SSOMA/SsomaTalk.tsx", "utf8");
  const participants = readFileSync("src/modules/SSOMA/ParticipantManager.tsx", "utf8");
  const documents = readFileSync("src/modules/SSOMA/DocumentCenter.tsx", "utf8");
  const audit = readFileSync("src/modules/SSOMA/AuditTimeline.tsx", "utf8");
  for (const route of ["list", "create", "edit", "detail"]) assert.match(app, new RegExp(`path=\\{SSOMA_ROUTE_PATHS\\.${route}\\}`));
  assert.match(access, /ssoma:\s*"ssoma"/);
  assert.match(sidebar, /permission="ssoma\.view"/);
  for (const permission of ["sign", "invalidate", "close", "void"]) assert.match(talk, new RegExp(`ssomaPermissions\\.${permission}`));
  assert.match(participants, /canManage/);
  assert.match(participants, /canSign/);
  assert.match(participants, /canInvalidate/);
  assert.match(documents, /permissions\.export/);
  assert.match(documents, /permissions\.revise/);
  assert.match(documents, /permissions\.audit/);
  assert.match(audit, /ssomaPermissionFlags\(can\)\.audit/);
});

test("talk route contracts and form validation are wired for create and edit", () => {
  assert.deepEqual(rules.SSOMA_ROUTE_PATHS, {
    list: "ssoma",
    create: "ssoma/new",
    edit: "ssoma/:id/edit",
    detail: "ssoma/:id",
  });
  const routes = readFileSync("src/App.tsx", "utf8");
  const form = readFileSync("src/modules/SSOMA/SsomaTalkForm.tsx", "utf8");
  assert.match(routes, /path=\{SSOMA_ROUTE_PATHS\.create\} element=\{<SsomaTalkForm \/>\}/);
  assert.match(routes, /path=\{SSOMA_ROUTE_PATHS\.edit\} element=\{<SsomaTalkForm \/>\}/);
  assert.match(form, /validateTalkDraft/);
});

test("SSOMA surfaces retain mobile, keyboard, and accessible status affordances", () => {
  const signature = readFileSync("src/modules/SSOMA/SignatureCapture.tsx", "utf8");
  const list = readFileSync("src/modules/SSOMA/SsomaTalks.tsx", "utf8");
  const detail = readFileSync("src/modules/SSOMA/SsomaTalk.tsx", "utf8");
  const audit = readFileSync("src/modules/SSOMA/AuditTimeline.tsx", "utf8");
  assert.match(signature, /touchAction:\s*"none"/);
  assert.match(signature, /padRef\.current\?\.clear\(\)/);
  assert.match(signature, /Limpiar firma/);
  assert.match(signature, /aria-labelledby=/);
  assert.match(list, /md:hidden|sm:grid-cols|lg:grid-cols/);
  assert.match(list, /role="status"/);
  assert.match(detail, /role="progressbar"/);
  assert.match(detail, /aria-modal="true"/);
  assert.match(audit, /role="alert"/);
  assert.doesNotMatch([signature, list, detail, audit].join("\n"), /dangerouslySetInnerHTML/);
  assert.doesNotMatch([signature, list, detail, audit].join("\n"), /localStorage|sessionStorage/);
});
