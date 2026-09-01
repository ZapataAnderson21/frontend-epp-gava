import { Search, Settings2, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  GeneralPayroll,
  PayrollProjectOption,
  PayrollWorkerGroup,
  PayrollWorkerOption,
} from "./types";

interface Props {
  activeProjects: PayrollProjectOption[];
  availableWorkers: PayrollWorkerOption[];
  payroll: GeneralPayroll;
  saving: boolean;
  onClose: () => void;
  onSave: (configuration: {
    projectIds: number[];
    workers: Array<{ workerId: number; group: PayrollWorkerGroup }>;
  }) => Promise<void>;
}

export default function PayrollConfigurationModal({
  activeProjects,
  availableWorkers,
  payroll,
  saving,
  onClose,
  onSave,
}: Props) {
  const [projectIds, setProjectIds] = useState<number[]>(
    payroll.projects.map((project) => project.projectId),
  );
  const [workers, setWorkers] = useState(
    payroll.workers.map((worker) => ({
      workerId: worker.workerId,
      group: worker.group,
    })),
  );
  const [search, setSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<PayrollWorkerGroup>("laborer");

  const normalizedSearch = search
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const naturalGroup = (worker: PayrollWorkerOption): PayrollWorkerGroup =>
    worker.workerType === "technician" ? "technician" : "laborer";

  const visibleProjects = useMemo(() => {
    const normalized = projectSearch
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
    if (!normalized) return activeProjects;
    return activeProjects.filter((project) =>
      `${project.code} ${project.name}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(normalized),
    );
  }, [activeProjects, projectSearch]);

  const visibleWorkers = useMemo(
    () =>
      availableWorkers.filter((worker) => {
        const matchesSearch = `${worker.fullName} ${worker.dni}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(normalizedSearch);
        const selected = workers.find(
          (item) => item.workerId === worker.workerId,
        );
        return (
          matchesSearch &&
          (naturalGroup(worker) === activeGroup ||
            selected?.group === activeGroup)
        );
      }),
    [activeGroup, availableWorkers, normalizedSearch, workers],
  );

  const toggleProject = (projectId: number) => {
    setProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  };

  const toggleWorker = (
    worker: PayrollWorkerOption,
    group: PayrollWorkerGroup,
  ) => {
    setWorkers((current) => {
      const selected = current.find(
        (item) => item.workerId === worker.workerId,
      );
      if (selected?.group === group) {
        return current.filter((item) => item.workerId !== worker.workerId);
      }
      return [
        ...current.filter((item) => item.workerId !== worker.workerId),
        {
          workerId: worker.workerId,
          group,
        },
      ];
    });
  };

  const addGroup = (group: PayrollWorkerGroup) => {
    setWorkers((current) => {
      const next = new Map(current.map((worker) => [worker.workerId, worker]));
      availableWorkers
        .filter((worker) => naturalGroup(worker) === group)
        .forEach((worker) =>
          next.set(worker.workerId, { workerId: worker.workerId, group }),
        );
      return [...next.values()];
    });
  };

  const addAll = () => {
    setWorkers(
      availableWorkers.map((worker) => ({
        workerId: worker.workerId,
        group: naturalGroup(worker),
      })),
    );
  };

  const clearGroup = (group: PayrollWorkerGroup) => {
    setWorkers((current) => current.filter((worker) => worker.group !== group));
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-gray-200 px-5 py-4 md:px-7">
          <div className="flex gap-3">
            <span className="rounded-xl bg-[#eff5ff] p-3 text-[#0047a3]">
              <Settings2 className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#0f2545]">
                Configurar semana
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Elige los proyectos visibles y organiza el padrón en dos grupos.
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

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[0.8fr_1.2fr]">
          <section className="border-b border-gray-200 p-5 lg:border-b-0 lg:border-r md:p-7">
            <h3 className="font-bold text-[#0f2545]">Proyectos activos</h3>
            <p className="mb-4 mt-1 text-xs text-gray-500">
              {projectIds.length} seleccionados
            </p>
            <label className="mb-4 flex items-center gap-2 rounded-xl border border-gray-300 px-3 focus-within:border-[#0047a3]">
              <Search className="size-4 text-gray-400" />
              <input
                type="search"
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Buscar por código o nombre"
                className="w-full bg-transparent py-3 outline-none"
              />
            </label>
            <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
              {visibleProjects.map((project) => (
                <label
                  key={project.projectId}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={projectIds.includes(project.projectId)}
                    onChange={() => toggleProject(project.projectId)}
                    className="mt-1 size-4 accent-[#0047a3]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[#0f2545]">
                      {project.name}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {project.code}
                    </span>
                  </span>
                </label>
              ))}
              {visibleProjects.length === 0 && (
                <p className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                  No se encontraron proyectos.
                </p>
              )}
            </div>
          </section>

          <section className="min-w-0 p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#0f2545]">
                  Lista de trabajadores
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {workers.length} seleccionados
                </p>
              </div>
              <button
                type="button"
                onClick={addAll}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#0047a3] px-3 py-2 text-xs font-bold text-white hover:bg-[#003b88]"
              >
                <UserPlus className="size-4" />
                Agregar todos
              </button>
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

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1.5">
              {(["laborer", "technician"] as const).map((group) => {
                const count = workers.filter(
                  (worker) => worker.group === group,
                ).length;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setActiveGroup(group)}
                    className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                      activeGroup === group
                        ? "bg-white text-[#0047a3] shadow-sm"
                        : "text-gray-500 hover:text-[#0f2545]"
                    }`}
                  >
                    {group === "laborer" ? "Obreros" : "Técnicos"} ({count})
                  </button>
                );
              })}
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Añade trabajadores directamente al grupo{" "}
                {activeGroup === "laborer" ? "Obreros" : "Técnicos"}.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => clearGroup(activeGroup)}
                  className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Vaciar grupo
                </button>
                <button
                  type="button"
                  onClick={() => addGroup(activeGroup)}
                  className="cursor-pointer rounded-lg border border-[#0047a3] px-3 py-1.5 text-xs font-bold text-[#0047a3] hover:bg-[#eff5ff]"
                >
                  Agregar grupo
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {visibleWorkers.map((worker) => {
                const selected = workers.find(
                  (item) => item.workerId === worker.workerId,
                );
                const selectedInActiveGroup = selected?.group === activeGroup;
                return (
                  <div
                    key={worker.workerId}
                    className={`rounded-xl border p-3 ${selectedInActiveGroup ? "border-[#0047a3]/40 bg-[#f7faff]" : "border-gray-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedInActiveGroup}
                        onChange={() => toggleWorker(worker, activeGroup)}
                        className="mt-1 size-4 accent-[#0047a3]"
                      />
                      <button
                        type="button"
                        onClick={() => toggleWorker(worker, activeGroup)}
                        className="min-w-0 flex-1 cursor-pointer text-left"
                      >
                        <span className="block truncate font-semibold text-[#0f2545]">
                          {worker.fullName}
                        </span>
                        <span className="block text-xs text-gray-500">
                          DNI {worker.dni}
                        </span>
                      </button>
                      {selected && !selectedInActiveGroup && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                          En{" "}
                          {selected.group === "laborer"
                            ? "Obreros"
                            : "Técnicos"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {visibleWorkers.length === 0 && (
                <p className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                  No se encontraron trabajadores para este grupo.
                </p>
              )}
            </div>
          </section>
        </div>

        <footer className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 md:px-7">
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
            onClick={() => onSave({ projectIds, workers })}
            className="rounded-xl bg-[#0047a3] px-5 py-2.5 font-bold text-white shadow-sm hover:bg-[#003b88] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Aplicar configuración"}
          </button>
        </footer>
      </div>
    </div>
  );
}
