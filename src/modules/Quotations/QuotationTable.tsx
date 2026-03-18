import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { SeeButton } from "../../common/button";
import { Table } from "../../common/table";
import { Select } from "../../components";
import { clientApi, quotationApi } from "../../data/apiUrl";
import type { Client, Quotation, QuotationStatus } from "../../data/types";
import { useApiAction, useFetch } from "../../hooks";
import StatusTag from "./components/StatusTag";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("es-PE");
};

const formatAmount = (value: number) => `S/ ${Number(value || 0).toFixed(2)}`;

export default function QuotationTable() {
  const { data: quotations, loading, error, setData } = useFetch<Quotation[]>(quotationApi);
  const { data: clients, loading: loadingClients, error: clientsError } = useFetch<Client[]>(clientApi);
  const { execute } = useApiAction<Quotation>();
  const navigate = useNavigate();
  const [clientFilter, setClientFilter] = useState<number>(0);
  const [codeQuery, setCodeQuery] = useState("");

  const clientOptions = useMemo(() => {
    return [
      { value: 0, label: "Todos" },
      ...((clients || []).map((client) => ({ value: client.clientId, label: client.name }))),
    ];
  }, [clients]);

  const filteredQuotations = useMemo(() => {
    const q = codeQuery.trim().toLowerCase();
    return (quotations || []).filter((quotation) => {
      const clientMatch = clientFilter === 0 || quotation.clientId === clientFilter;
      const codeMatch = !q || String(quotation.code || "").toLowerCase().includes(q);
      return clientMatch && codeMatch;
    });
  }, [quotations, clientFilter, codeQuery]);

  const handleStatusChange = async (quotationId: number, newStatus: QuotationStatus) => {
    if (!quotations) return;

    const previousQuotations = [...quotations];
    const currentQuotation = quotations.find((quotation) => quotation.quotationId === quotationId);
    if (!currentQuotation || currentQuotation.status === newStatus) return;

    setData((prev) =>
      prev?.map((quotation) =>
        quotation.quotationId === quotationId ? { ...quotation, status: newStatus } : quotation
      ) ?? null
    );

    try {
      const result = await execute(`${quotationApi}${quotationId}`, "PATCH", { status: newStatus });

      if (result.statusCode >= 200 && result.statusCode < 300) {
        toast.success("Estado actualizado con éxito");
      } else {
        throw new Error(result.message || "Error al actualizar");
      }
    } catch (err: any) {
      setData(previousQuotations);
      toast.error(err.message || "Error al actualizar el estado");
    }
  };

  const columns = [
    { key: "code", label: "Código", width: "15rem" },
    {
      label: "Cliente",
      width: "14rem",
      render: (row: Quotation) => row.client?.name ?? `Cliente #${row.clientId}`,
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
          editable={true}
          onStatusChange={(newStatus) => handleStatusChange(row.quotationId, newStatus)}
        />
      ),
    },
    {
      key: "totalAmount",
      label: "Total",
      width: "9rem",
      align: "right" as const,
      render: (row: Quotation) => formatAmount(row.totalAmount),
    },
    {
      label: "Acciones",
      width: "8rem",
      render: (row: Quotation) => (
        <SeeButton onClick={() => navigate(`/admin/quotations/${row.quotationId}`)} />
      ),
    },
  ] as const;

  if (loading || loadingClients) {
    return <LoadingSkeletonTable />;
  }

  if (error && !error.toLowerCase().includes("no se encontraron cotizaciones")) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (clientsError) {
    return <ErrorMessage errorMessage={clientsError} />;
  }

  if (!quotations || quotations.length === 0) {
    return <div className="text-center text-gray-500 w-full">No hay cotizaciones disponibles.</div>;
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex flex-col sm:flex-row gap-3 md:items-end md:justify-between mb-4">
        <div className="flex flex-col w-full gap-1">
          <label className="text-sm text-gray-700">Buscar por código</label>
          <input
            type="text"
            value={codeQuery}
            onChange={(e) => setCodeQuery(e.target.value)}
            placeholder="Ej. COT-2024-001"
            className="border border-gray-400 rounded-sm p-2 min-w-[220px] focus:outline-[#0047a3]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700">Cliente</label>
          <Select
            name="client-filter"
            value={clientFilter}
            onChange={(val) => setClientFilter(Number(val))}
            options={clientOptions}
          />
        </div>
      </div>

      <Table<Quotation> data={filteredQuotations} columns={columns} />

      {!filteredQuotations.length && (
        <p className="text-center text-gray-500 mt-3">No hay resultados con esos filtros.</p>
      )}
    </>
  );
}
