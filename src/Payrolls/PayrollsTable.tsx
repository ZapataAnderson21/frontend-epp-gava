import { useNavigate } from "react-router-dom";
import { SeeButton } from "../common/button";
import { Table } from "../common/table";
import type { Project } from "../data/types";

interface WeekTableInterface {
  weekName: string;
  laborersAmount: number;
  techniciansAmount: number;
  totalAmount: number;
}

interface PayrollsTableProps {
  project: Project;
}

export default function PayrollsTable({ project }: PayrollsTableProps) {

  const navigate = useNavigate();

  const columns = [
    { key: "weekName", label: "Semana", width: "12rem" },
    { key: "laborersAmount", label: "Obreros (S/)", width: "12rem" },
    { key: "techniciansAmount", label: "Técnicos (S/)", width: "12rem" },
    { key: "totalAmount", label: "Total (S/)", width: "12rem" },
    {
      label: "Acciones",
      width: "8rem",
      render: () => <SeeButton onClick={() => navigate(`/admin/projects/${project.projectId}`)} />
    }
  ] as const;

  return (
    <Table<WeekTableInterface>
      data={[]}
      columns={columns}
    />
  )
}