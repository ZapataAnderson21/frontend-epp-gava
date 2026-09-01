import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Save,
  Settings2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { generalPayrollApi } from "../../data/apiUrl";
import { useApiAction, useCurrentUser, useFetch } from "../../hooks";
import { logisticsTypes } from "../../utils";
import PayrollConfigurationModal from "./PayrollConfigurationModal";
import { GeneralPayrollGrid, ProjectPayrollGrid } from "./PayrollGrid";
import type {
  GeneralPayroll,
  GeneralPayrollDetail,
  GeneralPayrollEntry,
  GeneralPayrollWorker,
  PayrollWorkerGroup,
} from "./types";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

const dayKeys = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "dominical",
] as const;

export default function GeneralWeeklyPayroll() {
  const { user } = useCurrentUser();
  const canEdit = logisticsTypes.includes(user?.userType ?? "");
  const { weekId } = useParams();
  const navigate = useNavigate();
  const url = weekId ? `${generalPayrollApi}weeks/${weekId}` : "";
  const { data, loading, error, refetch } = useFetch<GeneralPayrollDetail>(
    url,
    [weekId],
  );
  const { execute: initialize, loading: initializing } =
    useApiAction<GeneralPayrollDetail>();
  const { execute: configure, loading: configuring } =
    useApiAction<GeneralPayrollDetail>();
  const { execute: persist, loading: saving } =
    useApiAction<GeneralPayrollDetail>();
  const [payroll, setPayroll] = useState<GeneralPayroll | null>(null);
  const [activeTab, setActiveTab] = useState<number | "general">("general");
  const [configurationOpen, setConfigurationOpen] = useState(false);

  useEffect(() => {
    setPayroll(data?.payroll ? structuredClone(data.payroll) : null);
  }, [data]);

  useEffect(() => {
    if (
      activeTab !== "general" &&
      payroll &&
      !payroll.projects.some(
        (project) => project.generalPayrollProjectId === activeTab,
      )
    ) {
      setActiveTab("general");
    }
  }, [activeTab, payroll]);

  const selectedProject = useMemo(
    () =>
      activeTab === "general"
        ? null
        : (payroll?.projects.find(
            (project) => project.generalPayrollProjectId === activeTab,
          ) ?? null),
    [activeTab, payroll],
  );

  const totalNet = useMemo(() => {
    if (!payroll) return 0;
    const workerById = new Map(
      payroll.workers.map((worker) => [worker.generalPayrollWorkerId, worker]),
    );
    const entriesNet = payroll.projects
      .flatMap((project) => project.entries)
      .reduce((total, entry) => {
        const worker = workerById.get(entry.generalPayrollWorkerId);
        if (!worker) return total;
        const days = dayKeys.reduce((sum, key) => sum + entry[key], 0);
        return (
          total +
          days * worker.dailyWage +
          entry.overtimeAmount -
          entry.afpDiscount -
          entry.advanceDiscount
        );
      }, 0);
    return payroll.workers.reduce(
      (total, worker) =>
        total +
        worker.additionalAmount +
        worker.liquidationAmount +
        worker.sundayDinnerAmount,
      entriesNet,
    );
  }, [payroll]);

  const handleInitialize = async (copyPreviousWorkers: boolean) => {
    if (!weekId) return;
    try {
      const response = await initialize(
        `${generalPayrollApi}weeks/${weekId}/initialize`,
        "POST",
        { copyPreviousWorkers },
      );
      setPayroll(response.data.payroll);
      toast.success(
        copyPreviousWorkers
          ? "Lista anterior copiada correctamente."
          : "Planilla semanal creada.",
      );
      refetch();
      if (!copyPreviousWorkers || !response.data.payroll?.projects.length) {
        setConfigurationOpen(true);
      }
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo crear la planilla.",
      );
    }
  };

  const handleConfigure = async (configuration: {
    projectIds: number[];
    workers: Array<{ workerId: number; group: PayrollWorkerGroup }>;
  }) => {
    if (!weekId) return;
    try {
      const response = await configure(
        `${generalPayrollApi}weeks/${weekId}/configuration`,
        "PUT",
        configuration,
      );
      setPayroll(response.data.payroll);
      setConfigurationOpen(false);
      setActiveTab("general");
      toast.success("Configuración actualizada.");
      refetch();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo actualizar la configuración.",
      );
    }
  };

  const handleEntryChange = (
    entryId: number,
    field: keyof GeneralPayrollEntry,
    value: number,
  ) => {
    setPayroll((current) =>
      current
        ? {
            ...current,
            projects: current.projects.map((project) => ({
              ...project,
              entries: project.entries.map((entry) =>
                entry.generalPayrollEntryId === entryId
                  ? { ...entry, [field]: value }
                  : entry,
              ),
            })),
          }
        : current,
    );
  };

  const handleWorkerChange = (
    workerId: number,
    field: keyof GeneralPayrollWorker,
    value: number,
  ) => {
    setPayroll((current) =>
      current
        ? {
            ...current,
            workers: current.workers.map((worker) =>
              worker.generalPayrollWorkerId === workerId
                ? { ...worker, [field]: value }
                : worker,
            ),
          }
        : current,
    );
  };

  const handleSave = async () => {
    if (!weekId || !payroll) return;
    try {
      const response = await persist(
        `${generalPayrollApi}weeks/${weekId}`,
        "PUT",
        {
          workers: payroll.workers.map((worker) => ({
            generalPayrollWorkerId: worker.generalPayrollWorkerId,
            dailyWage: worker.dailyWage,
            additionalAmount: worker.additionalAmount,
            liquidationAmount: worker.liquidationAmount,
            sundayDinnerAmount: worker.sundayDinnerAmount,
          })),
          entries: payroll.projects.flatMap((project) =>
            project.entries.map((entry) => ({
              generalPayrollEntryId: entry.generalPayrollEntryId,
              monday: entry.monday,
              tuesday: entry.tuesday,
              wednesday: entry.wednesday,
              thursday: entry.thursday,
              friday: entry.friday,
              saturday: entry.saturday,
              dominical: entry.dominical,
              overtimeAmount: entry.overtimeAmount,
              afpDiscount: entry.afpDiscount,
              advanceDiscount: entry.advanceDiscount,
            })),
          ),
        },
      );
      setPayroll(response.data.payroll);
      toast.success("Planilla guardada correctamente.");
      refetch();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo guardar la planilla.",
      );
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] p-8">
        <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[1600px] p-8">
        <button
          type="button"
          onClick={() => navigate("/admin/payrolls")}
          className="mb-5 flex items-center gap-2 text-[#0047a3]"
        >
          <ArrowLeft className="size-4" /> Volver
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error ?? "No se encontró la semana."}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1800px] p-4 md:p-8">
      <Toaster position="top-right" />
      <header className="mb-7">
        <button
          type="button"
          onClick={() => navigate("/admin/payrolls")}
          className="mb-5 flex items-center gap-2 font-semibold text-[#0047a3] hover:underline"
        >
          <ArrowLeft className="size-4" /> Volver a semanas
        </button>
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#0047a3]">
              <CalendarDays className="size-4" /> Planilla semanal
            </p>
            <h1 className="text-2xl font-bold text-[#0f2545] md:text-3xl">
              {dateFormatter.format(new Date(data.week.startDate))} al{" "}
              {dateFormatter.format(new Date(data.week.endDate))}
            </h1>
          </div>
          {payroll && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="mr-2 rounded-xl bg-emerald-50 px-4 py-2">
                <p className="text-xs text-emerald-700">Neto consolidado</p>
                <p className="font-bold text-emerald-800">
                  {moneyFormatter.format(totalNet)}
                </p>
              </div>
              {canEdit ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfigurationOpen(true)}
                    className="flex items-center gap-2 rounded-xl border border-[#0047a3] bg-white px-4 py-2.5 font-bold text-[#0047a3] hover:bg-[#eff5ff]"
                  >
                    <Settings2 className="size-4" /> Configurar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-[#0047a3] px-5 py-2.5 font-bold text-white shadow-sm hover:bg-[#003b88] disabled:opacity-60"
                  >
                    <Save className="size-4" />{" "}
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </>
              ) : (
                <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                  Solo lectura
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {!payroll && (
        <section className="rounded-2xl border border-dashed border-[#0047a3]/30 bg-[#f8fbff] px-6 py-14 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#eaf2ff] text-[#0047a3]">
            <ClipboardList className="size-7" />
          </span>
          <h2 className="text-xl font-bold text-[#0f2545]">
            Esta semana todavía no tiene planilla
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-gray-600">
            {canEdit
              ? "Puedes crear un padrón vacío o reutilizar la lista de la última semana y modificarla después."
              : "La planilla todavía no ha sido configurada por administración."}
          </p>
          {canEdit ? (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                disabled={initializing}
                onClick={() => handleInitialize(false)}
                className="rounded-xl border border-[#0047a3] bg-white px-5 py-3 font-bold text-[#0047a3] hover:bg-[#eff5ff] disabled:opacity-60"
              >
                Crear lista vacía
              </button>
              {data.previousPayrollWeekId && (
                <button
                  type="button"
                  disabled={initializing}
                  onClick={() => handleInitialize(true)}
                  className="flex items-center gap-2 rounded-xl bg-[#0047a3] px-5 py-3 font-bold text-white hover:bg-[#003b88] disabled:opacity-60"
                >
                  <Users className="size-4" /> Copiar lista anterior
                </button>
              )}
            </div>
          ) : null}
        </section>
      )}

      {payroll && (
        <>
          <nav className="mb-5 flex gap-2 overflow-x-auto border-b border-gray-200 pb-px">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`shrink-0 border-b-2 px-4 py-3 font-bold transition ${activeTab === "general" ? "border-[#0047a3] text-[#0047a3]" : "border-transparent text-gray-500 hover:text-[#0f2545]"}`}
            >
              General
            </button>
            {payroll.projects.map((project) => (
              <button
                key={project.generalPayrollProjectId}
                type="button"
                onClick={() => setActiveTab(project.generalPayrollProjectId)}
                title={project.project.name}
                className={`max-w-64 shrink-0 truncate border-b-2 px-4 py-3 font-bold transition ${activeTab === project.generalPayrollProjectId ? "border-[#0047a3] text-[#0047a3]" : "border-transparent text-gray-500 hover:text-[#0f2545]"}`}
              >
                {project.project.name}
              </button>
            ))}
          </nav>

          {payroll.workers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
              <p className="font-semibold text-[#0f2545]">
                La lista de trabajadores está vacía.
              </p>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setConfigurationOpen(true)}
                  className="mt-4 rounded-xl bg-[#0047a3] px-5 py-2.5 font-bold text-white"
                >
                  Añadir trabajadores
                </button>
              ) : null}
            </div>
          ) : activeTab === "general" ? (
            <GeneralPayrollGrid
              projects={payroll.projects}
              workers={payroll.workers}
              onWorkerChange={handleWorkerChange}
              readOnly={!canEdit}
            />
          ) : selectedProject ? (
            <ProjectPayrollGrid
              project={selectedProject}
              projects={payroll.projects}
              workers={payroll.workers}
              onEntryChange={handleEntryChange}
              onWorkerChange={handleWorkerChange}
              readOnly={!canEdit}
            />
          ) : null}

          {payroll.projects.length === 0 && payroll.workers.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              Selecciona al menos un proyecto para empezar a registrar la
              distribución semanal.
            </div>
          )}
        </>
      )}

      {canEdit && configurationOpen && payroll && (
        <PayrollConfigurationModal
          activeProjects={data.activeProjects}
          availableWorkers={data.availableWorkers}
          payroll={payroll}
          saving={configuring}
          onClose={() => setConfigurationOpen(false)}
          onSave={handleConfigure}
        />
      )}
    </main>
  );
}
