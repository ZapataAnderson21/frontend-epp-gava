import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { AddButton, SeeButton } from "../../common/button";
import Permission from "../../common/auth/Permission";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { HeaderPanel, Panel } from "../../common/panel";
import { Table } from "../../common/table";
import Select from "../../components/Select";
import type {
  WorkerMonthlyEvaluationPeriod,
  WorkerMonthlyEvaluationPeriodStatusPayload,
} from "../../data/types";
import { useCurrentUser, useWorkerMonthlyEvaluationPeriods } from "../../hooks";
import { monthlyEvaluationTypes } from "../../utils";
import MonthlyEvaluationPeriodDetailModal from "./MonthlyEvaluationPeriodDetailModal";
import TemplateManagerModal from "./TemplateManagerModal";
import WorkerMonthlyEvaluationForm from "./WorkerMonthlyEvaluationForm";

type ModalState =
  | { mode: "none" }
  | {
      mode: "create";
      initialWorkerId?: number;
      initialTemplateId?: number;
      initialYear?: number;
      initialMonth?: number;
      initialSequence?: number;
      lockPeriodFields?: boolean;
      returnPeriod?: WorkerMonthlyEvaluationPeriodStatusPayload;
    }
  | {
      mode: "edit";
      evaluationId: number;
      returnPeriod?: WorkerMonthlyEvaluationPeriodStatusPayload;
    }
  | { mode: "periodDetail"; period: WorkerMonthlyEvaluationPeriodStatusPayload }
  | { mode: "templates" };

const currentDate = new Date();
const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2000, index, 1).toLocaleDateString("es-PE", { month: "long" }),
}));

function monthName(month?: number) {
  if (!month) return "-";
  return new Date(2000, month - 1, 1).toLocaleDateString("es-PE", { month: "long" });
}

function formatKpiValue(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default function WorkerMonthlyEvaluations() {
  const { user } = useCurrentUser();
  const [searchParams] = useSearchParams();

  const monthFromQuery = Number(searchParams.get("month") || 0);
  const yearFromQuery = Number(searchParams.get("year") || 0);

  const [month, setMonth] = useState<number>(monthFromQuery || 0);
  const [year, setYear] = useState<number>(yearFromQuery || currentDate.getFullYear());
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState<ModalState>({ mode: "none" });

  const filters = useMemo(
    () => ({
      month: month || undefined,
      year: year || undefined,
    }),
    [month, year],
  );

  const {
    data: periods,
    loading,
    error,
    refetch,
  } = useWorkerMonthlyEvaluationPeriods(filters, [refreshKey]);

  const handleSaved = () => {
    setRefreshKey((prev) => prev + 1);
    refetch();
  };

  const openPeriodFromFilters = () => {
    if (!month || !year) {
      toast.error("Selecciona anio y mes para abrir la evaluacion mensual.");
      return;
    }

    setModal({
      mode: "periodDetail",
      period: { year, month, sequence: 1 },
    });
  };

  const columns = [
    {
      key: "year",
      label: "Periodo",
      width: "12rem",
      render: (row: WorkerMonthlyEvaluationPeriod) => `${monthName(row.month)} ${row.year}`,
    },
    {
      key: "status",
      label: "Estado",
      width: "8rem",
      render: (row: WorkerMonthlyEvaluationPeriod) => {
        const isOpen = row.status === "open";
        return (
          <span
            className={`px-2 py-1 rounded-full text-2xs font-semibold text-white ${isOpen ? "bg-emerald-600" : "bg-gray-500"}`}
          >
            {isOpen ? "ABIERTA" : "CERRADA"}
          </span>
        );
      },
    },
    {
      key: "evaluatedWorkers",
      label: "Evaluados / Pendientes",
      width: "14rem",
      render: (row: WorkerMonthlyEvaluationPeriod) =>
        `${row.evaluatedWorkers} / ${row.pendingWorkers}`,
    },
    {
      key: "averageScore",
      label: "Prom.",
      width: "8rem",
      render: (row: WorkerMonthlyEvaluationPeriod) => formatKpiValue(row.averageScore),
    },
    {
      key: "highestScore",
      label: "Max.",
      width: "8rem",
      render: (row: WorkerMonthlyEvaluationPeriod) => formatKpiValue(row.highestScore),
    },
    {
      key: "lowestScore",
      label: "Min.",
      width: "8rem",
      render: (row: WorkerMonthlyEvaluationPeriod) => formatKpiValue(row.lowestScore),
    },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: WorkerMonthlyEvaluationPeriod) => (
        <SeeButton
          onClick={() =>
            setModal({
              mode: "periodDetail",
              period: {
                year: row.year,
                month: row.month,
                sequence: 1,
              },
            })
          }
        />
      ),
    },
  ] as const;

  return (
    <Panel>
      <HeaderPanel name="Evaluaciones Mensuales" />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold">Mes</label>
            <Select<number>
              name="evaluationMonth"
              value={month}
              onChange={setMonth}
              options={[{ value: 0, label: "Todos los meses" }, ...monthOptions]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold">Anio</label>
            <input
              type="number"
              className="border border-gray-300 rounded-sm p-2"
              value={year}
              onChange={(event) => setYear(Number(event.target.value) || 0)}
            />
          </div>

          <div className="flex items-end justify-end">
            <Permission user={user} allow={monthlyEvaluationTypes}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  onClick={() => setModal({ mode: "templates" })}
                >
                  Plantillas
                </button>
                <AddButton onClick={openPeriodFromFilters} />
              </div>
            </Permission>
          </div>
        </div>

        {loading ? <LoadingSkeletonTable /> : null}
        {!loading && error ? <ErrorMessage errorMessage={error} /> : null}

        {!loading && !error && (!periods || periods.length === 0) ? (
          <div className="text-center text-gray-500">
            No se encontraron periodos para el filtro actual.
          </div>
        ) : null}

        {!loading && !error && periods && periods.length > 0 ? (
          <Table<WorkerMonthlyEvaluationPeriod> data={periods} columns={columns} />
        ) : null}
      </div>

      {modal.mode !== "none" ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          {modal.mode === "create" ? (
            <WorkerMonthlyEvaluationForm
              mode="create"
              initialWorkerId={modal.initialWorkerId}
              initialTemplateId={modal.initialTemplateId}
              initialYear={modal.initialYear}
              initialMonth={modal.initialMonth}
              initialSequence={modal.initialSequence}
              lockPeriodFields={modal.lockPeriodFields}
              onClose={() =>
                modal.returnPeriod
                  ? setModal({ mode: "periodDetail", period: modal.returnPeriod })
                  : setModal({ mode: "none" })
              }
              onSaved={handleSaved}
            />
          ) : modal.mode === "edit" ? (
            <WorkerMonthlyEvaluationForm
              mode="edit"
              evaluationId={modal.evaluationId}
              onClose={() =>
                modal.returnPeriod
                  ? setModal({ mode: "periodDetail", period: modal.returnPeriod })
                  : setModal({ mode: "none" })
              }
              onSaved={handleSaved}
            />
          ) : modal.mode === "periodDetail" ? (
            <MonthlyEvaluationPeriodDetailModal
              period={modal.period}
              onClose={() => setModal({ mode: "none" })}
              onSaved={handleSaved}
              onCreateEvaluation={(params) =>
                setModal({
                  mode: "create",
                  initialWorkerId: params.workerId,
                  initialTemplateId: params.templateId,
                  initialYear: params.year,
                  initialMonth: params.month,
                  initialSequence: 1,
                  lockPeriodFields: true,
                  returnPeriod: {
                    year: params.year,
                    month: params.month,
                    sequence: 1,
                  },
                })
              }
              onEditEvaluation={(evaluationId) =>
                setModal({
                  mode: "edit",
                  evaluationId,
                  returnPeriod: modal.period,
                })
              }
            />
          ) : (
            <TemplateManagerModal
              onClose={() => setModal({ mode: "none" })}
              onUpdated={handleSaved}
            />
          )}
        </div>
      ) : null}
    </Panel>
  );
}
