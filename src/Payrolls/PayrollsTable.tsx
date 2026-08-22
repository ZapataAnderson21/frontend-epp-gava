import { DeleteButton, EditButton } from "../common/button";
import { Table } from "../common/table";
import { formatDate, formatDateTime } from "../utils";

export interface PayrollWeek {
  weekId: number;
  startDate: string;
  endDate: string;
}

export interface ProjectWeeklyPayroll {
  projectWeeklyPayrollId: number;
  projectId: number;
  weekId: number;
  amount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  week: PayrollWeek;
}

interface PayrollsTableProps {
  payrolls: ProjectWeeklyPayroll[];
  disabled?: boolean;
  onEdit: (payroll: ProjectWeeklyPayroll) => void;
  onDelete: (payroll: ProjectWeeklyPayroll) => void;
}

export default function PayrollsTable({
  payrolls,
  disabled,
  onEdit,
  onDelete,
}: PayrollsTableProps) {
  const columns = [
    {
      label: "Semana",
      width: "18rem",
      render: (payroll: ProjectWeeklyPayroll) =>
        `${formatDate(payroll.week.startDate)} - ${formatDate(payroll.week.endDate)}`,
    },
    {
      label: "Monto",
      width: "10rem",
      align: "right" as const,
      render: (payroll: ProjectWeeklyPayroll) =>
        `S/ ${Number(payroll.amount).toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      label: "Observación",
      width: "22rem",
      render: (payroll: ProjectWeeklyPayroll) => payroll.notes || "—",
    },
    {
      label: "Última actualización",
      width: "12rem",
      render: (payroll: ProjectWeeklyPayroll) =>
        formatDateTime(payroll.updatedAt),
    },
    {
      label: "Acciones",
      width: "8rem",
      align: "center" as const,
      render: (payroll: ProjectWeeklyPayroll) => (
        <div className="flex justify-center gap-2">
          <EditButton onClick={() => onEdit(payroll)} disabled={disabled} />
          <DeleteButton onClick={() => onDelete(payroll)} disabled={disabled} />
        </div>
      ),
    },
  ] as const;

  return <Table data={payrolls} columns={columns} />;
}
