import { useEffect, useState } from "react";
import { useAccess } from "../../permissions/AccessProvider";
import { listSsomaAudit } from "./ssomaApi";
import { safeDocumentErrorMessage, sanitizeAuditEvent, ssomaPermissionFlags } from "./ssomaRules";
import type { SsomaAuditEvent, SsomaAuditList } from "./ssomaTypes";

export default function AuditTimeline({ talkId }: { talkId: number }) {
  const { can } = useAccess();
  const authorized = ssomaPermissionFlags(can).audit;
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SsomaAuditList | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    setLoading(true);
    listSsomaAudit(talkId, page).then((data) => {
      if (active) { setResult(data); setError(""); }
    }).catch((caught: unknown) => {
      if (active) setError(safeDocumentErrorMessage(caught, "audit"));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authorized, page, talkId]);

  if (!authorized) return null;
  return <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <h2 className="text-lg font-bold text-slate-900">Historial de auditoría</h2>
    <p className="mt-1 text-sm text-slate-600">Eventos registrados por el servidor. No se muestran datos de firma ni contenido técnico interno.</p>
    {loading && <p className="mt-3 text-sm text-slate-500" role="status">Cargando historial…</p>}
    {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
    {result?.items.length === 0 && !loading && <p className="mt-3 text-sm text-slate-600">No hay eventos de auditoría.</p>}
    <ol className="mt-4 space-y-3">
      {result?.items.map((event: SsomaAuditEvent) => {
        const item = sanitizeAuditEvent(event);
        return <li key={event.ssomaTalkAuditEventId} className="rounded-lg border border-slate-200 p-3">
          <div className="flex flex-wrap justify-between gap-2">
            <strong className="text-sm text-slate-900">{item.action || "Evento SSOMA"}</strong>
            <time className="text-xs text-slate-600" dateTime={item.timestamp}>{item.timestamp}</time>
          </div>
          <p className="mt-1 text-sm text-slate-700">Actor: {item.actor}</p>
          {(item.previousState || item.newState) && <p className="mt-1 text-sm text-slate-700">Estado: {item.previousState || "—"} → {item.newState || "—"}</p>}
          {item.reason && <p className="mt-1 text-sm text-slate-700">Motivo: {item.reason}</p>}
          {item.documentReferences.length > 0 && <p className="mt-1 text-xs text-slate-600">{item.documentReferences.join(" · ")}</p>}
        </li>;
      })}
    </ol>
    {result && result.pagination.totalPages > 1 && <div className="mt-4 flex items-center justify-between">
      <button type="button" disabled={!result.pagination.hasPreviousPage || loading} onClick={() => setPage((value) => value - 1)} className="min-h-10 rounded-lg border px-3 disabled:opacity-50">Anterior</button>
      <span className="text-sm text-slate-600">Página {result.pagination.currentPage} de {result.pagination.totalPages}</span>
      <button type="button" disabled={!result.pagination.hasNextPage || loading} onClick={() => setPage((value) => value + 1)} className="min-h-10 rounded-lg border px-3 disabled:opacity-50">Siguiente</button>
    </div>}
  </section>;
}
