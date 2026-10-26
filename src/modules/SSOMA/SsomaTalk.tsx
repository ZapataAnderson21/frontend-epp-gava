import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAccess, useModuleAction } from "../../permissions/AccessProvider";
import {
  annulSsomaTalk,
  closeSsomaTalk,
  getSsomaTalk,
  searchSsomaWorkers,
  transitionSsomaTalk,
  uploadSsomaSignature,
} from "./ssomaApi";
import {
  canCloseTalk,
  canSignAttendance,
  closeAndVerifyTalk,
  canAnnulTalk,
  isValidAnnulReason,
  getAttendanceProgress,
  isConfirmedSignature,
  safeSsomaErrorMessage,
  safeDocumentErrorMessage,
  ssomaPermissionFlags,
  statusLabel,
} from "./ssomaRules";
import type { SsomaAttendance, SsomaTalk as SsomaTalkType, SsomaWorker } from "./ssomaTypes";
import ParticipantManager from "./ParticipantManager";
import SignatureCapture from "./SignatureCapture";
import DocumentCenter from "./DocumentCenter";
import AuditTimeline from "./AuditTimeline";

function dateLabel(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE", { dateStyle: "long" });
}

export default function SsomaTalk() {
  const { id } = useParams();
  const talkId = Number(id);
  const navigate = useNavigate();
  const canManage = useModuleAction("manage");
  const { can } = useAccess();
  const ssomaPermissions = ssomaPermissionFlags(can);
  const canVoid = ssomaPermissions.void;
  const [talk, setTalk] = useState<SsomaTalkType | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [signingWorker, setSigningWorker] = useState<{ attendanceId: number; worker: SsomaWorker } | null>(null);
  const [resolvingWorker, setResolvingWorker] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [closing, setClosing] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const closeKey = useRef<string | null>(null);
  const closeLock = useRef(false);
  const [reload, setReload] = useState(0);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const nextTalk = await getSsomaTalk(talkId, signal);
    setTalk(nextTalk);
    setError("");
    return nextTalk;
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
      if (!canVoid || !canAnnulTalk(talk.status)) return;
      if (!window.confirm("¿Confirmas que deseas anular esta charla? Esta acción quedará registrada.")) return;
      const reason = window.prompt("Indica el motivo de la anulación:")?.trim() || "";
      if (!isValidAnnulReason(reason)) { setError("El motivo de anulación debe contener entre 1 y 1000 caracteres."); return; }
      setBusy(true); setError("");
      try { await annulSsomaTalk(talk.ssomaTalkId, reason); await refresh(); }
      catch (caught) { setError(safeDocumentErrorMessage(caught, "annul")); }
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

  const openSignatureCapture = async (attendance: SsomaAttendance) => {
    if (!talk || resolvingWorker || !ssomaPermissions.sign) return;
    setResolvingWorker(true);
    setError("");
    try {
      const latest = await getSsomaTalk(talk.ssomaTalkId);
      const currentAttendance = latest.attendances.find(
        (candidate) => candidate.ssomaTalkAttendanceId === attendance.ssomaTalkAttendanceId,
      );
      if (!currentAttendance || !canSignAttendance(latest.status, currentAttendance.status)) {
        await refresh();
        throw new Error("La charla o la asistencia cambió. Actualiza el estado antes de firmar.");
      }
      const workers = await searchSsomaWorkers(attendance.worker.fullName, 1, 100);
      const worker = workers.items.find((candidate) => candidate.workerId === attendance.workerId);
      if (!worker) {
        throw new Error("No se pudo verificar el DNI de la persona seleccionada; no se abrirá el registro de firma.");
      }
      setSigningWorker({ attendanceId: attendance.ssomaTalkAttendanceId, worker });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo verificar la identidad seleccionada.");
    } finally {
      setResolvingWorker(false);
    }
  };

  const submitSignature = async (signature: Blob) => {
    if (!talk || !signingWorker) return;
    try {
      const result = await uploadSsomaSignature(
        talk.ssomaTalkId,
        signingWorker.attendanceId,
        signingWorker.worker.workerId,
        signature,
      );
      if (!isConfirmedSignature(result, signingWorker.attendanceId)) {
        throw new Error("El servidor no confirmó el registro de firma.");
      }
      const updated = await refresh();
      const attendance = updated.attendances.find(
        (candidate) => candidate.ssomaTalkAttendanceId === signingWorker.attendanceId,
      );
      if (attendance?.status !== "SIGNED") {
        throw new Error("La firma fue enviada, pero el estado actualizado aún no confirma su registro.");
      }
      setSigningWorker(null);
      setNotice("Firma registrada y confirmada por el servidor.");
    } catch (caught) {
      const updated = await refresh().catch(() => null);
      const attendance = updated?.attendances.find(
        (candidate) => candidate.ssomaTalkAttendanceId === signingWorker.attendanceId,
      );
      if (attendance?.status === "SIGNED") {
        setSigningWorker(null);
        setNotice("El servidor confirma que la firma quedó registrada.");
        return;
      }
      throw new Error(safeSsomaErrorMessage(caught, "signature"));
    }
  };

  const confirmClose = async () => {
    if (!talk || closing || !canCloseTalk(talk.status) || !ssomaPermissions.close || closeLock.current) return;
    closeLock.current = true;
    setClosing(true);
    setError("");
    setNotice("");
    closeKey.current ??= globalThis.crypto?.randomUUID?.() ?? `ssoma-${talk.ssomaTalkId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const { publication } = await closeAndVerifyTalk(
        () => closeSsomaTalk(talk.ssomaTalkId, closeKey.current!),
        () => refresh(),
      );
      closeKey.current = null;
      setPublishedVersion(publication.versionNumber);
      setNotice(`Documento oficial publicado y cierre confirmado · versión ${publication.versionNumber}.`);
      setShowCloseConfirmation(false);
    } catch (caught) {
      const message = safeSsomaErrorMessage(caught, "close");
      try {
        const updated = await refresh();
        if (updated.status === "closed") {
          closeKey.current = null;
          setNotice("El estado actualizado del servidor confirma el cierre. Los detalles de publicación no estuvieron disponibles en la respuesta.");
          setShowCloseConfirmation(false);
        } else {
          setError(`${message} El estado actual sigue siendo “${statusLabel(updated.status)}”; se conserva la misma clave para reintentar.`);
        }
      } catch {
        setError(`${message} No se pudo volver a consultar el estado, por lo que el cierre no se asume como completado.`);
      }
    } finally {
      closeLock.current = false;
      setClosing(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-600" role="status">Cargando charla…</div>;
  if (!talk) return <main className="p-6"><div role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error || "No se encontró la charla."}<button type="button" onClick={() => setReload((value) => value + 1)} className="ml-3 underline">Reintentar</button></div></main>;

  const progress = getAttendanceProgress(talk.attendances.map((attendance) => attendance.status));
  const showProgress = talk.status !== "draft";
  return <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
    <Link to="/admin/ssoma" className="text-sm font-semibold text-blue-700 underline">← Todas las charlas</Link>
    {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</div>}
    {notice && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{notice}{publishedVersion && <span className="sr-only"> Versión {publishedVersion}.</span>}</div>}
    {resolvingWorker && <p className="mt-3 text-sm text-slate-600" role="status">Verificando la identidad seleccionada…</p>}
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

    <ParticipantManager
      talk={talk}
      canManage={canManage}
      canSign={ssomaPermissions.sign}
      canInvalidate={ssomaPermissions.invalidate}
      onChanged={refresh}
      onCaptureSignature={openSignatureCapture}
    />

    {ssomaPermissions.close && canCloseTalk(talk.status) && <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Cerrar y publicar</h2>
      <p className="mt-1 text-sm text-slate-600">El documento se publica de forma oficial. La charla solo se marcará cerrada cuando el servidor confirme la publicación y una nueva consulta verifique el estado.</p>
      {closeKey.current && <p className="mt-2 text-sm text-amber-800">Hay un intento de cierre sin confirmación completa. Reintentar conservará la misma clave de idempotencia.</p>}
      <button type="button" disabled={closing} onClick={() => setShowCloseConfirmation(true)} className="mt-4 min-h-11 rounded-lg bg-blue-700 px-5 font-semibold text-white disabled:opacity-50">{closing ? "Publicando…" : "Revisar y cerrar charla"}</button>
    </section>}

    {showCloseConfirmation && <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="ssoma-close-title" className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <h2 id="ssoma-close-title" className="text-xl font-bold text-slate-900">Confirmar cierre y publicación</h2>
        <p className="mt-2 text-sm text-slate-600">El servidor generará y publicará el documento oficial. Revisa el resumen antes de confirmar.</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm">
          <div><dt className="text-slate-600">Participantes</dt><dd className="font-semibold text-slate-900">{progress.participants}</dd></div>
          <div><dt className="text-slate-600">Firmas</dt><dd className="font-semibold text-slate-900">{progress.signed}</dd></div>
          <div><dt className="text-slate-600">Pendientes</dt><dd className="font-semibold text-slate-900">{talk.attendances.filter((attendance) => ["PENDING", "SIGNING"].includes(attendance.status)).length}</dd></div>
          <div><dt className="text-slate-600">Rechazadas</dt><dd className="font-semibold text-slate-900">{talk.attendances.filter((attendance) => attendance.status === "DECLINED").length}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">No se mostrará como cerrada hasta que la respuesta y el estado actualizado del servidor lo confirmen.</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={closing} onClick={() => setShowCloseConfirmation(false)} className="min-h-11 rounded-lg border border-slate-300 px-4 font-semibold text-slate-800">Cancelar</button>
          <button type="button" disabled={closing} onClick={() => { void confirmClose(); }} className="min-h-11 rounded-lg bg-blue-700 px-5 font-semibold text-white disabled:opacity-50">{closing ? "Publicando…" : "Confirmar cierre"}</button>
        </div>
      </section>
    </div>}

    {signingWorker && <SignatureCapture
      worker={signingWorker.worker}
      onCancel={() => setSigningWorker(null)}
      onSubmit={submitSignature}
    />}

    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Participación y firmas</h2>
      {showProgress ? <>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-600">Participantes registrados</p><p className="mt-1 text-2xl font-bold text-slate-900">{progress.participants}</p></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-600">Firmas recibidas</p><p className="mt-1 text-2xl font-bold text-slate-900">{progress.signed} <span className="text-base font-medium text-slate-500">/ {progress.participants}</span></p></div></div>
        <div className="mt-4"><div className="mb-1 flex justify-between text-sm"><span>Avance de firmas</span><span>{progress.percent}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Avance de firmas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${progress.percent}%` }} /></div></div>
      </> : <p className="mt-2 text-sm text-slate-600">El seguimiento de participantes y firmas estará disponible al iniciar la charla.</p>}
    </section>

    {(canManage || canVoid) && talk.status !== "closed" && talk.status !== "annulled" && talk.status !== "voided" && <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Acciones</h2><p className="mt-1 text-sm text-slate-600">Cada cambio se confirma y se registra en el historial del servidor.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row">{canManage && talk.status === "draft" && <button type="button" disabled={busy} onClick={() => perform("start")} className="min-h-11 rounded-lg bg-blue-700 px-4 font-semibold text-white disabled:opacity-60">{busy ? "Procesando…" : "Iniciar charla"}</button>}{canManage && talk.status === "inProgress" && <button type="button" disabled={busy} onClick={() => perform("open")} className="min-h-11 rounded-lg bg-blue-700 px-4 font-semibold text-white disabled:opacity-60">{busy ? "Procesando…" : "Abrir charla"}</button>}{canVoid && canAnnulTalk(talk.status) && <button type="button" disabled={busy} onClick={() => perform("annul")} className="min-h-11 rounded-lg border border-red-500 px-4 font-semibold text-red-700 disabled:opacity-60">Anular charla</button>}</div></section>}
    <DocumentCenter talk={talk} onRefresh={refresh} />
    <AuditTimeline talkId={talk.ssomaTalkId} />
  </main>;
}
