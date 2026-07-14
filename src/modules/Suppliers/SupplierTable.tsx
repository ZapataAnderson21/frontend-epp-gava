import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EditButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { supplierApi } from "../../data/apiUrl";
import type { Supplier } from "../../data/types";
import { useFetch } from "../../hooks";

export default function SupplierTable() {
  const { data: suppliers, loading, error } = useFetch<Supplier[]>(supplierApi);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredSuppliers = useMemo(() => {
    const query = normalizeText(search);
    if (!query) return suppliers ?? [];

    return (suppliers ?? []).filter((supplier) =>
      normalizeText(
        [
          supplier.name,
          supplier.contactName,
          supplier.phone,
          supplier.email,
          supplier.ruc,
          supplier.dni,
          supplier.bank,
          supplier.accountNumber,
        ].join(" "),
      ).includes(query),
    );
  }, [search, suppliers]);

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

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;

  if (!suppliers || suppliers.length === 0) {
    return <div className="text-center text-gray-500">No hay proveedores disponibles.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por proveedor, contacto, documento, teléfono o correo"
        aria-label="Buscar proveedores"
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold outline-none focus:border-[#0047a3] md:max-w-lg"
      />

      {filteredSuppliers.length ? (
        <Table<Supplier> data={filteredSuppliers} columns={columns} />
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No hay proveedores que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
