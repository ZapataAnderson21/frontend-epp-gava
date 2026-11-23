import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { SeeButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { useAccess } from "../../permissions/AccessProvider";
import { Select } from "../../components";
import { clientApi, quotationApi } from "../../data/apiUrl";
import type {
  Client,
  Quotation,
  QuotationStatus,
  QuotationType,
} from "../../data/types";
import { useApiAction, useFetch, usePaginatedFetch } from "../../hooks";
import StatusTag from "./components/StatusTag";
import {
  getQuotationTypeLabel,
  QUOTATION_STATUS_FILTER_OPTIONS,
  QUOTATION_TYPE_FILTER_OPTIONS,
} from "./quotationConfig";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("es-PE");
};

const formatAmount = (value: number) =>
  `S/ ${Number(value || 0).toFixed(2)}`;

export default function QuotationTable() {
  const navigate = useNavigate();
  const { can } = useAccess();
  const { execute } = useApiAction<Quotation>();
  const [clientFilter, setClientFilter] = useState<number>(0);
  const [typeFilter, setTypeFilter] = useState<QuotationType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "all">(
    "all",
  );
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      clientId: clientFilter || undefined,
      type: typeFilter === "all" ? undefined : typeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      search: search.trim() || undefined,
    }),
    [clientFilter, search, statusFilter, typeFilter],
  );

  const {
    items: quotations,
    pagination,
    loading,
    error,
    setPage,
    setPageSize,
    refetch,
  } = usePaginatedFetch<Quotation>(`${quotationApi}paginated`, {
    params: queryParams,
  });
  const {
    data: clients,
    loading: loadingClients,
    error: clientsError,
  } = useFetch<Client[]>(clientApi);

  const clientOptions = useMemo(
    () => [
      { value: 0, label: "Todos los clientes" },
      ...(clients || []).map((client) => ({
        value: client.clientId,
        label: client.name,
      })),
    ],
    [clients],
  );

  const handleStatusChange = async (
    quotationId: number,
    newStatus: QuotationStatus,
  ) => {
    const currentQuotation = quotations.find(
      (quotation) => quotation.quotationId === quotationId,
    );
    if (!currentQuotation || currentQuotation.status === newStatus) return;

    try {
      const result = await execute(`${quotationApi}${quotationId}`, "PATCH", {
        status: newStatus,
      });

      if (result.statusCode < 200 || result.statusCode >= 300) {
        throw new Error(result.message || "Error al actualizar");
      }

      toast.success("Estado actualizado con éxito");
      refetch();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al actualizar el estado",
      );
    }
  };

  const columns = [
    { key: "code", label: "Código", width: "12rem" },
    {
      label: "Cliente",
      width: "14rem",
      render: (row: Quotation) =>
        row.client?.name ?? `Cliente #${row.clientId}`,
    },
    {
      key: "type",
      label: "Tipo",
      width: "10rem",
      render: (row: Quotation) => getQuotationTypeLabel(row.type),
    },
    {
      key: "createdAt",
      label: "Fecha Creación",
      width: "10rem",
      render: (row: Quotation) => formatDate(row.createdAt),
    },
    {
      key: "status",
      label: "Estado",
      width: "10rem",
      render: (row: Quotation) => (
        <StatusTag
          status={row.status}
          editable={can("quotations.manage")}
          onStatusChange={(newStatus) =>
            handleStatusChange(row.quotationId, newStatus)
          }
        />
      ),
    },
    {
      key: "totalAmount",
      permission: "finance.view",
      label: "Total",
      width: "9rem",
      align: "right" as const,
      render: (row: Quotation) => formatAmount(row.totalAmount),
    },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: Quotation) => (
        <SeeButton
          onClick={() => navigate(`/admin/quotations/${row.quotationId}`)}
        />
      ),
    },
  ] as const;

  if ((loading && !pagination) || loadingClients) {
    return <LoadingSkeletonTable />;
  }

  if (
    error &&
    !error.toLowerCase().includes("no se encontraron cotizaciones")
  ) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (clientsError) {
    return <ErrorMessage errorMessage={clientsError} />;
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-700">Buscar</label>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Código, descripción o cliente"
            className="border border-gray-400 rounded-sm p-2 min-w-[220px] focus:outline-[#0047a3]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-700">Tipo</label>
          <Select<QuotationType | "all">
            name="quotation-type-filter"
            value={typeFilter}
            onChange={setTypeFilter}
            options={QUOTATION_TYPE_FILTER_OPTIONS}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-700">Estado</label>
          <Select<QuotationStatus | "all">
            name="quotation-status-filter"
            value={statusFilter}
            onChange={setStatusFilter}
            options={QUOTATION_STATUS_FILTER_OPTIONS}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-700">Cliente</label>
          <Select
            name="client-filter"
            value={clientFilter}
            onChange={(value) => setClientFilter(Number(value))}
            options={clientOptions}
          />
        </div>
      </div>

      {quotations.length ? (
        <Table<Quotation>
          data={quotations}
          columns={columns}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={loading}
          getRowKey={(quotation) => quotation.quotationId}
        />
      ) : (
        <p className="text-center text-gray-500 py-8">
          No hay cotizaciones que coincidan con los filtros seleccionados.
        </p>
      )}
    </>
  );
}
