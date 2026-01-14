import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser, useFetch, useApiAction } from "../../hooks";
import { ReturnButton } from "../../common/button";
import { HeaderPanel, Panel } from "../../common/panel";
import { ErrorMessage } from "../../common/error";
import { adminTypes, formatToLongMonthDate } from "../../utils";
import Permission from "../../common/auth/Permission";
import { useEffect, useState, useMemo } from "react";
import { weeklyWageApi } from "../../data/apiUrl";
import { AiOutlineLoading } from "react-icons/ai";
import { Button } from "../../components";
import { FaSave } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { LoadingSkeletonTable } from "../../common/loading";
import { GeneralPayrollSummaryCards, GeneralPayrollTable } from "./components";
import type { WorkerPayrollDetail, WeekPayrollDetail } from "./types";
import { FaFileExcel } from "react-icons/fa";

export default function GeneralWeeklyPayroll() {
  const { user } = useCurrentUser();
  const { weekId } = useParams<{ weekId: string }>();
  const navigate = useNavigate();

  const { data: weekData, loading: weekLoading, error: weekError } = useFetch<WeekPayrollDetail>(
    `${weeklyWageApi}week/${weekId}`,
    [weekId]
  );

  const [laborers, setLaborers] = useState<WorkerPayrollDetail[]>([]);
  const [technicians, setTechnicians] = useState<WorkerPayrollDetail[]>([]);

  const { execute, loading: saving } = useApiAction<any>();

  useEffect(() => {
    if (!weekData) return;
    setLaborers(weekData.workers.filter((w) => w.workerType === "laborer"));
    setTechnicians(weekData.workers.filter((w) => w.workerType === "technician"));
  }, [weekData]);

  // Calcular totales dinámicamente
  const summary = useMemo(() => {
    const allWorkers = [...laborers, ...technicians];
    return {
      totalGross: allWorkers.reduce((sum, w) => sum + w.grossAmount, 0),
      totalNet: allWorkers.reduce((sum, w) => sum + w.weeklyWage, 0),
    };
  }, [laborers, technicians]);

  if (!weekId || isNaN(Number(weekId)) || Number(weekId) <= 0) {
    return <ErrorMessage errorMessage="No se encontró la semana." />;
  }

  const handleAfpChange = (workerId: number, value: number, type: "laborer" | "technician") => {
    const updateFn = (prev: WorkerPayrollDetail[]) =>
      prev.map((w) => {
        if (w.workerId === workerId) {
          const newAfp = value;
          const weeklyWage = w.grossAmount - newAfp - w.advanceDiscount;
          return { ...w, afpDiscount: newAfp, weeklyWage: Math.max(0, weeklyWage) };
        }
        return w;
      });

    if (type === "laborer") {
      setLaborers(updateFn);
    } else {
      setTechnicians(updateFn);
    }
  };

  const handleAdvanceChange = (workerId: number, value: number, type: "laborer" | "technician") => {
    const updateFn = (prev: WorkerPayrollDetail[]) =>
      prev.map((w) => {
        if (w.workerId === workerId) {
          const newAdvance = value;
          const weeklyWage = w.grossAmount - w.afpDiscount - newAdvance;
          return { ...w, advanceDiscount: newAdvance, weeklyWage: Math.max(0, weeklyWage) };
        }
        return w;
      });

    if (type === "laborer") {
      setLaborers(updateFn);
    } else {
      setTechnicians(updateFn);
    }
  };

  const handleSave = async () => {
    const allWorkers = [...laborers, ...technicians];

    const payload = {
      items: allWorkers.map((w) => ({
        workerId: w.workerId,
        afpDiscount: w.afpDiscount,
        advanceDiscount: w.advanceDiscount,
      })),
    };

    await toast.promise(
      execute(`${weeklyWageApi}week/${weekId}/save`, "POST", payload),
      {
        loading: "Guardando planilla...",
        success: (result) => result.message || "Planilla guardada exitosamente",
        error: (err) => err.message || "Error al guardar la planilla",
      }
    );
  };

  const handleExportExcel = async () => {
    const exportPromise = async () => {
      const token = localStorage.getItem("accessToken");
      
      const response = await fetch(`${weeklyWageApi}week/${weekId}/excel`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al generar el Excel");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Planilla semana ${weekData ? formatToLongMonthDate(weekData.startDate) : 'fecha'} - ${weekData ? formatToLongMonthDate(weekData.endDate) : 'fecha'}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return "Excel descargado exitosamente";
    };

    await toast.promise(exportPromise(), {
      loading: "Generando Excel...",
      success: (msg) => msg,
      error: (err) => err.message || "Error al generar el Excel",
    });
  };

  return (
    <Permission
      user={user}
      allow={adminTypes}
      fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta sección." />}
    >
      <Toaster position="top-center" />
      <Panel>
        <HeaderPanel
          name={
            weekData
              ? `Planilla ${formatToLongMonthDate(weekData.startDate)} - ${formatToLongMonthDate(weekData.endDate)}`
              : weekLoading
              ? "Cargando..."
              : "Semana no encontrada"
          }
        >
          <div className="flex flex-row gap-2 justify-end">
            <ReturnButton onClick={() => navigate("/admin/payrolls")} />
            <Button
              icon={saving ? <AiOutlineLoading className="animate-spin" /> : <FaSave />}
              label={saving ? "Guardando..." : "Guardar"}
              type="button"
              bgColor="#0047a3"
              bgHoverColor="#003366"
              onClick={handleSave}
              disabled={saving || weekLoading}
            />
            <Button
              icon={<FaFileExcel />}
              label="Exportar"
              type="button"
              bgColor="#1d6f42"
              bgHoverColor="#155a34"
              onClick={handleExportExcel}
              disabled={weekLoading}
            />
          </div>
        </HeaderPanel>

        {weekLoading && <LoadingSkeletonTable />}

        {weekError && <ErrorMessage errorMessage={weekError} />}

        {!weekLoading && !weekError && weekData && (
          <>
            <GeneralPayrollSummaryCards summary={summary} />

            <GeneralPayrollTable
              title="OBREROS"
              workers={laborers}
              searchPlaceholder="Buscar obrero por nombre..."
              onAfpChange={(workerId: number, value: number) => handleAfpChange(workerId, value, "laborer")}
              onAdvanceChange={(workerId: number, value: number) => handleAdvanceChange(workerId, value, "laborer")}
            />

            <GeneralPayrollTable
              title="TÉCNICOS"
              workers={technicians}
              searchPlaceholder="Buscar técnico por nombre..."
              onAfpChange={(workerId: number, value: number) => handleAfpChange(workerId, value, "technician")}
              onAdvanceChange={(workerId: number, value: number) => handleAdvanceChange(workerId, value, "technician")}
            />
          </>
        )}
      </Panel>
    </Permission>
  );
}
