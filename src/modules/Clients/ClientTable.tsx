import { useNavigate } from "react-router-dom";
import { EditButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { clientApi } from "../../data/apiUrl";
import type { Client } from "../../data/types";
import { useFetch } from "../../hooks";

export default function ClientTable() {
  const { data: clients, loading, error } = useFetch<Client[]>(clientApi);
  const navigate = useNavigate();

  const columns = [
    { key: "name", label: "Razón Social", width: "16rem" },
    { key: "contactName", label: "Contacto", width: "12rem" },
    { key: "ruc", label: "RUC", width: "10rem" },
    {
      key: "phone",
      label: "Teléfono",
      width: "10rem",
      render: (row: Client) => row.phone ?? "-",
    },
    {
      key: "email",
      label: "Email",
      width: "14rem",
      render: (row: Client) => row.email ?? "-",
    },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: Client) => <EditButton onClick={() => navigate(`/admin/clients/${row.clientId}`)} />,
    },
  ] as const;

  if (loading) return <LoadingSkeletonTable />;

  if (error && !error.toLowerCase().includes("no se encontraron clientes")) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!clients || clients.length === 0) {
    return <div className="text-center text-gray-500 w-full">No hay clientes disponibles.</div>;
  }

  return <Table<Client> data={clients} columns={columns} />;
}
