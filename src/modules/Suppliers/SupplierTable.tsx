import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EditButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { supplierApi } from "../../data/apiUrl";
import type { Supplier } from "../../data/types";
import { useDebouncedValue, usePaginatedFetch } from "../../hooks";

export default function SupplierTable() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const {
    items: suppliers,
    pagination,
    loading,
    error,
    setPage,
    setPageSize,
  } = usePaginatedFetch<Supplier>(`${supplierApi}paginated`, {
    params: { search: debouncedSearch },
  });
  const navigate = useNavigate();

  const columns = [
    { key: "name", label: "Nombre", width: "12rem" },
    { key: "phone", label: "Teléfono", width: "8rem" },
    { key: "email", label: "Email", width: "8rem" },
    { key: "accountNumber", label: "N° Cuenta", width: "12rem" },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: Supplier) => (
        <EditButton onClick={() => navigate(`/admin/suppliers/${row.supplierId}`)} />
      ),
    },
  ] as const;

  if (loading && !pagination) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;

  if (!suppliers.length && !search) {
    return <div className="text-center text-gray-500">No hay proveedores disponibles.</div>;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por proveedor, contacto, documento, teléfono o correo"
        aria-label="Buscar proveedores"
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold outline-none focus:border-[#0047a3] md:max-w-lg"
      />

      {suppliers.length ? (
        <Table<Supplier>
          data={suppliers}
          columns={columns}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={loading}
          getRowKey={(row) => row.supplierId}
        />
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No hay proveedores que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
}
