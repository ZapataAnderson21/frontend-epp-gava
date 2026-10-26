import { useEffect, useMemo, useState } from "react";
import {
  addSsomaParticipants,
  getSsomaWorkerAvailability,
  invalidateSsomaAttendance,
  removeSsomaParticipant,
  searchSsomaWorkers,
} from "./ssomaApi";
import { availabilityByWorkerId, safeSsomaErrorMessage } from "./ssomaRules";
import type {
  SsomaAttendance,
  SsomaTalk,
  SsomaWorker,
  SsomaWorkerList,
} from "./ssomaTypes";

interface ParticipantManagerProps {
  talk: SsomaTalk;
  canManage: boolean;
  onChanged: () => Promise<unknown>;
  onCaptureSignature: (attendance: SsomaAttendance) => Promise<void>;
}

const statusText: Record<SsomaAttendance["status"], string> = {
  PENDING: "Pendiente",
  SIGNING: "Firma en curso",
  SIGNED: "Firmó",
  DECLINED: "Rechazó firmar",
  REMOVED: "Retirado",
  VOIDED: "Invalidado",
};

function isMutableTalk(talk: SsomaTalk) {
  return ["draft", "inProgress", "open"].includes(talk.status);
}

type ReasonAnswer =
  | { type: "cancel" }
  | { type: "empty" }
  | { type: "too-long" }
  | { type: "reason"; value: string };

function askReason(message: string): ReasonAnswer {
  if (!window.confirm(message)) return { type: "cancel" };
  const reason = window.prompt("Indica el motivo (obligatorio):")?.trim() || "";
  if (!reason) return { type: "empty" };
  if (reason.length > 1000) return { type: "too-long" };
  return { type: "reason", value: reason };
}

export default function ParticipantManager({
  talk,
  canManage,
  onChanged,
  onCaptureSignature,
}: ParticipantManagerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [workers, setWorkers] = useState<SsomaWorkerList | null>(null);
  const [availability, setAvailability] = useState<Map<number, boolean>>(new Map());
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingWorkers(true);
    setError("");
    searchSsomaWorkers(search, page, 25, controller.signal)
      .then(setWorkers)
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setWorkers(null);
          setError(caught instanceof Error ? caught.message : "No se pudo buscar trabajadores.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingWorkers(false); });
    return () => controller.abort();
  }, [search, page, reload]);

  useEffect(() => {
    const ids = workers?.items.map((worker) => worker.workerId) ?? [];
    if (ids.length === 0) {
      setAvailability(new Map());
      setLoadingAvailability(false);
      return;
    }
    const controller = new AbortController();
    setLoadingAvailability(true);
    getSsomaWorkerAvailability(talk.talkDate.slice(0, 10), ids, controller.signal)
      .then((items) => setAvailability(availabilityByWorkerId(items)))
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setAvailability(new Map());
          setError(safeSsomaErrorMessage(caught, "availability"));
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingAvailability(false); });
    return () => controller.abort();
  }, [workers, talk.talkDate]);

  useEffect(() => setSelected(new Set()), [search, page, talk.talkDate]);

  const existingWorkerIds = useMemo(
    () => new Set(talk.attendances.map((attendance) => attendance.workerId)),
    [talk.attendances],
  );
  const canEditRoster = canManage && isMutableTalk(talk);

  const applySearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const toggleWorker = (workerId: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(workerId)) next.delete(workerId);
      else next.add(workerId);
      return next;
    });
  };

  const addSelected = async () => {
    if (!canEditRoster || selected.size === 0 || saving) return;
    const availableIds = Array.from(selected).filter(
      (workerId) => availability.get(workerId) === true && !existingWorkerIds.has(workerId),
    );
    if (availableIds.length !== selected.size) {
      setError("La disponibilidad no está confirmada para toda la selección. Actualiza los resultados antes de agregar.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await addSsomaParticipants(talk.ssomaTalkId, availableIds);
      await onChanged();
      setSelected(new Set());
      setNotice("Participantes agregados.");
      setReload((value) => value + 1);
    } catch (caught) {
      setError(safeSsomaErrorMessage(caught, "participants"));
    } finally {
      setSaving(false);
    }
  };

  const handleReasonedAction = async (
    attendance: SsomaAttendance,
    action: "remove" | "invalidate",
  ) => {
    if (saving) return;
    const reason = askReason(
      action === "remove"
        ? `¿Retirar a ${attendance.worker.fullName} de esta charla?`
        : `¿Invalidar la asistencia de ${attendance.worker.fullName}?`,
    );
    if (reason.type === "cancel") return;
    if (reason.type === "empty") {
      setError("El motivo es obligatorio.");
      return;
    }
    if (reason.type === "too-long") {
      setError("El motivo admite hasta 1000 caracteres.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (action === "remove") {
        await removeSsomaParticipant(talk.ssomaTalkId, attendance.ssomaTalkAttendanceId, reason.value);
      } else {
        await invalidateSsomaAttendance(talk.ssomaTalkId, attendance.ssomaTalkAttendanceId, reason.value);
      }
      await onChanged();
      setNotice(action === "remove" ? "Participante retirado." : "Asistencia invalidada.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar la asistencia.");
    } finally {
      setSaving(false);
    }
  };

  const availabilityFor = (worker: SsomaWorker) => {
    if (existingWorkerIds.has(worker.workerId)) return "already-added" as const;
    if (availability.has(worker.workerId)) return availability.get(worker.workerId) ? "available" as const : "unavailable" as const;
    return "unknown" as const;
  };

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Participantes</h2>
          <p className="text-sm text-slate-600">{talk.attendances.length} registros · {talk.attendances.filter((attendance) => attendance.status === "SIGNED").length} firmas recibidas</p>
        </div>
      </div>

      {canEditRoster && <div className="mt-4 rounded-lg border border-slate-200 p-3 sm:p-4">
        <h3 className="font-semibold text-slate-900">Agregar participantes</h3>
        <p className="mt-1 text-sm text-slate-600">La disponibilidad se valida para {talk.talkDate.slice(0, 10)}. Solo se muestra nombre y DNI.</p>
        <form onSubmit={applySearch} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="ssoma-worker-search">Buscar por nombre o DNI</label>
          <input id="ssoma-worker-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar por nombre o DNI" maxLength={100} className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3" />
          <button type="submit" className="min-h-11 rounded-lg border border-blue-700 px-4 font-semibold text-blue-800">Buscar</button>
        </form>

        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}<button type="button" onClick={() => setReload((value) => value + 1)} className="ml-2 font-semibold underline">Reintentar</button></p>}
        {notice && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{notice}</p>}
        {loadingWorkers && <p className="mt-3 text-sm text-slate-600" role="status">Buscando trabajadores…</p>}
        {!loadingWorkers && workers?.items.length === 0 && <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No se encontraron trabajadores para esa búsqueda.</p>}
        {!loadingWorkers && workers?.items.length ? <>
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {workers.items.map((worker) => {
              const state = availabilityFor(worker);
              const selectable = canEditRoster && state === "available" && !loadingAvailability && !saving;
              const checked = selected.has(worker.workerId);
              return <li key={worker.workerId} className="flex items-center gap-3 p-3">
                <input type="checkbox" aria-label={`Seleccionar ${worker.fullName}`} checked={checked} disabled={!selectable} onChange={() => toggleWorker(worker.workerId)} className="size-5 accent-blue-700" />
                <span className="min-w-0 flex-1"><span className="block truncate font-medium text-slate-900">{worker.fullName}</span><span className="text-sm text-slate-600">DNI: {worker.dni}</span></span>
                <span className={`text-right text-xs font-semibold ${state === "available" ? "text-emerald-700" : state === "unavailable" ? "text-amber-800" : "text-slate-500"}`}>
                  {loadingAvailability ? "Verificando…" : state === "available" ? "Disponible" : state === "unavailable" ? "No disponible" : state === "already-added" ? "Ya agregado" : "Disponibilidad sin confirmar"}
                </span>
              </li>;
            })}
          </ul>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">{workers.pagination.totalItems} resultados · Página {workers.pagination.currentPage} de {Math.max(workers.pagination.totalPages, 1)}</p>
            <div className="flex gap-2">
              <button type="button" disabled={!workers.pagination.hasPreviousPage || loadingWorkers} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:opacity-50">Anterior</button>
              <button type="button" disabled={!workers.pagination.hasNextPage || loadingWorkers} onClick={() => setPage((value) => value + 1)} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:opacity-50">Siguiente</button>
            </div>
          </div>
          <button type="button" disabled={selected.size === 0 || saving || loadingAvailability} onClick={addSelected} className="mt-3 min-h-11 w-full rounded-lg bg-blue-700 px-4 font-semibold text-white disabled:opacity-50 sm:w-auto">{saving ? "Guardando…" : `Agregar seleccionados (${selected.size})`}</button>
        </> : null}
      </div>}

      {!canEditRoster && <p className="mt-3 text-sm text-slate-600">La lista es de solo lectura para este estado o tu rol.</p>}

      {talk.attendances.length === 0 ? <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Aún no hay participantes registrados.</p> : <ul className="mt-4 divide-y divide-slate-100">
        {talk.attendances.map((attendance) => {
          const canRemove = canEditRoster && attendance.status === "PENDING";
          const canInvalidate = canManage && ["draft", "inProgress", "open"].includes(talk.status) && ["SIGNED", "DECLINED"].includes(attendance.status);
          const canCapture = canManage && (talk.status === "inProgress" || talk.status === "open") && attendance.status === "PENDING";
          return <li key={attendance.ssomaTalkAttendanceId} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="truncate font-medium text-slate-900">{attendance.worker.fullName}</p><p className="mt-0.5 text-sm text-slate-600">{statusText[attendance.status]}</p></div>
            <div className="flex flex-wrap gap-2">
              {canCapture && <button type="button" disabled={saving} onClick={() => { void onCaptureSignature(attendance); }} className="min-h-10 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50">Registrar firma</button>}
              {canRemove && <button type="button" disabled={saving} onClick={() => { void handleReasonedAction(attendance, "remove"); }} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:opacity-50">Retirar</button>}
              {canInvalidate && <button type="button" disabled={saving} onClick={() => { void handleReasonedAction(attendance, "invalidate"); }} className="min-h-10 rounded-lg border border-amber-500 px-3 text-sm font-semibold text-amber-800 disabled:opacity-50">Invalidar</button>}
            </div>
          </li>;
        })}
      </ul>}
    </section>
  );
}
