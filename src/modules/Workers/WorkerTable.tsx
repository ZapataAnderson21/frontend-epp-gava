import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { workerApi } from "../../data/apiUrl";
import { type Worker } from "../../data/types";
import { useFetch } from "../../hooks";
import { EditButton, SeeButton } from "../../common/button";

interface ProjectTableProps {
  reFetch: number;
  onSee: (workerId: number) => void;
  isAdmin: boolean;
}

export default function WorkerTable( {reFetch, onSee, isAdmin} : ProjectTableProps) {

  const { data: workers, loading, error } = useFetch<Worker[]>(`${workerApi}`, [reFetch]);

  const columns = [
    { key: "fullName", label: "Nombre Completo", width: "18rem" },
    { key: "phone", label: "Teléfono", width: "14rem" },
    { key: "personalEmail", label: "Correo Electrónico", width: "18rem" },
    { key: "workerType", label: "Tipo", width: "14rem" },
    ...(isAdmin ? [
      {
        label: "Acciones",
        width: "8rem",
        render: (row: Worker) => (
          <EditButton onClick={() => onSee(row.workerId)} />
        )
      }] : [
      {
        label: "Acciones",
        width: "8rem",
        render: (row: Worker) => (
          <SeeButton onClick={() => onSee(row.workerId)} />
        )
      }])
  ] as const;

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!workers || workers.length === 0) {
    return <div className="text-center text-gray-500">No se encontraron trabajadores.</div>;
  }

  return (
    <Table<Worker>
      data={workers}
      columns={columns}
    />
  );
}
