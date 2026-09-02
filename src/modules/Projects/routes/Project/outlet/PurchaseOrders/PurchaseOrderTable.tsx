import { useFetch, useApiAction } from "../../../../../../hooks";
import { ErrorMessage } from "../../../../../../common/error";
import { LoadingSkeletonTable } from "../../../../../../common/loading";
import { Table } from "../../../../../../common/table";
import { purchaseOrderApi } from "../../../../../../data/apiUrl";
import type { Currency, PurchaseOrder } from "../../../../../../data/types";
import { DeleteButton, EditButton, SeeButton } from "../../../../../../common/button";
import { useNavigate } from "react-router-dom";
import StatusTag, { statusOptions } from "./components/StatusTag";
import toast, { Toaster } from "react-hot-toast";
import { useMemo, useState } from "react";
import { DeleteConfirmDialog, Select } from "../../../../../../components";

const CURRENCIES: Currency[] = ["PEN", "USD", "EUR"];

type TotalsByCurrency = Record<Currency, number>;

type PurchaseOrderRow = Omit<PurchaseOrder, "createdAt"> & {
  createdAt: string;
  supplierName: string;
};

const emptyTotals = (): TotalsByCurrency => ({ PEN: 0, USD: 0, EUR: 0 });

const isCurrency = (value?: string): value is Currency =>
  CURRENCIES.includes(value as Currency);

const formatMoney = (amount: number, currency: Currency) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  })
    .formatToParts(amount)
    .map((part) => (part.type === "group" ? " " : part.value))
    .join("");

function FilteredTotalCard({
  title,
  totals,
  tone,
}: {
  title: string;
  totals: TotalsByCurrency;
  tone: "income" | "expense";
}) {
  const toneClasses =
    tone === "income"
      ? "border-emerald-100 bg-emerald-50/60 text-emerald-800"
      : "border-red-100 bg-red-50/60 text-red-800";

  return (
    <article className={`rounded-xl border p-4 ${toneClasses}`}>
      <p className="mb-3 text-sm font-bold">{title}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {CURRENCIES.map((currency) => (
          <div key={currency} className="rounded-lg bg-white/80 px-3 py-2">
            <span className="block text-2xs font-semibold opacity-70">
              {currency}
            </span>
            <strong className="block text-sm">
              {formatMoney(totals[currency], currency)}
            </strong>
          </div>
        ))}
      </div>
    </article>
  );
}

interface PurchaseOrderTableProps {
  projectId: number;
}

export default function PurchaseOrderTable({ projectId }: PurchaseOrderTableProps) {
  const { data: purchaseOrders, loading, error, setData } = useFetch<PurchaseOrder[]>(`${purchaseOrderApi}project/${projectId}`, [projectId]);
  const { execute } = useApiAction<unknown>();
  const [supplierFilter, setSupplierFilter] = useState<number>(0);
  const [codeQuery, setCodeQuery] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const processedPurchaseOrders = useMemo(
    () =>
      (purchaseOrders ?? []).map((po) => ({
        ...po,
        createdAt: new Date(po.createdAt).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        supplierName: po.supplier ? po.supplier.name : "N/A",
      })),
    [purchaseOrders],
  );

  const supplierOptions = useMemo(() => {
    const seen = new Map<number, string>();
    (purchaseOrders || []).forEach((po) => {
      if (po.supplierId && po.supplier?.name) {
        seen.set(po.supplierId, po.supplier.name);
      }
    });
    return [
      { value: 0, label: "Todos" },
      ...Array.from(seen.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [purchaseOrders]);

  const filteredPurchaseOrders = useMemo(() => {
    const q = codeQuery.trim().toLowerCase();
    return processedPurchaseOrders.filter((po) => {
      const supplierMatch = supplierFilter === 0 || po.supplierId === supplierFilter;
      const codeMatch = !q || String(po.code || "").toLowerCase().includes(q);
      return supplierMatch && codeMatch;
    });
  }, [processedPurchaseOrders, supplierFilter, codeQuery]);

  const filteredTotals = useMemo(() => {
    const income = emptyTotals();
    const expense = emptyTotals();

    filteredPurchaseOrders.forEach((purchaseOrder) => {
      if (purchaseOrder.status === "Cancelada") return;

      const currency = purchaseOrder.supplier?.currency;
      if (!isCurrency(currency)) return;

      income[currency] += Number(purchaseOrder.saleAmount ?? 0);
      expense[currency] += Number(purchaseOrder.purchaseAmount ?? 0);
    });

    return { income, expense };
  }, [filteredPurchaseOrders]);

  const totalsScopeLabel =
    supplierFilter === 0
      ? "todas las órdenes visibles"
      : supplierOptions.find((option) => option.value === supplierFilter)
          ?.label ?? "el proveedor seleccionado";

  const navigate = useNavigate();

  const handleEdit = (purchaseOrderId: number) => {
    navigate(`/admin/projects/${projectId}/purchase-orders/edit/${purchaseOrderId}`);
  };

  const handleSee = (purchaseOrderId: number) => {
    navigate(`/admin/projects/${projectId}/purchase-orders/${purchaseOrderId}`);
  };

  const handleStatusChange = async (purchaseOrderId: number, newStatus: string) => {
    // Guardar estado anterior para poder revertir
    const previousOrders = purchaseOrders ? [...purchaseOrders] : [];
    
    // Obtener el label del nuevo estado para mostrar en la UI
    const newStatusLabel = statusOptions.find(opt => opt.value === newStatus)?.label || newStatus;
    
    // Optimistic update - actualizar localmente de inmediato
    setData((prev) => 
      prev?.map(po => 
        po.purchaseOrderId === purchaseOrderId 
          ? { ...po, status: newStatusLabel }
          : po
      ) ?? null
    );

    try {
      const result = await execute(`${purchaseOrderApi}${purchaseOrderId}`, "PATCH", { status: newStatus });
      
      if (result.statusCode >= 200 && result.statusCode < 300) {
        toast.success('Estado actualizado con éxito');
      } else {
        throw new Error(result.message || 'Error al actualizar');
      }
    } catch (err: unknown) {
      // Revertir al estado anterior si falla
      setData(previousOrders);
      toast.error(
        err instanceof Error ? err.message : "Error al actualizar el estado",
      );
    }
  };

  const handleDelete = async (purchaseOrderId: number) => {
    setPendingDeleteId(purchaseOrderId);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    setDeleting(true);
    const previousOrders = purchaseOrders ? [...purchaseOrders] : [];

    // Optimistic update - quitar localmente de inmediato
    setData((prev) => prev?.filter((po) => po.purchaseOrderId !== pendingDeleteId) ?? null);

    try {
      await execute(`${purchaseOrderApi}${pendingDeleteId}`, "DELETE");
      toast.success("Orden de compra eliminada con éxito");
    } catch (err: unknown) {
      setData(previousOrders);
      toast.error(
        err instanceof Error
          ? err.message
          : "Error al eliminar la orden de compra",
      );
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  };

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!processedPurchaseOrders.length) return <ErrorMessage errorMessage="No hay órdenes de compra disponibles." />;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex flex-col sm:flex-row gap-3 md:items-end md:justify-between mb-4">
        <div className="flex flex-col w-full gap-1">
          <label className="text-xs text-gray-700">Buscar por código</label>
          <input
            type="text"
            value={codeQuery}
            onChange={(e) => setCodeQuery(e.target.value)}
            placeholder="Ej. OC-2024-001"
            className="border border-gray-400 rounded-sm p-2 min-w-[220px] focus:outline-[#0047a3]"
          />
        </div>
        <div className="flex w-full min-w-0 flex-col gap-1 sm:w-72 sm:shrink-0">
          <label className="text-xs text-gray-700">Proveedor</label>
          <Select
            name="supplier-filter"
            value={supplierFilter}
            onChange={(val) => setSupplierFilter(Number(val))}
            options={supplierOptions}
          />
        </div>
      </div>
      <section className="mb-4" aria-live="polite">
        <p className="mb-2 text-sm font-semibold text-gray-700">
          Totales de {totalsScopeLabel}
        </p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <FilteredTotalCard
            title="Total de ingresos"
            totals={filteredTotals.income}
            tone="income"
          />
          <FilteredTotalCard
            title="Total de gastos"
            totals={filteredTotals.expense}
            tone="expense"
          />
        </div>
      </section>
      <Table<PurchaseOrderRow>
        data={filteredPurchaseOrders}
        columns={[
          { key: "code", label: "Código", width: "12rem" },
          { key: "supplierName", label: "Proveedor", width: "12rem" },
          { key: "createdAt", label: "Fecha de Registro", width: "12rem" },
          { 
            label: "Estado",
            width: "8rem",
            render: (row: PurchaseOrderRow) => {
              return (
                <StatusTag 
                  status={row.status} 
                  editable={true}
                  onStatusChange={(newStatus) => handleStatusChange(row.purchaseOrderId, newStatus)}
                />
              );
            }
          },
          { label: "Acciones", width: "8rem", render: (po) => (
              <div className="flex items-center gap-2">
                {po.status === "Pendiente" ? (
                  <EditButton onClick={() => handleEdit(po.purchaseOrderId)} />
                ) : (
                  <SeeButton onClick={() => handleSee(po.purchaseOrderId)} />
                )}
                <DeleteButton onClick={() => handleDelete(po.purchaseOrderId)} />
              </div>
          ) }
        ] as const}
      />
      {!filteredPurchaseOrders.length && (
        <p className="text-center text-gray-500 mt-3">No hay resultados con esos filtros.</p>
      )}

      <DeleteConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Eliminar orden de compra"
        message="Esta acción no se puede deshacer. ¿Desea continuar?"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}
