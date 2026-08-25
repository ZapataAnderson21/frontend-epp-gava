import { useMemo, useState } from "react";
import { ExternalLink as FaExternalLinkAlt, X as FaTimes } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../../../../../../../common/error";
import { Table } from "../../../../../../../common/table";
import { purchaseOrderApi } from "../../../../../../../data/apiUrl";
import type { PurchaseOrderUnitValue } from "../../../../../../../data/types";
import { useFetch } from "../../../../../../../hooks";

interface UnitValuesModalProps {
  isOpen: boolean;
  projectId: number;
  onClose: () => void;
}

const typeLabels: Record<PurchaseOrderUnitValue["purchaseOrderType"], string> = {
  materials: "Materiales",
  services: "Servicios",
};

function formatMoney(value: number, currency?: string | null) {
  const symbol =
    currency?.toUpperCase() === "PEN"
      ? "S/."
      : currency?.toUpperCase() === "EUR"
        ? "\u20ac"
        : "$";

  return `${symbol} ${Number(value || 0).toFixed(4)}`;
}

function formatCurrencyLabel(currency?: string | null) {
  const normalized = currency?.toUpperCase();
  if (normalized === "USD") return "D\u00f3lares";
  if (normalized === "PEN") return "soles";
  if (normalized === "EUR") return "Euros";
  return currency || "-";
}

export default function UnitValuesModal({
  isOpen,
  projectId,
  onClose,
}: UnitValuesModalProps) {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] =
    useState<PurchaseOrderUnitValue["purchaseOrderType"]>("materials");
  const [query, setQuery] = useState("");

  const { data, loading, error } = useFetch<PurchaseOrderUnitValue[]>(
    isOpen && projectId
      ? `${purchaseOrderApi}project/${projectId}/unit-values`
      : "",
    [isOpen, projectId],
  );

  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (data || []).filter((item) => {
      const typeMatches = item.purchaseOrderType === typeFilter;
      const queryMatches =
        !normalizedQuery ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.purchaseOrderCode.toLowerCase().includes(normalizedQuery) ||
        item.supplierName.toLowerCase().includes(normalizedQuery);

      return typeMatches && queryMatches;
    });
  }, [data, query, typeFilter]);

  const totals = useMemo(() => {
    const rows = data || [];
    return {
      materials: rows.filter((item) => item.purchaseOrderType === "materials").length,
      services: rows.filter((item) => item.purchaseOrderType === "services").length,
    };
  }, [data]);

  const handleSeePurchaseOrder = (purchaseOrderId: number) => {
    onClose();
    navigate(`/admin/projects/${projectId}/purchase-orders/${purchaseOrderId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Valores unitarios registrados
            </h2>
            <p className="text-xs text-gray-500">
              Items de ordenes de compra dentro de este proyecto.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["materials", "services"] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={`rounded-md border px-4 py-2 text-xs font-bold transition ${
                  typeFilter === type
                    ? "border-[#14519d] bg-[#14519d] text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setTypeFilter(type)}
              >
                {typeLabels[type]} ({totals[type]})
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col gap-1 md:w-80">
            <label className="text-xs text-gray-700">Buscar</label>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Descripcion, OC o proveedor"
              className="rounded-sm border border-gray-400 p-2 focus:outline-[#0047a3]"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {loading ? (
            <p className="py-8 text-center text-gray-500">
              Cargando valores unitarios...
            </p>
          ) : error ? (
            <ErrorMessage errorMessage={error} />
          ) : filteredData.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No hay valores unitarios para este filtro.
            </p>
          ) : (
            <div className="text-[13px]">
              <Table<PurchaseOrderUnitValue>
                data={filteredData}
                itemsPerPage={8}
                columns={[
                  {
                    label: "Descripcion",
                    width: "34rem",
                    render: (row) => (
                      <span className="block max-w-[42rem] whitespace-normal text-left leading-snug">
                        {row.description}
                      </span>
                    ),
                  },
                  {
                    label: "Proveedor",
                    width: "15rem",
                    render: (row) => (
                      <span className="leading-snug">{row.supplierName}</span>
                    ),
                  },
                  {
                    label: "Moneda",
                    width: "8rem",
                    align: "center",
                    render: (row) => formatCurrencyLabel(row.currency),
                  },
                  {
                    label: "Valor unitario",
                    width: "10rem",
                    align: "right",
                    render: (row) =>
                      formatMoney(row.unitPurchasePrice, row.currency),
                  },
                  {
                    label: "Acciones",
                    width: "10rem",
                    align: "center",
                    render: (row) => (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-black"
                        onClick={() => handleSeePurchaseOrder(row.purchaseOrderId)}
                      >
                        <FaExternalLinkAlt />
                        Ver OC
                      </button>
                    ),
                  },
                ] as const}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
