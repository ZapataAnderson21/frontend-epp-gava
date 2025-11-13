import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../hooks";
import { ReturnButton, SaveButton } from "../common/button";
import { HeaderPanel, Panel } from "../common/panel";
import { ErrorMessage } from "../common/error";
import { adminTypes, formatToLongMonthDate } from "../utils";
import Permission from "../common/auth/Permission";
import { useEffect, useState } from "react";
import type { WeeklyPayrollData, WorkersPayroll } from "../data/types";
import { SummaryCards } from "./components/SummaryCards";
import { WeeklyPayrollTable } from "./components/WeeklyPayrollTable";

export default function WeeklyPayroll() {
  const { user } = useCurrentUser();
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { week } = (location.state || {}) as { week: WeeklyPayrollData };

  const [laborers, setLaborers] = useState<WorkersPayroll[]>([]);
  const [technicians, setTechnicians] = useState<WorkersPayroll[]>([]);

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

  return (
    <Permission
      user={user}
      allow={adminTypes}
      fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta sección." />}
    >
      <Panel>
        <HeaderPanel
          name={`Planillas ${formatToLongMonthDate(week.startDate)} - ${formatToLongMonthDate(
            week.endDate
          )}`}
        >
          <div className="flex flex-row gap-2 justify-end">
            <ReturnButton onClick={() => navigate(`/admin/projects/${projectId}`)} />
            <SaveButton loading={false} />
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
      </Panel>
    </Permission>
  );
}