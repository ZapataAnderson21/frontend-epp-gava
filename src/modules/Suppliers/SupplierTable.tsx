import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { supplierApi } from "../../data/apiUrl";
import type { Supplier } from "../../data/types";
import { useFetch } from "../../hooks";

export default function SupplierTable() {
  const { data: suppliers, loading, error } = useFetch<Supplier[]>(supplierApi);

  const columns = [
    { key: "name", label: "Nombre", width: "12rem" },
    { key: "ruc", label: "RUC", width: "8rem" },
    { key: "phone", label: "Teléfono", width: "8rem" },
    { key: "email", label: "Email", width: "8rem" },
    { key: "accountNumber", label: "N° Cuenta", width: "12rem" },
    { key: "bank", label: "Banco", width: "8rem" },
    { key: "currency", label: "Moneda", width: "8rem" },
  ] as const;

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!suppliers || suppliers.length === 0) {
    return <div className="text-center text-gray-500">No hay proveedores disponibles.</div>;
  }

  return (
    <Table<Supplier>
      data={suppliers || []}
      columns={columns}
      getHref={(supplier) => `/admin/suppliers/${supplier.supplierId}`}
    />
  );
}