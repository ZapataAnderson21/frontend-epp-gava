import { ErrorMessage } from "../../../../../../common/error";
import { LoadingSkeletonTable } from "../../../../../../common/loading";
import { Table } from "../../../../../../common/table";
import { pettyCashApi } from "../../../../../../data/apiUrl";
import { type PettyCashType } from "../../../../../../data/types";
import { useFetch } from "../../../../../../hooks";
import SeeButton from "../../../../../../common/button/SeeButton";

interface ProjectTableProps {
  projectId: number;
  reFetch: number;
  onSee: (pettyCashId: number) => void;
}

export default function PettyCashTable( {projectId, reFetch, onSee} : ProjectTableProps) {

  const { data: pettyCashes, loading, error } = useFetch<PettyCashType[]>(`${pettyCashApi}project/${projectId}`, [projectId, reFetch]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const columns = [
    { key: "expenseDate", label: "Fecha", width: "12rem" },
    { key: "expenseType", label: "Tipo", width: "12rem" },
    { label: "Monto (S/. )", 
      width: "12rem",
      render: (row: PettyCashType) => (<span className="flex max-w-[6rem] justify-end">S/ {Number(row.amount).toFixed(2)}</span>),
    },
    {
      label: "IGV",
      width: "8rem",
      render: (row: PettyCashType) => {
        const includesIgv = row.includesIgv !== false;

        return (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${includesIgv ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {includesIgv ? "Incluido" : "No incluido"}
          </span>
        );
      },
    },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: PettyCashType) => (
        <SeeButton onClick={() => onSee(row.pettyCashId)} />
      ),
    },
  ] as const;

  if (!user) {
    return <div className="text-red-500">Iniciar sesión.</div>;
  }

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!pettyCashes || pettyCashes.length === 0) {
    return <div className="text-center text-gray-500">No hay salidas de caja chica.</div>;
  }

  const processedPettyCashes = pettyCashes?.map(pettyCash => ({
    ...pettyCash,
    createdAt: new Date(pettyCash.createdAt).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    })
  }));

  return (
    <Table<PettyCashType>
      data={processedPettyCashes}
      columns={columns}
    />
  );
}
