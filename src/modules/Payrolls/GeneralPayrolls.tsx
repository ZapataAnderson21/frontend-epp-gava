import { useNavigate } from "react-router-dom";
import { useCurrentUser, useFetch } from "../../hooks";
import { HeaderPanel, Panel } from "../../common/panel";
import { ErrorMessage } from "../../common/error";
import { adminTypes } from "../../utils";
import Permission from "../../common/auth/Permission";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { SeeButton } from "../../common/button";
import { weeklyWageApi } from "../../data/apiUrl";
import { formatToLongMonthDate } from "../../utils";
import type { WeekSummary } from "./types";

export default function GeneralPayrolls() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const { data: weeks, loading, error } = useFetch<WeekSummary[]>(`${weeklyWageApi}weeks`, []);

  const columns = [
    {
      label: "Semana",
      width: "20rem",
      render: (row: WeekSummary) =>
        `${formatToLongMonthDate(row.startDate)} - ${formatToLongMonthDate(row.endDate)}`,
    },
    {
      label: "N° Trabajadores",
      width: "10rem",
      align: "center" as const,
      render: (row: WeekSummary) => row.totalWorkers,
    },
    {
      label: "Total Asistencias",
      width: "10rem",
      align: "center" as const,
      render: (row: WeekSummary) => row.totalAttendances,
    },
    {
      label: "Acciones",
      width: "8rem",
      align: "center" as const,
      render: (week: WeekSummary) => (
        <SeeButton onClick={() => navigate(`/admin/payrolls/${week.weekId}`)} />
      ),
    },
  ] as const;

  return (
    <Permission
      user={user}
      allow={adminTypes}
      fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta sección." />}
    >
      <Panel>
        <HeaderPanel name="Planillas" />

        {loading && <LoadingSkeletonTable />}

        {error && <ErrorMessage errorMessage={error} />}

        {!loading && !error && (
          <Table<WeekSummary>
            data={weeks || []}
            columns={columns}
          />
        )}
      </Panel>
    </Permission>
  );
}
