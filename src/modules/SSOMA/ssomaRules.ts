import type {
  SsomaTalkDraft,
  SsomaTalkQuery,
  SsomaTalkStatus,
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
