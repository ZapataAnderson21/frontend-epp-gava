import { payrollLocationName } from "./payrollLocation";
import { Search, UserRoundPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  GeneralPayrollProject,
  GeneralPayrollWorker,
  PayrollWorkerGroup,
} from "./types";
import WorkerSelectionCheck from "./WorkerSelectionCheck";

const groupLabels: Record<PayrollWorkerGroup, string> = {
  laborer: "Obreros",
  technician: "Técnicos",
};

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

interface Props {
  project: GeneralPayrollProject;
  workers: GeneralPayrollWorker[];
  saving: boolean;
  onClose: () => void;
  onSave: (generalPayrollWorkerIds: number[]) => Promise<void>;
}

export default function ProjectWorkerSelectionModal({
  project,
  workers,
  saving,
  onClose,
  onSave,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const activeIds = useMemo(
    () =>
      new Set(
        project.entries
          .filter((entry) => entry.isActive)
          .map((entry) => entry.generalPayrollWorkerId),
      ),
    [project.entries],
  );
  const removedWorkers = useMemo(
    () =>
      workers.filter(
        (worker) => !activeIds.has(worker.generalPayrollWorkerId),
      ),
    [activeIds, workers],
  );
  const normalizedSearch = normalizeSearch(search);
  const visibleWorkers = useMemo(
    () =>
      removedWorkers.filter((worker) =>
        normalizeSearch(`${worker.worker.fullName} ${worker.worker.dni}`).includes(
          normalizedSearch,
        ),
      ),
    [normalizedSearch, removedWorkers],
  );

  const toggleWorker = (workerId: number, selected: boolean) => {
    setSelectedIds((current) =>
      selected
        ? [...new Set([...current, workerId])]
        : current.filter((id) => id !== workerId),
    );
  };

  const allVisibleSelected =
    visibleWorkers.length > 0 &&
    visibleWorkers.every((worker) =>
      selectedIds.includes(worker.generalPayrollWorkerId),
    );

  const toggleVisible = () => {
    const visibleIds = new Set(
      visibleWorkers.map((worker) => worker.generalPayrollWorkerId),
    );
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((workerId) => !visibleIds.has(workerId))
        : [...new Set([...current, ...visibleIds])],
    );
  };

  const submit = async () => {
    await onSave([...activeIds, ...selectedIds]);
  };

  return (
    <div className="fixed inset-0 z-[310] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex gap-3">
            <span className="rounded-xl bg-[#eff5ff] p-3 text-[#0047a3]">
              <UserRoundPlus className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#0f2545]">
                Seleccionar trabajadores
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {project.project ? `${project.project.code} · ` : ""}
                {payrollLocationName(project)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selección de trabajadores"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="size-5" />
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-600">
              {selectedIds.length} seleccionados · {removedWorkers.length}{" "}
              disponibles
            </p>
            {visibleWorkers.length > 0 && (
              <button
                type="button"
                onClick={toggleVisible}
                className="rounded-lg border border-[#0047a3] px-3 py-1.5 text-xs font-bold text-[#0047a3] hover:bg-[#eff5ff]"
              >
                {allVisibleSelected
                  ? "Limpiar visibles"
                  : "Seleccionar visibles"}
              </button>
            )}
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
                <div
                  key={worker.generalPayrollWorkerId}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    selected
                      ? "border-[#0047a3]/40 bg-[#f7faff]"
                      : "border-gray-200"
                  }`}
                >
                  <WorkerSelectionCheck
                    checked={selected}
                    ariaLabel={`Seleccionar a ${worker.worker.fullName}`}
                    onChange={(nextSelected) =>
                      toggleWorker(
                        worker.generalPayrollWorkerId,
                        nextSelected,
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      toggleWorker(worker.generalPayrollWorkerId, !selected)
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate font-semibold text-[#0f2545]">
                      {worker.worker.fullName}
                    </span>
                    <span className="block text-xs text-gray-500">
                      DNI {worker.worker.dni}
                    </span>
                  </button>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">
                    {groupLabels[worker.group]}
                  </span>
                </div>
              );
            })}

            {visibleWorkers.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 px-5 py-10 text-center text-sm text-gray-500">
                {removedWorkers.length === 0
                  ? "Todos los trabajadores de la semana ya están en esta ubicación."
                  : "No hay trabajadores quitados que coincidan con la búsqueda."}
              </div>
            )}
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
            disabled={saving || selectedIds.length === 0}
            onClick={submit}
            className="rounded-xl bg-[#0047a3] px-5 py-2.5 font-bold text-white hover:bg-[#003b88] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Agregando..." : "Agregar seleccionados"}
          </button>
        </footer>
      </div>
    </div>
  );
}
