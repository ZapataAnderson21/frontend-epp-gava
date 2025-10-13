import { useEffect, useState } from "react";
import { ErrorMessage } from "../../../common/error";
import { LoadingSkeletonTable } from "../../../common/loading";
import { Table } from "../../../common/table";
import { pettyCashApi } from "../../../data/apiUrl";
import { type PettyCashType } from "../../../data/types";
import { useFetch } from "../../../hooks";

interface ProjectTableProps {
  projectId: number;
  reFetch: number;
}

export default function ProjectTable( {projectId, reFetch } : ProjectTableProps) {

  const { data: pettyCashes, loading, error } = useFetch<PettyCashType[]>(`${pettyCashApi}project/${projectId}`, [projectId, reFetch]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [permission, setPermission] = useState(false);

  const columns = [
    { key: "resourceName", label: "Recurso comprado", width: "12rem" },
    { key: "amount", label: "Monto", width: "12rem" },
    { key: "createdAt", label: "Fecha de Registro", width: "12rem" },
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
      getHref={(pettyCash) => permission ? `/admin/projects/${pettyCash.projectId}` : "#"}
    />
  );
}
