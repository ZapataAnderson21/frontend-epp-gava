import type {
  SsomaTalkDraft,
  SsomaTalkQuery,
  SsomaTalkStatus,
  SsomaWorkerAvailability,
  SsomaSignatureResult,
  SsomaTalk,
  SsomaDocumentVersionSummary,
  SsomaRevisionDraft,
  SsomaAuditEvent,
} from "./ssomaTypes.js";

export const TALK_STATUSES: SsomaTalkStatus[] = [
  "draft",
  "inProgress",
  "open",
  "closing",
  "closed",
  "voided",
  "annulled",
];

export function buildTalkQuery(query: SsomaTalkQuery): URLSearchParams {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  for (const key of ["search", "projectId", "status", "dateFrom", "dateTo"] as const) {
    const value = query[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params;
}

export function buildAuditQuery(page: number, pageSize = 20): URLSearchParams {
  return new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
}

export function validateTalkDraft(draft: SsomaTalkDraft): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(draft.projectId) || draft.projectId < 1)
    errors.push("Selecciona un proyecto.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.talkDate) || Number.isNaN(Date.parse(`${draft.talkDate}T00:00:00Z`)) || new Date(`${draft.talkDate}T00:00:00Z`).toISOString().slice(0, 10) !== draft.talkDate)
    errors.push("Ingresa una fecha válida.");
  if (!draft.topic.trim()) errors.push("El tema es obligatorio.");
  if (draft.topic.length > 500) errors.push("El tema admite hasta 500 caracteres.");
  if (draft.trainer && draft.trainer.length > 200) errors.push("El facilitador admite hasta 200 caracteres.");
  if (draft.scheduledTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.scheduledTime))
    errors.push("La hora debe tener formato HH:mm.");
  if (draft.durationMinutes !== null && draft.durationMinutes !== undefined && (!Number.isInteger(draft.durationMinutes) || draft.durationMinutes < 1 || draft.durationMinutes > 1440))
    errors.push("La duración debe estar entre 1 y 1440 minutos.");
  return errors;
}

export function getAttendanceProgress(statuses: string[]) {
  const signed = statuses.filter((status) => status === "SIGNED").length;
  const participants = statuses.filter((status) => !["REMOVED", "VOIDED"].includes(status)).length;
  return { signed, participants, percent: participants ? Math.round((signed / participants) * 100) : 0 };
}

export function buildWorkerQuery(search: string, page: number, pageSize = 25): URLSearchParams {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const normalizedSearch = search.trim();
  if (normalizedSearch) params.set("search", normalizedSearch);
  return params;
}

export function buildAvailabilityQuery(date: string, workerIds: number[]): URLSearchParams {
  if (workerIds.length < 1 || workerIds.length > 100) {
    throw new Error("Consulta entre 1 y 100 trabajadores por vez.");
  }
  if (workerIds.some((id) => !Number.isSafeInteger(id) || id < 1) || new Set(workerIds).size !== workerIds.length) {
    throw new Error("La consulta contiene identificadores inválidos.");
  }
  return new URLSearchParams({ date, workerIds: workerIds.join(",") });
}

export function availabilityByWorkerId(items: SsomaWorkerAvailability[]) {
  return new Map(items.map((item) => [item.workerId, item.available]));
}

export function canSignAttendance(talkStatus: SsomaTalkStatus, attendanceStatus: string) {
  return (talkStatus === "inProgress" || talkStatus === "open") && attendanceStatus === "PENDING";
}

export function canCloseTalk(talkStatus: SsomaTalkStatus) {
  return talkStatus === "open";
}

export async function runExclusively<T>(
  lock: { current: boolean },
  operation: () => Promise<T>,
): Promise<{ started: boolean; value?: T }> {
  if (lock.current) return { started: false };
  lock.current = true;
  try {
    return { started: true, value: await operation() };
  } finally {
    lock.current = false;
  }
}

export function safeSsomaErrorMessage(error: unknown, action: "availability" | "participants" | "signature" | "close") {
  const status = typeof error === "object" && error !== null && "statusCode" in error
    ? Number((error as { statusCode: unknown }).statusCode)
    : 0;
  if (status === 413 && action === "signature") {
    return "La firma supera el límite de 1 MB. Limpia el trazo e intenta con una firma más sencilla.";
  }
  if (status === 409 && action === "availability") {
    return "La disponibilidad cambió. Actualiza los resultados antes de agregar participantes.";
  }
  if (status === 409 && action === "participants") {
    return "Uno o más participantes ya tienen una asistencia activa en esta fecha. Actualiza la disponibilidad y revisa la selección.";
  }
  if (status === 409 && action === "signature") {
    return "La charla o la asistencia cambió y ya no permite registrar esta firma. Actualiza la charla antes de continuar.";
  }
  if (status === 409 && action === "close") {
    return "El servidor no confirmó el cierre. Se actualizará el estado y podrás reintentar con la misma clave.";
  }
  if (status === 413 && action === "close") {
    return "El servidor rechazó la solicitud de cierre por su tamaño. No se confirmó el cierre.";
  }
  return error instanceof Error ? error.message : "Ocurrió un error en la solicitud SSOMA.";
}

export function isConfirmedClosedTalk(status: SsomaTalkStatus) {
  return status === "closed";
}

export function canSubmitSignature(isEmpty: boolean) {
  return !isEmpty;
}

export function signatureBlobError(blob: Pick<Blob, "size" | "type">): string | null {
  if (blob.type !== "image/png") return "La firma debe generarse como PNG.";
  if (blob.size < 1) return "La firma está vacía.";
  if (blob.size > 1_000_000) return "La firma supera el límite de 1 MB.";
  return null;
}

export function buildSignatureFormData(workerId: number, signature: Blob): FormData {
  const form = new FormData();
  form.append("workerId", String(workerId));
  form.append("signature", signature, "signature.png");
  return form;
}

export function isConfirmedSignature(result: SsomaSignatureResult, attendanceId: number) {
  return result.attendanceId === attendanceId && result.status === "SIGNED";
}

export async function closeAndVerifyTalk<TPublication, TTalk extends { status: SsomaTalkStatus }>(
  close: () => Promise<TPublication>,
  refresh: () => Promise<TTalk>,
) {
  const publication = await close();
  const talk = await refresh();
  if (!isConfirmedClosedTalk(talk.status)) {
    throw new Error("El servidor no confirmó el cierre de la charla.");
  }
  return { publication, talk };
}

export function documentVersionLabel(status: string): string {
  if (status === "CURRENT") return "Vigente";
  if (status === "SUPERSEDED") return "Reemplazado";
  return "Estado de publicación no confirmado";
}

export function canStartSsomaRevision(talk: SsomaTalk, versions: SsomaDocumentVersionSummary[]): boolean {
  return talk.status === "closed" && versions.some((version) => version.status === "CURRENT");
}

export function canAnnulTalk(status: SsomaTalkStatus): boolean {
  return status === "draft" || status === "inProgress" || status === "open";
}

export function isValidAnnulReason(reason: string): boolean {
  const normalized = reason.trim();
  return normalized.length > 0 && normalized.length <= 1000;
}

export function buildRevisionPayload(
  draft: SsomaRevisionDraft,
  closedAttendanceIds: number[],
): SsomaRevisionDraft {
  const reason = draft.reason.trim();
  if (!reason || reason.length > 2000) throw new Error("El motivo de la revisión debe contener entre 1 y 2000 caracteres.");
  if (new Set(draft.attendanceIdsToVoid).size !== draft.attendanceIdsToVoid.length ||
      draft.attendanceIdsToVoid.some((id) => !closedAttendanceIds.includes(id))) {
    throw new Error("Solo puedes invalidar asistencias cerradas seleccionadas para esta revisión.");
  }
  return { ...draft, reason };
}

export function isConfirmedRevisionPublication(
  published: SsomaDocumentVersionSummary,
  versions: SsomaDocumentVersionSummary[],
): boolean {
  return published.status === "CURRENT" && versions.some(
    (version) => version.ssomaTalkDocumentVersionId === published.ssomaTalkDocumentVersionId && version.status === "CURRENT",
  );
}

export function safeDocumentErrorMessage(error: unknown, action: "document" | "revision" | "publish" | "annul" | "audit"): string {
  const status = typeof error === "object" && error !== null && "statusCode" in error
    ? Number((error as { statusCode: unknown }).statusCode)
    : 0;
  if (status === 403) return "No tienes permiso para realizar esta acción SSOMA.";
  if (status === 404 && action === "document") return "El documento no está disponible o no existe una versión vigente.";
  if (status === 404 && action === "audit") return "No se encontró la charla para cargar su historial.";
  if (status === 409 && action === "revision") return "La charla, la versión vigente o la retención de firmas impide iniciar esta revisión. Actualiza el estado.";
  if (status === 409 && action === "publish") return "La publicación no quedó confirmada o sigue en curso. Revisa el estado y vuelve a cargar las versiones antes de reintentar.";
  if (status === 409 && action === "annul") return "El estado actual, una revisión o una publicación pendiente impide anular esta charla. Actualiza el estado antes de continuar.";
  if (status >= 500) return "El servidor no pudo completar la solicitud SSOMA. El resultado puede requerir verificación.";
  return error instanceof Error ? error.message : "Ocurrió un error en la solicitud SSOMA.";
}

export function sanitizeAuditValue(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  const redacted = value
    .replace(/\bbearer\s+[A-Za-z0-9._~-]+/gi, "[redacted]")
    .replace(/\btoken\s*[:=]\s*[^\s,;]+/gi, "token=[redacted]")
    .replace(/\b[A-Za-z0-9+/]{48,}={0,2}\b/g, "[binary data redacted]")
    .replace(/\btrace\s*[:=].*$/i, "[internal details redacted]");
  return [...redacted].map((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code < 32 || code === 127 ? " " : character;
  }).join("").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

const SAFE_DOCUMENT_REFERENCE_KEYS = new Set(["documentVersionId", "revisionId", "publicationId", "versionNumber"]);

export function safeAuditDocumentReferences(changedFields: unknown): string[] {
  if (typeof changedFields !== "object" || changedFields === null || Array.isArray(changedFields)) return [];
  return Object.entries(changedFields as Record<string, unknown>)
    .filter(([key, value]) => SAFE_DOCUMENT_REFERENCE_KEYS.has(key) && (typeof value === "number" || typeof value === "string"))
    .map(([key, value]) => `${key}: ${sanitizeAuditValue(String(value), 80)}`);
}

export function sanitizeAuditEvent(event: SsomaAuditEvent) {
  return {
    timestamp: sanitizeAuditValue(event.serverAt, 64),
    action: sanitizeAuditValue(event.eventType, 100),
    actor: sanitizeAuditValue(event.actor ? `${event.actor.name} ${event.actor.lastName}` : `Usuario ${event.actorUserId}`, 120),
    previousState: sanitizeAuditValue(event.previousState, 80),
    newState: sanitizeAuditValue(event.newState, 80),
    reason: sanitizeAuditValue(event.reason, 500),
    documentReferences: safeAuditDocumentReferences(event.changedFields),
  };
}

export async function fetchAuthorizedBlob(
  url: string,
  headers: HeadersInit,
  fetcher: typeof fetch = fetch,
): Promise<Blob> {
  const response = await fetcher(url, { method: "GET", headers, credentials: "include" });
  if (!response.ok) {
    const error = new Error(response.status === 404 ? "Document not found" : "Document request failed") as Error & { statusCode: number };
    error.statusCode = response.status;
    throw error;
  }
  return response.blob();
}

export function createManagedObjectUrl(blob: Blob, urlApi = URL): { url: string; revoke: () => void } {
  const url = urlApi.createObjectURL(blob);
  let revoked = false;
  return {
    url,
    revoke: () => {
      if (revoked) return;
      revoked = true;
      urlApi.revokeObjectURL(url);
    },
  };
}

export function statusLabel(status: SsomaTalkStatus): string {
  return ({
    draft: "Borrador",
    inProgress: "En preparación",
    open: "Abierta",
    closing: "Cerrando",
    closed: "Cerrada",
    voided: "Anulada",
    annulled: "Anulada",
  })[status];
}
