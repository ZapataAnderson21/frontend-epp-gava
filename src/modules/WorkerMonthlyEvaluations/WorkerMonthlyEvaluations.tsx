import { useMemo, useState } from "react";
import { AddButton, SeeButton } from "../../common/button";
import Permission from "../../common/auth/Permission";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { HeaderPanel, Panel } from "../../common/panel";
import { Table } from "../../common/table";
import { workerApi } from "../../data/apiUrl";
import type { Worker, WorkerMonthlyEvaluation } from "../../data/types";
import { useCurrentUser, useFetch, useWorkerMonthlyEvaluations } from "../../hooks";
import { monthlyEvaluationTypes } from "../../utils";
import WorkerMonthlyEvaluationForm from "./WorkerMonthlyEvaluationForm";
import TemplateManagerModal from "./TemplateManagerModal";
import { useSearchParams } from "react-router-dom";

type ModalState =
  | { mode: "none" }
  | { mode: "create" }
  | { mode: "edit"; evaluationId: number }
  | { mode: "templates" };

const currentDate = new Date();

function monthName(month?: number) {
  if (!month) return "-";
  return new Date(2000, month - 1, 1).toLocaleDateString("es-PE", { month: "long" });
}

export default function WorkerMonthlyEvaluations() {
  const { user } = useCurrentUser();
  const [searchParams] = useSearchParams();

  const workerFromQuery = Number(searchParams.get("workerId") || 0);
  const monthFromQuery = Number(searchParams.get("month") || 0);
  const yearFromQuery = Number(searchParams.get("year") || 0);

  const [workerId, setWorkerId] = useState<number>(workerFromQuery || 0);
  const [month, setMonth] = useState<number>(monthFromQuery || currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(yearFromQuery || currentDate.getFullYear());
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState<ModalState>({ mode: "none" });

  const { data: workers } = useFetch<Worker[]>(workerApi);

  const filters = useMemo(
    () => ({
      workerId: workerId || undefined,
      month: month || undefined,
      year: year || undefined,
    }),
    [workerId, month, year],
  );

  const {
    data: evaluations,
    loading,
    error,
    refetch,
  } = useWorkerMonthlyEvaluations(filters, [refreshKey]);

  const handleSaved = () => {
    setRefreshKey((prev) => prev + 1);
    refetch();
  };

  const columns = [
    {
      key: "workerId",
      label: "Trabajador",
      width: "18rem",
      render: (row: WorkerMonthlyEvaluation) => row.worker?.fullName ?? `ID ${row.workerId}`,
    },
    {
      key: "year",
      label: "Período",
      width: "12rem",
      render: (row: WorkerMonthlyEvaluation) => `${monthName(row.month)} ${row.year}`,
    },
    { key: "sequence", label: "Secuencia", width: "8rem" },
    {
      key: "status",
      label: "Estado",
      width: "8rem",
      render: (row: WorkerMonthlyEvaluation) => {
        const isOpen = row.status === "open";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${isOpen ? "bg-emerald-600" : "bg-gray-500"}`}
          >
            {isOpen ? "ABIERTA" : "CERRADA"}
          </span>
        );
      },
    },
    {
      key: "totalScore",
      label: "Puntaje",
      width: "10rem",
      render: (row: WorkerMonthlyEvaluation) => `${row.totalScore ?? 0}/${row.maxScore ?? 0}`,
    },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: WorkerMonthlyEvaluation) => (
        <SeeButton onClick={() => setModal({ mode: "edit", evaluationId: row.workerMonthlyEvaluationId })} />
      ),
    },
  ] as const;

  return (
    <Panel>
      <HeaderPanel name="Evaluaciones Mensuales" />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold">Trabajador</label>
            <select
              className="border border-gray-300 rounded-sm p-2"
              value={workerId || ""}
              onChange={(event) => setWorkerId(Number(event.target.value) || 0)}
            >
              <option value="">Todos</option>
              {workers?.map((worker) => (
                <option key={worker.workerId} value={worker.workerId}>
                  {worker.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold">Mes</label>
            <input
              type="number"
              min={1}
              max={12}
              className="border border-gray-300 rounded-sm p-2"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value) || 0)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold">Año</label>
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
                <AddButton onClick={() => setModal({ mode: "create" })} />
              </div>
            </Permission>
          </div>
        </div>

        {loading ? <LoadingSkeletonTable /> : null}
        {!loading && error ? <ErrorMessage errorMessage={error} /> : null}

        {!loading && !error && (!evaluations || evaluations.length === 0) ? (
          <div className="text-center text-gray-500">No se encontraron evaluaciones para el filtro actual.</div>
        ) : null}

        {!loading && !error && evaluations && evaluations.length > 0 ? (
          <Table<WorkerMonthlyEvaluation> data={evaluations} columns={columns} />
        ) : null}
      </div>

      {modal.mode !== "none" ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          {modal.mode === "create" ? (
            <WorkerMonthlyEvaluationForm
              mode="create"
              initialWorkerId={workerId || undefined}
              onClose={() => setModal({ mode: "none" })}
              onSaved={handleSaved}
            />
          ) : modal.mode === "edit" ? (
            <WorkerMonthlyEvaluationForm
              mode="edit"
              evaluationId={modal.evaluationId}
              onClose={() => setModal({ mode: "none" })}
              onSaved={handleSaved}
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
