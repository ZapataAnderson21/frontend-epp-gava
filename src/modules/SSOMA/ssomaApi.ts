import getAuthHeaders from "../../hooks/getAuthHeaders";
import formatApiErrorMessage from "../../utils/apiErrorMessage";
import { redirectToLoginPreservingURL } from "../../auth-redirect";
import { ssomaApi } from "../../data/apiUrl";
import {
  buildAvailabilityQuery,
  buildAuditQuery,
  buildSignatureFormData,
  buildTalkQuery,
  buildWorkerQuery,
  fetchAuthorizedBlob,
} from "./ssomaRules";
import type {
  SsomaAttendanceRecord,
  SsomaEnvelope,
  SsomaTalk,
  SsomaTalkDraft,
  SsomaTalkList,
  SsomaTalkQuery,
  SsomaTalkUpdate,
  SsomaWorkerAvailability,
  SsomaWorkerList,
  SsomaSignatureResult,
  SsomaDocumentVersionSummary,
  SsomaRevisionDraft,
  SsomaRevisionSummary,
  SsomaRevisionStartResult,
  SsomaPublicationReconciliation,
  SsomaAuditList,
} from "./ssomaTypes";

export class SsomaApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "SsomaApiError";
    this.statusCode = statusCode;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(getAuthHeaders());
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  if (typeof FormData !== "undefined" && init.body instanceof FormData) {
    headers.delete("content-type");
  }
  const response = await fetch(`${ssomaApi}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const body = (await response.json().catch(() => null)) as SsomaEnvelope<T> | null;
  const status = body?.statusCode ?? response.status;
  if (status === 401) {
    redirectToLoginPreservingURL();
    throw new Error("Unauthorized");
  }
  if (status < 200 || status >= 300) {
    const message = formatApiErrorMessage(body?.message, response.statusText || "Error en la solicitud");
    throw new SsomaApiError(message, status);
  }
  if (!body || !("data" in body)) throw new Error("La respuesta del servidor no tiene el formato esperado.");
  return body.data;
}

export function listSsomaTalks(query: SsomaTalkQuery, signal?: AbortSignal) {
  return request<SsomaTalkList>(`talks?${buildTalkQuery(query)}`, { signal });
}

export function getSsomaTalk(id: number, signal?: AbortSignal) {
  return request<SsomaTalk>(`talks/${id}`, { signal });
}

export function createSsomaTalk(draft: SsomaTalkDraft) {
  return request<SsomaTalk>("talks", { method: "POST", body: JSON.stringify(draft) });
}

export function updateSsomaTalk(id: number, draft: SsomaTalkUpdate) {
  return request<SsomaTalk>(`talks/${id}`, { method: "PATCH", body: JSON.stringify(draft) });
}

export function transitionSsomaTalk(id: number, action: "start" | "open") {
  return request<SsomaTalk>(`talks/${id}/${action}`, { method: "POST" });
}

export function annulSsomaTalk(id: number, reason: string) {
  return request<SsomaTalk>(`talks/${id}/annul`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function searchSsomaWorkers(search: string, page: number, pageSize = 25, signal?: AbortSignal) {
  return request<SsomaWorkerList>(`workers?${buildWorkerQuery(search, page, pageSize)}`, { signal });
}

export function getSsomaWorkerAvailability(date: string, workerIds: number[], signal?: AbortSignal) {
  return request<SsomaWorkerAvailability[]>(`availability?${buildAvailabilityQuery(date, workerIds)}`, { signal });
}

export function addSsomaParticipants(talkId: number, workerIds: number[]) {
  return request<SsomaAttendanceRecord[]>(`talks/${talkId}/participants`, {
    method: "POST",
    body: JSON.stringify({ workerIds }),
  });
}

export function removeSsomaParticipant(talkId: number, attendanceId: number, reason: string) {
  return request<SsomaAttendanceRecord>(`talks/${talkId}/participants/${attendanceId}/remove`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function invalidateSsomaAttendance(talkId: number, attendanceId: number, reason: string) {
  return request<SsomaAttendanceRecord>(`talks/${talkId}/attendance/${attendanceId}/invalidate`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function uploadSsomaSignature(talkId: number, attendanceId: number, workerId: number, signature: Blob) {
  if (signature.type !== "image/png") {
    throw new SsomaApiError("La firma debe enviarse como imagen PNG.", 400);
  }
  if (signature.size < 1 || signature.size > 1_000_000) {
    throw new SsomaApiError("La firma debe medir entre 1 byte y 1 MB.", 413);
  }
  const form = buildSignatureFormData(workerId, signature);
  return request<SsomaSignatureResult>(`talks/${talkId}/attendance/${attendanceId}/signature`, {
    method: "POST",
    body: form,
  });
}

export function closeSsomaTalk(talkId: number, idempotencyKey: string) {
  return request<SsomaDocumentVersionSummary>(`talks/${talkId}/close`, {
    method: "POST",
    body: JSON.stringify({ idempotencyKey }),
  });
}

export function listSsomaDocumentVersions(talkId: number) {
  return request<SsomaDocumentVersionSummary[]>(`talks/${talkId}/versions`);
}

export function listSsomaRevisions(talkId: number) {
  return request<SsomaRevisionSummary[]>(`talks/${talkId}/revisions`);
}

export function startSsomaRevision(talkId: number, draft: SsomaRevisionDraft) {
  return request<SsomaRevisionStartResult>(`talks/${talkId}/revisions`, {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

export function publishSsomaRevision(talkId: number, revisionId: number, idempotencyKey: string) {
  return request<SsomaDocumentVersionSummary>(`talks/${talkId}/revisions/${revisionId}/publish`, {
    method: "POST",
    body: JSON.stringify({ idempotencyKey }),
  });
}

export function getSsomaPublicationReconciliation(talkId: number) {
  return request<SsomaPublicationReconciliation[]>(`talks/${talkId}/publications/reconciliation`);
}

export function listSsomaAudit(talkId: number, page: number, pageSize = 20) {
  return request<SsomaAuditList>(`talks/${talkId}/audit?${buildAuditQuery(page, pageSize)}`);
}

export function fetchSsomaDocument(path: string) {
  if (!path.startsWith("talks/") || path.includes("?") || path.includes("#")) {
    throw new Error("La ruta del documento no es válida.");
  }
  return fetchAuthorizedBlob(`${ssomaApi}${path}`, getAuthHeaders());
}
