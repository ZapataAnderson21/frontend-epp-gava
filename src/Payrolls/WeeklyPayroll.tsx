import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../hooks";
import { ReturnButton } from "../common/button";
import { HeaderPanel, Panel } from "../common/panel";
import { ErrorMessage } from "../common/error";
import { adminTypes, formatToLongMonthDate } from "../utils";
import Permission from "../common/auth/Permission";
import { useEffect, useState } from "react";
import type { WeeklyPayrollData, WorkersPayroll } from "../data/types";
import { SummaryCards } from "./components/SummaryCards";
import { WeeklyPayrollTable } from "./components/WeeklyPayrollTable";
import { dailyWageApi } from "../data/apiUrl";
import { useApiAction } from "../hooks";
import { AiOutlineLoading } from "react-icons/ai";
import { Button } from "../components";
import { FaSave } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

export default function WeeklyPayroll() {
  const { user } = useCurrentUser();
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { week } = (location.state || {}) as { week: WeeklyPayrollData };

  const [laborers, setLaborers] = useState<WorkersPayroll[]>([]);
  const [technicians, setTechnicians] = useState<WorkersPayroll[]>([]);

  const { execute, loading } = useApiAction<any>();

  useEffect(() => {
    if (!week) return;
    setLaborers(week.workers.filter(w => w.workerType === "laborer"));
    setTechnicians(week.workers.filter(w => w.workerType === "technician"));
  }, [week]);

  if (!projectId || isNaN(Number(projectId)) || Number(projectId) <= 0) {
    return <ErrorMessage errorMessage="No se encontró el proyecto." />;
  }

  if (!week) {
    return <ErrorMessage errorMessage="No se encontró la información de la semana." />;
  }

  const handleLaborerWageChange = (workerId: number, value: number) => {
    setLaborers(prev =>
      prev.map(w => (w.workerId === workerId ? { ...w, dailyWage: value } : w))
    );
  };

  const handleTechnicianWageChange = (workerId: number, value: number) => {
    setTechnicians(prev =>
      prev.map(w => (w.workerId === workerId ? { ...w, dailyWage: value } : w))
    );
  };

  const handleSave = async () => {
    const allWorkers = [...laborers, ...technicians];

    const payload = {
      items: allWorkers.map(w => ({
        workerId: w.workerId,
        amount: w.dailyWage ?? 0,
      })),
    };

    await toast.promise(
      execute(
        `${dailyWageApi}week/${week.weekId}/bulk-upsert`,
        "POST",
        payload
      ),
      {
        loading: "Guardando planilla...",
        success: (result) => {
          return result.message || "Planilla guardada exitosamente";
        },
        error: (err) => err.message || "Error al guardar la planilla",
      }
    );
  };

  return (
    <Permission
      user={user}
      allow={adminTypes}
      fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta sección." />}
    >
      <Toaster position="top-center" />
      <div className="w-full max-w-full">
        <HeaderPanel
          name={`Planillas ${formatToLongMonthDate(week.startDate)} - ${formatToLongMonthDate(
            week.endDate
          )}`}
        >
          <div className="flex flex-row gap-2 justify-end">
            <ReturnButton onClick={() => { navigate(`/admin/projects/${projectId}/payrolls`) }} />
            <Button
              icon={loading ? <AiOutlineLoading className="animate-spin" /> : <FaSave />}
              label={loading ? "Guardando..." : "Guardar"}
              type="button"
              bgColor="#0047a3" 
              bgHoverColor="#003366"
              onClick={handleSave}
            />
          </div>
        </HeaderPanel>

        <SummaryCards laborers={laborers} technicians={technicians} />

        <WeeklyPayrollTable
          title="OBREROS"
          workers={laborers}
          searchPlaceholder="Buscar obrero por nombre..."
          onWageChange={handleLaborerWageChange}
        />

        <WeeklyPayrollTable
          title="TÉCNICOS"
          workers={technicians}
          searchPlaceholder="Buscar técnico por nombre..."
          onWageChange={handleTechnicianWageChange}
        />
      </div>
    </Permission>
  );
}