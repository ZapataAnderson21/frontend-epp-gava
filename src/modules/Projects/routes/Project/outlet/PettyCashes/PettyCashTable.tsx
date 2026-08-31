import { useEffect, useState } from "react";
import { ErrorMessage } from "../../../../../../common/error";
import { LoadingSkeletonTable } from "../../../../../../common/loading";
import { Table } from "../../../../../../common/table";
import { pettyCashApi } from "../../../../../../data/apiUrl";
import { type PettyCashType } from "../../../../../../data/types";
import { useDebouncedValue, usePaginatedFetch } from "../../../../../../hooks";
import SeeButton from "../../../../../../common/button/SeeButton";

const expenseTypeOptions = [
  { value: "", label: "Todos los tipos" },
  { value: "meals", label: "Comidas" },
  { value: "fuel", label: "Combustible" },
  { value: "transport", label: "Transporte" },
  { value: "supplies", label: "Materiales / Insumos" },
  { value: "safety_equipment", label: "Equipo de Seguridad" },
  { value: "services", label: "Servicios" },
  { value: "other", label: "Otros" },
] as const;

interface ProjectTableProps {
  projectId: number;
  reFetch: number;
  onSee: (pettyCashId: number) => void;
}

export default function PettyCashTable( {projectId, reFetch, onSee} : ProjectTableProps) {
  const [search, setSearch] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const {
    items: pettyCashes,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
  } = usePaginatedFetch<PettyCashType>(
    `${pettyCashApi}project/${projectId}/paginated`,
    {
      params: {
        search: debouncedSearch,
        expenseType: expenseType || undefined,
      },
      enabled: projectId > 0,
    },
  );

  useEffect(() => {
    if (reFetch > 0) refetch();
  }, [reFetch, refetch]);

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

  if (loading && !pagination) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  const processedPettyCashes = pettyCashes.map(pettyCash => ({
    ...pettyCash,
    createdAt: new Date(pettyCash.createdAt).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    })
  }));

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por descripción o número de comprobante"
          aria-label="Buscar movimientos de caja chica"
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold outline-none focus:border-[#0047a3] md:max-w-lg"
        />

        <select
          value={expenseType}
          onChange={(event) => setExpenseType(event.target.value)}
          aria-label="Filtrar por tipo de gasto"
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#0047a3] md:w-56"
        >
          {expenseTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {processedPettyCashes.length ? (
        <Table<PettyCashType>
          data={processedPettyCashes}
          columns={columns}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={loading}
          getRowKey={(row) => row.pettyCashId}
        />
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          {search || expenseType
            ? "No hay movimientos que coincidan con los filtros."
            : "No hay salidas de caja chica."}
        </div>
      )}
    </div>
  );
}
