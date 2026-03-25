import { useEffect, useMemo, useState } from "react";
import DeleteConfirmDialog from "../../components/DeleteConfirmDialog";
import toast, { Toaster } from "react-hot-toast";
import { IoCloseCircle } from "react-icons/io5";
import { ErrorMessage } from "../../common/error";
import { Loading } from "../../common/loading";
import { Table } from "../../common/table";
import type {
  WorkerMonthlyEvaluationPeriodStatusPayload,
  WorkerMonthlyEvaluationPeriodWorker,
} from "../../data/types";
import {
  useCurrentUser,
  useMonthlyEvaluationTemplates,
  useWorkerMonthlyEvaluationActions,
  useWorkerMonthlyEvaluationPeriodDetail,
} from "../../hooks";
import { monthlyEvaluationStatusTypes } from "../../utils";
import BestWorkerCertificateModal from "./BestWorkerCertificateModal";

interface CreateFromPeriodParams {
  workerId: number;
  year: number;
  month: number;
  sequence: number;
  templateId: number;
}

interface MonthlyEvaluationPeriodDetailModalProps {
  period: WorkerMonthlyEvaluationPeriodStatusPayload;
  onClose: () => void;
  onSaved: () => void;
  onCreateEvaluation: (params: CreateFromPeriodParams) => void;
  onEditEvaluation: (evaluationId: number) => void;
}

function formatMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString("es-PE", {
    month: "long",
  });
}

function formatKpi(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default function MonthlyEvaluationPeriodDetailModal({
  period,
  onClose,
  onSaved,
  onCreateEvaluation,
  onEditEvaluation,
}: MonthlyEvaluationPeriodDetailModalProps) {
  const { user } = useCurrentUser();
  const {
    data: templates,
    loading: loadingTemplates,
  } = useMonthlyEvaluationTemplates();
  const {
    data: detail,
    loading,
    error,
    refetch,
  } = useWorkerMonthlyEvaluationPeriodDetail(period, [period.year, period.month, period.sequence]);
  const { openPeriod, closePeriod, loading: changingStatus } =
    useWorkerMonthlyEvaluationActions();

  const canToggleStatus = useMemo(
    () => Boolean(user?.userType && monthlyEvaluationStatusTypes.includes(user.userType)),
    [user],
  );

  const isPeriodClosed = detail?.status === "closed";
  const hasEvaluations = (detail?.kpis.evaluatedWorkers ?? 0) > 0;
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(0);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const lockedTemplateId = detail?.templateSuggestion?.monthlyEvaluationTemplateId ?? 0;
  const periodTemplateId = hasEvaluations ? lockedTemplateId : selectedTemplateId;

  useEffect(() => {
    if (!detail) return;

    if (hasEvaluations && lockedTemplateId) {
      setSelectedTemplateId(lockedTemplateId);
      return;
    }

    if (selectedTemplateId) return;
    const defaultTemplateId = templates?.[0]?.monthlyEvaluationTemplateId ?? 0;
    if (defaultTemplateId) {
      setSelectedTemplateId(defaultTemplateId);
    }
  }, [detail, hasEvaluations, lockedTemplateId, selectedTemplateId, templates]);

  const handleTogglePeriodStatus = async () => {
    if (!detail) return;

    const nextStatus = detail.status === "closed" ? "open" : "closed";
    const action = nextStatus === "open" ? openPeriod(period) : closePeriod(period);

    await toast.promise(action, {
      loading:
        nextStatus === "open"
          ? "Abriendo periodo de evaluacion..."
          : "Cerrando periodo de evaluacion...",
      success: () => {
        refetch();
        onSaved();
        return nextStatus === "open"
          ? "Periodo abierto correctamente"
          : "Periodo cerrado correctamente";
      },
      error: (err) => err.message || "No se pudo actualizar el estado del periodo",
    });
  };

  const handleCloseConfirm = async () => {
    setShowCloseConfirm(false);
    await handleTogglePeriodStatus();
  };

  const columns = [
    {
      key: "fullName",
      label: "Trabajador",
      width: "20rem",
      render: (row: WorkerMonthlyEvaluationPeriodWorker) => row.fullName,
    },
    {
      key: "status",
      label: "Estado",
      width: "12rem",
      render: (row: WorkerMonthlyEvaluationPeriodWorker) => {
        if (!row.evaluated) {
          return (
            <span className="px-2 py-1 rounded-full text-xs font-semibold text-gray-700 bg-gray-100">
              PENDIENTE
            </span>
          );
        }

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
      width: "8rem",
      render: (row: WorkerMonthlyEvaluationPeriodWorker) =>
        row.evaluated ? `${row.totalScore ?? 0}/${row.maxScore ?? 0}` : "-",
    },
    {
      key: "performanceLabel",
      label: "Desempeno",
      width: "16rem",
      render: (row: WorkerMonthlyEvaluationPeriodWorker) =>
        row.performanceLabel ?? "-",
    },
    {
      label: "Acciones",
      width: "12rem",
      render: (row: WorkerMonthlyEvaluationPeriodWorker) => {
        if (row.workerMonthlyEvaluationId) {
          return (
            <button
              type="button"
              className="px-3 py-1 rounded-md bg-[#0047a3] hover:bg-[#003366] text-white text-sm font-semibold"
              onClick={() => onEditEvaluation(row.workerMonthlyEvaluationId!)}
            >
              Ver / Evaluar
            </button>
          );
        }

        return (
          <button
            type="button"
            className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() =>
              onCreateEvaluation({
                workerId: row.workerId,
                year: period.year,
                month: period.month,
                sequence: period.sequence ?? 1,
                templateId: periodTemplateId,
              })
            }
            disabled={isPeriodClosed || !periodTemplateId}
          >
            {isPeriodClosed
              ? "Periodo cerrado"
              : !periodTemplateId
                ? "Define plantilla"
                : "Evaluar"}
          </button>
        );
      },
    },
  ] as const;

  if (loading) {
    return (
      <div className="bg-white rounded-xl w-[min(1200px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
        <Loading />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="bg-white rounded-xl w-[min(1200px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
        <ErrorMessage errorMessage={error || "No se pudo cargar el periodo"} />
        <button type="button" className="absolute right-3 top-3" onClick={onClose}>
          <IoCloseCircle className="size-8" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl w-[min(1200px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
      <h2 className="text-2xl font-extrabold mb-2">
        Periodo: {formatMonthName(detail.month)} {detail.year}
      </h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${detail.status === "open" ? "bg-emerald-600" : "bg-gray-500"}`}
        >
          {detail.status === "open" ? "ABIERTA" : "CERRADA"}
        </span>

        {detail.templateSuggestion ? (
          hasEvaluations ? (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700">
              Plantilla del periodo: {detail.templateSuggestion.templateName}
            </span>
          ) : null
        ) : (
          hasEvaluations ? (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-50 text-amber-700">
              No se encontro la plantilla del periodo
            </span>
          ) : null
        )}

        {!hasEvaluations ? (
          <div className="flex items-center gap-2">
            <label className="font-semibold text-sm">Plantilla del mes</label>
            <select
              className="border border-gray-300 rounded-sm p-2 text-sm min-w-[22rem]"
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(Number(event.target.value) || 0)}
              disabled={loadingTemplates}
            >
              <option value={0}>
                {loadingTemplates ? "Cargando plantillas..." : "Selecciona una plantilla"}
              </option>
              {templates?.map((template) => (
                <option
                  key={template.monthlyEvaluationTemplateId}
                  value={template.monthlyEvaluationTemplateId}
                >
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {canToggleStatus ? (
          <>
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-white font-semibold ${detail.status === "open" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"} disabled:opacity-60`}
              onClick={() => {
                if (detail.status === "open") {
                  setShowCloseConfirm(true);
                } else {
                  handleTogglePeriodStatus();
                }
              }}
              disabled={changingStatus || !hasEvaluations}
            >
              {detail.status === "open" ? "Cerrar evaluacion" : "Abrir evaluacion"}
            </button>
            <DeleteConfirmDialog
              isOpen={showCloseConfirm}
              title="¿Estás seguro de que quieres cerrar esta evaluación?"
              message="Una vez cerrada, no se podrán realizar más evaluaciones en este periodo."
              onCancel={() => setShowCloseConfirm(false)}
              onConfirm={handleCloseConfirm}
              confirmText="Cerrar evaluación"
              loading={changingStatus}
            />
          </>
        ) : null}

        {isPeriodClosed && hasEvaluations ? (
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            onClick={() => setShowCertificate(true)}
          >
            🏆 Certificado Mejor Trabajador
          </button>
        ) : null}

        {!hasEvaluations ? (
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-50 text-amber-700">
            Aun no hay evaluaciones creadas en este periodo
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500">Promedio de notas</p>
          <p className="text-2xl font-extrabold">{formatKpi(detail.kpis.averageScore)}</p>
        </div>
        <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500">Nota mas alta</p>
          <p className="text-2xl font-extrabold">{formatKpi(detail.kpis.highestScore)}</p>
        </div>
        <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500">Nota mas baja</p>
          <p className="text-2xl font-extrabold">{formatKpi(detail.kpis.lowestScore)}</p>
        </div>
        <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500">Evaluados / Pendientes</p>
          <p className="text-2xl font-extrabold">
            {detail.kpis.evaluatedWorkers} / {detail.kpis.pendingWorkers}
          </p>
        </div>
      </div>

      <Table<WorkerMonthlyEvaluationPeriodWorker> data={detail.workers} columns={columns} />

      <button type="button" className="absolute right-3 top-3" onClick={onClose}>
        <IoCloseCircle className="size-8" />
      </button>

      {showCertificate && detail ? (
        <BestWorkerCertificateModal
          detail={detail}
          onClose={() => setShowCertificate(false)}
        />
      ) : null}

      <Toaster position="top-center" />
    </div>
  );
}
