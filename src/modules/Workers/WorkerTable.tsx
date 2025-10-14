import { useEffect, useState } from "react";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { workerApi } from "../../data/apiUrl";
import { type Worker } from "../../data/types";
import { useFetch } from "../../hooks";
import SeeButton from "../../common/SeeButton";

interface ProjectTableProps {
  reFetch: number;
  onSee: (workerId: number) => void;
}

export default function WorkerTable( {reFetch, onSee} : ProjectTableProps) {

  const { data: workers, loading, error } = useFetch<Worker[]>(`${workerApi}`, [reFetch]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [permission, setPermission] = useState(false);

  const columns = [
    { key: "fullName", label: "Nombre Completo", width: "18rem" },
    { key: "workerGroupName", label: "Grupo de Trabajadores", width: "12rem" },
    { key: "createdAt", label: "Fecha de Registro", width: "12rem" },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: Worker) => (
        <SeeButton onClick={() => onSee(row.workerId)} />
      ),
    },
  ] as const;

  useEffect(() => {
    if (!user) return;

    if (["GERENTE", "ADMINISTRADORA", "SISTEMAS"].includes(user.userType)) {
      setPermission(true);
    }
  }, [user]);

  if (!user) {
    return <div className="text-red-500">Iniciar sesión.</div>;
  }

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!workers || workers.length === 0) {
    return <div className="text-center text-gray-500">No se encontraron trabajadores.</div>;
  }

  const processedWorkers = workers?.map(worker => ({
    ...worker,
    createdAt: new Date(worker.createdAt).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    }),
    workerGroupName: worker.workerGroup ? worker.workerGroup.parentGroup ? `${worker.workerGroup.parentGroup.name} - ${worker.workerGroup.name}` : worker.workerGroup.name : "Sin grupo"
  }));

  return (
    <Table<Worker>
      data={processedWorkers}
      columns={columns}
    />
  );
}
