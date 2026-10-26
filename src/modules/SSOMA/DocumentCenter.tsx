import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useAccess } from "../../permissions/AccessProvider";
import {
  fetchSsomaDocument,
  getSsomaPublicationReconciliation,
  listSsomaDocumentVersions,
  listSsomaRevisions,
  publishSsomaRevision,
  startSsomaRevision,
} from "./ssomaApi";
import {
  buildRevisionPayload,
  canStartSsomaRevision,
  createManagedObjectUrl,
  documentVersionLabel,
  isConfirmedRevisionPublication,
  runExclusively,
  safeDocumentErrorMessage,
  ssomaPermissionFlags,
} from "./ssomaRules";
import type {
  SsomaDocumentVersionSummary,
  SsomaPublicationReconciliation,
  SsomaRevisionDraft,
  SsomaRevisionSummary,
  SsomaTalk,
} from "./ssomaTypes";

function idempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `ssoma-revision-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function DocumentCenter({ talk, onRefresh }: { talk: SsomaTalk; onRefresh: () => Promise<SsomaTalk> }) {
  const { can } = useAccess();
  const permissions = ssomaPermissionFlags(can);
  const canExport = permissions.export;
  const canRevise = permissions.revise;
  const canAudit = permissions.audit;
  const [versions, setVersions] = useState<SsomaDocumentVersionSummary[]>([]);
  const [revisions, setRevisions] = useState<SsomaRevisionSummary[]>([]);
  const [reconciliation, setReconciliation] = useState<SsomaPublicationReconciliation[]>([]);
  const [file, setFile] = useState<{ url: string; name: string; revoke: () => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revisionForm, setRevisionForm] = useState(false);
  const [reason, setReason] = useState("");
  const [fields, setFields] = useState({
    topic: talk.topic,
    trainer: talk.trainer ?? "",
    location: talk.location ?? "",
    targetAudience: talk.targetAudience ?? "",
    scheduledTime: talk.scheduledTime ?? "",
    durationMinutes: talk.durationMinutes?.toString() ?? "",
    observations: talk.observations ?? "",
    responsibleName: talk.responsibleName ?? "",
    responsiblePosition: talk.responsiblePosition ?? "",
  });
  const [attendanceIdsToVoid, setAttendanceIdsToVoid] = useState<number[]>([]);
  const lock = useRef(false);
  const publishKeys = useRef(new Map<number, string>());

  const refresh = useCallback(async () => {
    const [nextVersions, nextRevisions] = await Promise.all([
      listSsomaDocumentVersions(talk.ssomaTalkId),
      listSsomaRevisions(talk.ssomaTalkId),
    ]);
    setVersions(nextVersions);
    setRevisions(nextRevisions);
    if (canAudit) {
      const state = await getSsomaPublicationReconciliation(talk.ssomaTalkId);
      setReconciliation(state);
    }
    return { nextVersions, nextRevisions };
  }, [canAudit, talk.ssomaTalkId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh().catch((caught: unknown) => { if (active) setError(safeDocumentErrorMessage(caught, "document")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    return () => { file?.revoke(); };
  }, [file]);

  const openDocument = async (version?: SsomaDocumentVersionSummary) => {
    if (!canExport || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const path = version
        ? `talks/${talk.ssomaTalkId}/versions/${version.ssomaTalkDocumentVersionId}/document`
        : `talks/${talk.ssomaTalkId}/document`;
      const blob = await fetchSsomaDocument(path);
      if (blob.type && blob.type !== "application/pdf") throw new Error("El servidor no entregó un documento PDF válido.");
      const managedUrl = createManagedObjectUrl(blob);
      setFile({ ...managedUrl, name: version ? `SSOMA-v${version.versionNumber}.pdf` : `SSOMA-${talk.ssomaTalkId}.pdf` });
    } catch (caught) { setError(safeDocumentErrorMessage(caught, "document")); }
    finally { setBusy(false); }
  };

  const startRevision = async () => {
    if (!canRevise || !canStartSsomaRevision(talk, versions) || lock.current) return;
    const closedAttendanceIds = talk.attendances.filter((attendance) => attendance.status === "SIGNED" || attendance.status === "DECLINED")
      .map((attendance) => attendance.ssomaTalkAttendanceId);
    const durationMinutes: number | null = fields.durationMinutes ? Number(fields.durationMinutes) : null;
    const overrides: Omit<SsomaRevisionDraft, "reason" | "attendanceIdsToVoid"> = {
      topic: fields.topic.trim(),
      trainer: fields.trainer.trim() || null,
      location: fields.location.trim() || null,
      targetAudience: fields.targetAudience.trim() || null,
      scheduledTime: fields.scheduledTime || null,
      durationMinutes,
      observations: fields.observations.trim() || null,
      responsibleName: fields.responsibleName.trim() || null,
      responsiblePosition: fields.responsiblePosition.trim() || null,
    };
    const draft = buildRevisionPayload({ reason, attendanceIdsToVoid, ...overrides }, closedAttendanceIds);
    const result = await runExclusively(lock, async () => {
      setBusy(true); setError(""); setNotice("");
      try {
        const created = await startSsomaRevision(talk.ssomaTalkId, draft);
        await refresh();
        setRevisionForm(false);
        setNotice(`Borrador de revisión ${created.revisionNumber} creado. La versión oficial sigue vigente hasta confirmar su publicación.`);
      } catch (caught) { setError(safeDocumentErrorMessage(caught, "revision")); }
      finally { setBusy(false); }
    });
    if (!result.started) return;
  };

  const publishRevision = async (revision: SsomaRevisionSummary) => {
    if (!canRevise || lock.current || !window.confirm(`¿Publicar la revisión ${revision.revisionNumber}? Esta operación sustituye la versión vigente y puede invalidar asistencias seleccionadas.`)) return;
    const key = publishKeys.current.get(revision.ssomaTalkRevisionId) ?? idempotencyKey();
    publishKeys.current.set(revision.ssomaTalkRevisionId, key);
    await runExclusively(lock, async () => {
      setBusy(true); setError(""); setNotice("");
      try {
        const published = await publishSsomaRevision(talk.ssomaTalkId, revision.ssomaTalkRevisionId, key);
        const { nextVersions } = await refresh();
        if (!isConfirmedRevisionPublication(published, nextVersions)) {
          setError("El servidor no confirmó la nueva versión vigente. No se mostrará como publicada; vuelve a cargar el estado.");
          return;
        }
        publishKeys.current.delete(revision.ssomaTalkRevisionId);
        await onRefresh();
        setNotice(`Revisión publicada y confirmada como versión ${published.versionNumber}.`);
      } catch (caught) {
        try { await refresh(); } catch { /* Preserve the original publication result. */ }
        setError(safeDocumentErrorMessage(caught, "publish"));
      } finally { setBusy(false); }
    });
  };

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
  };

  const currentVersion = versions.find((version) => version.status === "CURRENT");
  const canStartRevision = canRevise && canStartSsomaRevision(talk, versions);
  const voidableAttendances = talk.attendances.filter((attendance) => attendance.status === "SIGNED" || attendance.status === "DECLINED");

  return <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <h2 className="text-lg font-bold text-slate-900">Documentos oficiales y revisiones</h2>
    <p className="mt-1 text-sm text-slate-600">Los documentos se consultan con permisos del servidor. Las URL temporales permanecen solo en memoria y se revocan al cambiar o cerrar la vista.</p>
    {loading && <p className="mt-3 text-sm text-slate-500" role="status">Cargando versiones…</p>}
    {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
    {notice && <p className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800" role="status">{notice}</p>}
    {!loading && versions.length === 0 && <p className="mt-3 text-sm text-slate-600">No hay versiones oficiales disponibles. La publicación se confirma únicamente con respuesta del servidor.</p>}
    {currentVersion && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <strong className="text-sm text-emerald-900">Versión {currentVersion.versionNumber} · {documentVersionLabel(currentVersion.status)}</strong>
      <p className="mt-1 text-xs text-emerald-900">Publicada: {new Date(currentVersion.publishedAt).toLocaleString("es-PE")}</p>
      {canExport ? <button type="button" disabled={busy} onClick={() => void openDocument()} className="mt-3 min-h-10 rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white disabled:opacity-50">Ver / descargar PDF vigente</button>
        : <p className="mt-2 text-sm text-slate-700">Se requiere permiso de exportación para abrir o descargar el PDF.</p>}
    </div>}
    {versions.length > 0 && <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
      {versions.map((version) => <li key={version.ssomaTalkDocumentVersionId} className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div><p className="font-semibold text-slate-900">Versión {version.versionNumber} · {documentVersionLabel(version.status)}</p><p className="text-xs text-slate-600">{new Date(version.publishedAt).toLocaleString("es-PE")} · {version.byteSize} bytes</p></div>
        {canExport && <button type="button" disabled={busy} onClick={() => void openDocument(version)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold disabled:opacity-50">Descargar versión</button>}
      </li>)}
    </ul>}
    {file && <div className="mt-4 rounded-lg border border-slate-300 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">Vista previa segura: {file.name}</strong><div className="flex gap-2"><a href={file.url} download={file.name} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Descargar</a><button type="button" onClick={() => setFile(null)} className="rounded-lg border px-3 py-2 text-sm">Cerrar</button></div></div>
      <iframe className="mt-3 h-[70vh] w-full rounded border" title="Documento oficial SSOMA" src={file.url} />
    </div>}

    {canAudit && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <h3 className="font-semibold text-amber-950">Estado de publicación recuperable</h3>
      {reconciliation.length === 0 ? <p className="mt-1 text-sm text-amber-900">No hay fallos de publicación que requieran verificación.</p> : <ul className="mt-2 space-y-2">{reconciliation.map((item) => <li key={item.publicationId} className="text-sm text-amber-950">{new Date(item.createdAt).toLocaleString("es-PE")} · {item.failureCode} · artefacto verificado: {item.artifactVerified ? "sí" : "no"}. El servidor indica que es recuperable; esta pantalla no ejecuta acciones de reintento.</li>)}</ul>}
    </div>}

    {talk.status === "closed" && <div className="mt-5 border-t border-slate-200 pt-4">
      <h3 className="text-base font-bold text-slate-900">Revisiones documentales</h3>
      <p className="mt-1 text-sm text-slate-600">Una asistencia cerrada no puede invalidarse por separado; la invalidación debe formar parte de una revisión documental publicada.</p>
      <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">La rectificación documental HSEQ está pendiente y no está disponible en este flujo; no se enviará ni se simulará una rectificación.</p>
      {canStartRevision && <button type="button" onClick={() => setRevisionForm((value) => !value)} className="mt-3 min-h-10 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white">{revisionForm ? "Cancelar revisión" : "Iniciar revisión"}</button>}
      {revisionForm && <div className="mt-4 space-y-3 rounded-lg border border-slate-200 p-3">
        <label className="block text-sm font-medium">Motivo obligatorio<textarea maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 min-h-20 w-full rounded border p-2" /></label>
        <label className="block text-sm font-medium">Tema<input name="topic" maxLength={500} value={fields.topic} onChange={updateField} className="mt-1 min-h-10 w-full rounded border p-2" /></label>
        <label className="block text-sm font-medium">Facilitador<input name="trainer" maxLength={200} value={fields.trainer} onChange={updateField} className="mt-1 min-h-10 w-full rounded border p-2" /></label>
        <label className="block text-sm font-medium">Lugar<input name="location" maxLength={2000} value={fields.location} onChange={updateField} className="mt-1 min-h-10 w-full rounded border p-2" /></label>
        <label className="block text-sm font-medium">Público objetivo<input name="targetAudience" maxLength={2000} value={fields.targetAudience} onChange={updateField} className="mt-1 min-h-10 w-full rounded border p-2" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium">Hora<input name="scheduledTime" type="time" value={fields.scheduledTime} onChange={updateField} className="mt-1 min-h-10 w-full rounded border p-2" /></label><label className="block text-sm font-medium">Duración en minutos<input name="durationMinutes" type="number" min="1" max="1440" value={fields.durationMinutes} onChange={updateField} className="mt-1 min-h-10 w-full rounded border p-2" /></label></div>
        <label className="block text-sm font-medium">Observaciones<textarea name="observations" maxLength={5000} value={fields.observations} onChange={updateField} className="mt-1 min-h-20 w-full rounded border p-2" /></label>
        <label className="block text-sm font-medium">Responsable<input name="responsibleName" maxLength={200} value={fields.responsibleName} onChange={updateField} className="mt-1 min-h-10 w-full rounded border p-2" /></label>
        <label className="block text-sm font-medium">Cargo del responsable<input name="responsiblePosition" maxLength={200} value={fields.responsiblePosition} onChange={updateField} className="mt-1 min-h-10 w-full rounded border p-2" /></label>
        {voidableAttendances.length > 0 && <fieldset className="space-y-2"><legend className="font-semibold">Asistencias a invalidar al publicar esta revisión</legend>{voidableAttendances.map((attendance) => <label key={attendance.ssomaTalkAttendanceId} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={attendanceIdsToVoid.includes(attendance.ssomaTalkAttendanceId)} onChange={(event) => setAttendanceIdsToVoid((ids) => event.target.checked ? [...ids, attendance.ssomaTalkAttendanceId] : ids.filter((id) => id !== attendance.ssomaTalkAttendanceId))} />{attendance.worker.fullName} · {attendance.status}</label>)}</fieldset>}
        <button type="button" disabled={busy || !reason.trim() || !fields.topic.trim() || Boolean(fields.durationMinutes && (!Number.isInteger(Number(fields.durationMinutes)) || Number(fields.durationMinutes) < 1 || Number(fields.durationMinutes) > 1440))} onClick={() => void startRevision()} className="min-h-10 rounded-lg bg-blue-700 px-3 font-semibold text-white disabled:opacity-50">Crear borrador de revisión</button>
      </div>}
      {revisions.length > 0 && <ul className="mt-3 space-y-2">{revisions.map((revision) => {
        const canPublish = revision.baseVersionId !== null && revision.baseVersionId === currentVersion?.ssomaTalkDocumentVersionId;
        return <li key={revision.ssomaTalkRevisionId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"><span>Revisión {revision.revisionNumber} · iniciada {new Date(revision.createdAt).toLocaleString("es-PE")} · {canPublish ? "la base coincide con la versión vigente" : "la base ya no es la versión vigente"}</span>{canRevise && canPublish && <button type="button" disabled={busy} onClick={() => void publishRevision(revision)} className="min-h-10 rounded-lg border border-blue-700 px-3 text-sm font-semibold disabled:opacity-50">Publicar revisión</button>}</li>;
      })}</ul>}
    </div>}
  </section>;
}
