import { useEffect, useState } from "react";
import { ErrorMessage } from "../../../common/error";
import { LoadingSkeletonTable } from "../../../common/loading";
import { Table } from "../../../common/table";
import { serviceSaleApi } from "../../../data/apiUrl";
import { type ServiceSaleType } from "../../../data/types";
import { useFetch } from "../../../hooks";
import SeeButton from "../../../common/button/SeeButton";

interface ProjectTableProps {
  projectId: number;
  reFetch: number;
  onSee: (serviceSaleId: number) => void;
}

export default function ServiceSaleTable( {projectId, reFetch, onSee} : ProjectTableProps) {

  const { data: serviceSales, loading, error } = useFetch<ServiceSaleType[]>(`${serviceSaleApi}project/${projectId}`, [projectId, reFetch]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [permission, setPermission] = useState(false);

  const columns = [
    { key: "serviceName", label: "Servicio contratado", width: "12rem" },
    { key: "amount", label: "Monto", width: "12rem" },
    { key: "createdAt", label: "Fecha de Registro", width: "12rem" },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: ServiceSaleType) => (
        <SeeButton onClick={() => onSee(row.serviceSaleId)} />
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

  if (!serviceSales || serviceSales.length === 0) {
    return <div className="text-center text-gray-500">No hay salidas de caja chica.</div>;
  }

  const processedServiceSales = serviceSales?.map(serviceSale => ({
    ...serviceSale,
    createdAt: new Date(serviceSale.createdAt).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    })
  }));

  return (
    <Table<ServiceSaleType>
      data={processedServiceSales}
      columns={columns}
    />
  );
}
