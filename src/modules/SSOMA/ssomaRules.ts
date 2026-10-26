import type {
  SsomaTalkDraft,
  SsomaTalkQuery,
  SsomaTalkStatus,
  SsomaWorkerAvailability,
  SsomaSignatureResult,
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
