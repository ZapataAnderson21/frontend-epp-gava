import getAuthHeaders from "../../hooks/getAuthHeaders";
import formatApiErrorMessage from "../../utils/apiErrorMessage";
import { redirectToLoginPreservingURL } from "../../auth-redirect";
import { ssomaApi } from "../../data/apiUrl";
import { buildTalkQuery } from "./ssomaRules";
import type {
  SsomaEnvelope,
  SsomaTalk,
  SsomaTalkDraft,
  SsomaTalkList,
  SsomaTalkQuery,
  SsomaTalkUpdate,
} from "./ssomaTypes";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${ssomaApi}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...init.headers },
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
    throw new Error(message);
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
