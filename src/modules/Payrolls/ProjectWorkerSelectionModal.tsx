import { AlertTriangle, Search, UserRoundCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  GeneralPayrollProject,
  GeneralPayrollWorker,
  PayrollWorkerGroup,
} from "./types";

const groupLabels: Record<PayrollWorkerGroup, string> = {
  laborer: "Obreros",
  technician: "Técnicos",
};

const hasRecordedValues = (
  project: GeneralPayrollProject,
  generalPayrollWorkerId: number,
) => {
  const entry = project.entries.find(
    (item) => item.generalPayrollWorkerId === generalPayrollWorkerId,
  );
  if (!entry) return false;
  return [
    entry.monday,
    entry.tuesday,
    entry.wednesday,
    entry.thursday,
    entry.friday,
    entry.saturday,
    entry.dominical,
    entry.overtimeAmount,
    entry.afpDiscount,
    entry.advanceDiscount,
  ].some((value) => Number(value) !== 0);
};

interface Props {
  project: GeneralPayrollProject;
  workers: GeneralPayrollWorker[];
  saving: boolean;
  onClose: () => void;
  onSave: (
    generalPayrollWorkerIds: number[],
    confirmClearAttendance: boolean,
  ) => Promise<void>;
}

export default function ProjectWorkerSelectionModal({
  project,
  workers,
  saving,
  onClose,
  onSave,
}: Props) {
  const [search, setSearch] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>(
    project.entries
      .filter((entry) => entry.isActive)
      .map((entry) => entry.generalPayrollWorkerId),
  );

  const normalizedSearch = search
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const visibleWorkers = useMemo(
    () =>
      workers.filter((worker) =>
        `${worker.worker.fullName} ${worker.worker.dni}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    [normalizedSearch, workers],
  );
  const removedWithRecords = workers.filter(
    (worker) =>
      !selectedIds.includes(worker.generalPayrollWorkerId) &&
      project.entries.some(
        (entry) =>
          entry.generalPayrollWorkerId === worker.generalPayrollWorkerId &&
          entry.isActive,
      ) &&
      hasRecordedValues(project, worker.generalPayrollWorkerId),
  );

  const toggleWorker = (workerId: number) => {
    setSelectedIds((current) =>
      current.includes(workerId)
        ? current.filter((id) => id !== workerId)
        : [...current, workerId],
    );
  };

  const selectVisible = () => {
    setSelectedIds((current) => [
      ...new Set([
        ...current,
        ...visibleWorkers.map((worker) => worker.generalPayrollWorkerId),
      ]),
    ]);
  };

  const clearVisible = () => {
    const visibleIds = new Set(
      visibleWorkers.map((worker) => worker.generalPayrollWorkerId),
    );
    setSelectedIds((current) =>
      current.filter((workerId) => !visibleIds.has(workerId)),
    );
  };

  const submit = async () => {
    if (removedWithRecords.length > 0) {
      setConfirmationOpen(true);
      return;
    }
    await onSave(selectedIds, false);
  };

  return (
    <div className="fixed inset-0 z-[310] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex gap-3">
            <span className="rounded-xl bg-[#eff5ff] p-3 text-[#0047a3]">
              <UserRoundCheck className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#0f2545]">
                Trabajadores del proyecto
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {project.project.code} · {project.project.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="size-5" />
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-600">
              {selectedIds.length} de {workers.length} seleccionados
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearVisible}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Quitar visibles
              </button>
              <button
                type="button"
                onClick={selectVisible}
                className="rounded-lg border border-[#0047a3] px-3 py-1.5 text-xs font-bold text-[#0047a3] hover:bg-[#eff5ff]"
              >
                Seleccionar visibles
              </button>
            </div>
          </div>

          <label className="my-4 flex items-center gap-2 rounded-xl border border-gray-300 px-3 focus-within:border-[#0047a3]">
            <Search className="size-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o DNI"
              className="w-full bg-transparent py-3 outline-none"
            />
          </label>

          <div className="space-y-2">
            {visibleWorkers.map((worker) => {
              const selected = selectedIds.includes(
                worker.generalPayrollWorkerId,
              );
              return (
                <label
                  key={worker.generalPayrollWorkerId}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                    selected
                      ? "border-[#0047a3]/40 bg-[#f7faff]"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      toggleWorker(worker.generalPayrollWorkerId)
                    }
                    className="size-4 accent-[#0047a3]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[#0f2545]">
                      {worker.worker.fullName}
                    </span>
                    <span className="block text-xs text-gray-500">
                      DNI {worker.worker.dni}
                    </span>
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">
                    {groupLabels[worker.group]}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <footer className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="rounded-xl bg-[#0047a3] px-5 py-2.5 font-bold text-white hover:bg-[#003b88] disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Aplicar selección"}
          </button>
        </footer>
      </div>

      {confirmationOpen && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="size-6" />
            </span>
            <h3 className="text-xl font-bold text-[#0f2545]">
              ¿Quitar trabajadores con registros?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Se borrarán sus asistencias y montos de este proyecto durante
              esta semana. Ya no serán considerados en los totales:
            </p>
            <ul className="mt-3 max-h-36 list-disc overflow-y-auto pl-5 text-sm font-semibold text-gray-700">
              {removedWithRecords.map((worker) => (
                <li key={worker.generalPayrollWorkerId}>
                  {worker.worker.fullName}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmationOpen(false)}
                className="rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-700"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => onSave(selectedIds, true)}
                className="rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? "Quitando..." : "Sí, quitar y borrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
