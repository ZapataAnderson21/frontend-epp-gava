import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useModuleAction } from "../../permissions/AccessProvider";
import { annulSsomaTalk, getSsomaTalk, transitionSsomaTalk } from "./ssomaApi";
import { getAttendanceProgress, statusLabel } from "./ssomaRules";
import type { SsomaTalk as SsomaTalkType } from "./ssomaTypes";

function dateLabel(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE", { dateStyle: "long" });
}

export default function SsomaTalk() {
  const { id } = useParams();
  const talkId = Number(id);
  const navigate = useNavigate();
  const canManage = useModuleAction("manage");
  const [talk, setTalk] = useState<SsomaTalkType | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const nextTalk = await getSsomaTalk(talkId, signal);
    setTalk(nextTalk);
    setError("");
  }, [talkId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    refresh(controller.signal).catch((caught: unknown) => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "No se pudo cargar la charla."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh, reload]);

  const perform = async (action: "start" | "open" | "annul") => {
    if (!talk) return;
    if (action === "annul") {
      if (!window.confirm("¿Confirmas que deseas anular esta charla? Esta acción quedará registrada.")) return;
      const reason = window.prompt("Indica el motivo de la anulación:")?.trim() || "";
      if (!reason) { setError("El motivo de anulación es obligatorio."); return; }
      setBusy(true); setError("");
      try { await annulSsomaTalk(talk.ssomaTalkId, reason); await refresh(); }
      catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo anular la charla."); }
      finally { setBusy(false); }
      return;
    }
    const label = action === "start" ? "iniciar" : "abrir";
    if (!window.confirm(`¿Confirmas que deseas ${label} esta charla?`)) return;
    setBusy(true); setError("");
    try { await transitionSsomaTalk(talk.ssomaTalkId, action); await refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo actualizar la charla."); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="p-8 text-slate-600" role="status">Cargando charla…</div>;
  if (!talk) return <main className="p-6"><div role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error || "No se encontró la charla."}<button type="button" onClick={() => setReload((value) => value + 1)} className="ml-3 underline">Reintentar</button></div></main>;

  const progress = getAttendanceProgress(talk.attendances.map((attendance) => attendance.status));
  const showProgress = talk.status !== "draft";
  return <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
    <Link to="/admin/ssoma" className="text-sm font-semibold text-blue-700 underline">← Todas las charlas</Link>
    {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</div>}
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{statusLabel(talk.status)}</span><h1 className="mt-3 text-2xl font-bold text-slate-900">{talk.topic}</h1><p className="mt-1 text-sm text-slate-600">{talk.project.code} · {talk.project.name}</p></div>{canManage && talk.status === "draft" && <button type="button" onClick={() => navigate(`/admin/ssoma/${talk.ssomaTalkId}/edit`)} className="min-h-10 rounded-lg border border-blue-700 px-4 font-semibold text-blue-800">Editar borrador</button>}</div>
      <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="text-xs font-semibold uppercase text-slate-500">Fecha</dt><dd className="mt-1 text-slate-900">{dateLabel(talk.talkDate)}</dd></div>
        <div><dt className="text-xs font-semibold uppercase text-slate-500">Hora programada</dt><dd className="mt-1 text-slate-900">{talk.scheduledTime?.slice(11, 16) || "Sin hora definida"}</dd></div>
        <div><dt className="text-xs font-semibold uppercase text-slate-500">Duración</dt><dd className="mt-1 text-slate-900">{talk.durationMinutes ? `${talk.durationMinutes} min` : "Sin duración definida"}</dd></div>
        <div><dt className="text-xs font-semibold uppercase text-slate-500">Facilitador</dt><dd className="mt-1 text-slate-900">{talk.trainer || "Por definir"}</dd></div>
        <div><dt className="text-xs font-semibold uppercase text-slate-500">Lugar</dt><dd className="mt-1 text-slate-900">{talk.location || "Por definir"}</dd></div>
        <div><dt className="text-xs font-semibold uppercase text-slate-500">Público objetivo</dt><dd className="mt-1 text-slate-900">{talk.targetAudience || "Por definir"}</dd></div>
        <div><dt className="text-xs font-semibold uppercase text-slate-500">Responsable</dt><dd className="mt-1 text-slate-900">{talk.responsibleName || "Por definir"}{talk.responsiblePosition ? ` · ${talk.responsiblePosition}` : ""}</dd></div>
        {talk.observations && <div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs font-semibold uppercase text-slate-500">Observaciones</dt><dd className="mt-1 whitespace-pre-wrap text-slate-900">{talk.observations}</dd></div>}
      </dl>
    </section>

    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Participación y firmas</h2>
      {showProgress ? <>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-600">Participantes registrados</p><p className="mt-1 text-2xl font-bold text-slate-900">{progress.participants}</p></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-600">Firmas recibidas</p><p className="mt-1 text-2xl font-bold text-slate-900">{progress.signed} <span className="text-base font-medium text-slate-500">/ {progress.participants}</span></p></div></div>
        <div className="mt-4"><div className="mb-1 flex justify-between text-sm"><span>Avance de firmas</span><span>{progress.percent}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Avance de firmas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${progress.percent}%` }} /></div></div>
      </> : <p className="mt-2 text-sm text-slate-600">El seguimiento de participantes y firmas estará disponible al iniciar la charla.</p>}
    </section>

    {canManage && talk.status !== "closed" && talk.status !== "annulled" && talk.status !== "voided" && <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Acciones</h2><p className="mt-1 text-sm text-slate-600">Cada cambio se confirma y se registra en el historial del servidor.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row">{talk.status === "draft" && <button type="button" disabled={busy} onClick={() => perform("start")} className="min-h-11 rounded-lg bg-blue-700 px-4 font-semibold text-white disabled:opacity-60">{busy ? "Procesando…" : "Iniciar charla"}</button>}{talk.status === "inProgress" && <button type="button" disabled={busy} onClick={() => perform("open")} className="min-h-11 rounded-lg bg-blue-700 px-4 font-semibold text-white disabled:opacity-60">{busy ? "Procesando…" : "Abrir charla"}</button>}{talk.status === "open" && <button type="button" disabled={busy} onClick={() => perform("annul")} className="min-h-11 rounded-lg border border-red-500 px-4 font-semibold text-red-700 disabled:opacity-60">Anular charla</button>}</div></section>}
  </main>;
}
