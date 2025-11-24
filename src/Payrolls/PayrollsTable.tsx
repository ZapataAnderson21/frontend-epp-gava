import { useNavigate } from "react-router-dom";
import { SeeButton } from "../common/button";
import { Table } from "../common/table";
import { weekApi } from "../data/apiUrl";
import { useFetch } from "../hooks";
import { LoadingSkeletonTable } from "../common/loading";
import { ErrorMessage } from "../common/error";
import { formatToLongMonthDate } from "../utils";

interface WorkersPayroll {
  workerId: number;
  workerName: string;
  workerType: string;
  attendaces: number;
  dailyWage: number;
}

interface WeeklyPayrollProps {
  weekId: number;
  startDate: string;
  endDate: string;
  laborerAmount: number;
  technicianAmount: number;
  totalAmount: number;
  workers: WorkersPayroll[];
}

interface PayrollsTableProps {
  projectId: number;
}

export default function PayrollsTable({ projectId }: PayrollsTableProps) {
  const navigate = useNavigate();

  const {data: weekPayrolls, loading, error} = useFetch<WeeklyPayrollProps[]>(`${weekApi}totals/${projectId}`, [projectId]);

  const columns = [
    { label: "Semana", width: "12rem",
      render: (row: WeeklyPayrollProps) => `${formatToLongMonthDate(row.startDate)} - ${formatToLongMonthDate(row.endDate)}`
    },
    { label: "Obreros", 
      width: "12rem",
      render: (week: WeeklyPayrollProps) => `S/ ${Number(week.laborerAmount).toFixed(2)}`
    },
    { label: "Técnicos", 
      width: "12rem",
      render: (week: WeeklyPayrollProps) => `S/ ${Number(week.technicianAmount).toFixed(2)}`
    },
    { label: "Total", 
      width: "12rem",
      render: (week: WeeklyPayrollProps) => `S/ ${Number(week.totalAmount).toFixed(2)}`
    },
    {
      label: "Acciones",
      width: "8rem",
      render: (week: WeeklyPayrollProps) => <SeeButton onClick={() => navigate(`/admin/projects/payrolls/weekly/${projectId}`, { state: { week } })} />
    }
  ] as const;

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  return (
    <Table<WeeklyPayrollProps>
      data={weekPayrolls || []}
      columns={columns}
    />
  )
}