import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EditButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { clientApi } from "../../data/apiUrl";
import type { Client } from "../../data/types";
import { useDebouncedValue, usePaginatedFetch } from "../../hooks";

export default function ClientTable() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const {
    items: clients,
    pagination,
    loading,
    error,
    setPage,
    setPageSize,
  } = usePaginatedFetch<Client>(`${clientApi}paginated`, {
    params: { search: debouncedSearch },
  });
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

  if (loading && !pagination) return <LoadingSkeletonTable />;

  if (error && !error.toLowerCase().includes("no se encontraron clientes")) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!clients.length && !search) {
    return <div className="text-center text-gray-500 w-full">No hay clientes disponibles.</div>;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por razón social, contacto, RUC, teléfono o correo"
        aria-label="Buscar clientes"
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold outline-none focus:border-[#0047a3] md:max-w-lg"
      />
      {clients.length ? (
        <Table<Client>
          data={clients}
          columns={columns}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={loading}
          getRowKey={(row) => row.clientId}
        />
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No hay clientes que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
}
