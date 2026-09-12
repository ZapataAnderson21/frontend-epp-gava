import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  DeleteButton,
  EditButton,
  SeeButton,
} from "../../../../../../common/button";
import { ErrorMessage } from "../../../../../../common/error";
import { LoadingSkeletonTable } from "../../../../../../common/loading";
import { Table } from "../../../../../../common/table";
import {
  Button,
  DeleteConfirmDialog,
  Select,
} from "../../../../../../components";
import { purchaseOrderApi } from "../../../../../../data/apiUrl";
import type {
  Currency,
  PurchaseOrder,
  PurchaseOrderDashboardStatus,
} from "../../../../../../data/types";
import { useApiAction, useFetch } from "../../../../../../hooks";
import { useAccess } from "../../../../../../permissions/AccessProvider";
import StatusTag, { statusOptions } from "./components/StatusTag";

const CURRENCIES: Currency[] = ["PEN", "USD", "EUR"];
const PURCHASE_ORDER_TYPES = [
  { value: "", label: "Todos" },
  { value: "materials", label: "Materiales" },
  { value: "services", label: "Servicios" },
] as const;
const CURRENCY_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dólares (USD)" },
  { value: "EUR", label: "Euros (EUR)" },
] as const;
const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "authorized", label: "Autorizada" },
  { value: "delivered", label: "Entregada" },
  { value: "cancelled", label: "Cancelada" },
] as const;

type PurchaseOrderTypeFilter = "" | "materials" | "services";
type CurrencyFilter = "" | Currency;
type StatusFilter = "" | PurchaseOrderDashboardStatus;
type TotalsByCurrency = Record<Currency, number>;
type PurchaseOrderRow = PurchaseOrder & { supplierName: string };

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

function FinancialTotalCard({
  title,
  totals,
  tone,
}: {
  title: string;
  totals: TotalsByCurrency;
  tone: "income" | "expense" | "utility";
}) {
  const { can } = useAccess();
  if (!can("finance.view")) return null;
  const toneClasses = {
    income: "border-emerald-100 bg-emerald-50/60 text-emerald-800",
    expense: "border-red-100 bg-red-50/60 text-red-800",
    utility: "border-blue-100 bg-blue-50/60 text-blue-800",
  }[tone];

  return (
    <article className={`rounded-xl border p-4 ${toneClasses}`}>
      <p className="mb-3 text-sm font-bold">{title}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
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

export default function PurchaseOrderTable({
  projectId,
}: PurchaseOrderTableProps) {
  const {
    data: purchaseOrders,
    loading,
    error,
    setData,
  } = useFetch<PurchaseOrder[]>(`${purchaseOrderApi}project/${projectId}`, [
    projectId,
  ]);
  const { execute } = useApiAction<unknown>();
  const { can } = useAccess();
  const [supplierFilter, setSupplierFilter] = useState<number>(0);
  const [typeFilter, setTypeFilter] = useState<PurchaseOrderTypeFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("");
  const [codeQuery, setCodeQuery] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const processedPurchaseOrders = useMemo<PurchaseOrderRow[]>(
    () =>
      (purchaseOrders ?? []).map((purchaseOrder) => ({
        ...purchaseOrder,
        supplierName: purchaseOrder.supplier?.name ?? "N/A",
      })),
    [purchaseOrders],
  );

  const supplierOptions = useMemo(() => {
    const seen = new Map<number, string>();
    (purchaseOrders || []).forEach((purchaseOrder) => {
      if (purchaseOrder.supplierId && purchaseOrder.supplier?.name) {
        seen.set(purchaseOrder.supplierId, purchaseOrder.supplier.name);
      }
    });
    return [
      { value: 0, label: "Todos" },
      ...Array.from(seen.entries())
        .sort((first, second) => first[1].localeCompare(second[1], "es"))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [purchaseOrders]);

  const filteredPurchaseOrders = useMemo(() => {
    const query = codeQuery.trim().toLocaleLowerCase();
    return processedPurchaseOrders.filter((purchaseOrder) => {
      const currency = purchaseOrder.supplier?.currency;
      return (
        (supplierFilter === 0 ||
          purchaseOrder.supplierId === supplierFilter) &&
        (!typeFilter || purchaseOrder.purchaseOrderType === typeFilter) &&
        (!statusFilter || purchaseOrder.statusCode === statusFilter) &&
        (!currencyFilter || currency === currencyFilter) &&
        (!query || purchaseOrder.code.toLocaleLowerCase().includes(query))
      );
    });
  }, [
    processedPurchaseOrders,
    supplierFilter,
    typeFilter,
    statusFilter,
    currencyFilter,
    codeQuery,
  ]);

  const filteredTotals = useMemo(() => {
    const income = emptyTotals();
    const expense = emptyTotals();
    const utility = emptyTotals();
    let activeOrders = 0;

    filteredPurchaseOrders.forEach((purchaseOrder) => {
      if (
        purchaseOrder.statusCode === "cancelled" ||
        purchaseOrder.status === "Cancelada"
      )
        return;
      const currency = purchaseOrder.supplier?.currency;
      if (!isCurrency(currency)) return;

      const purchaseAmount = Number(purchaseOrder.purchaseAmount ?? 0);
      const saleAmount = Number(purchaseOrder.saleAmount ?? 0);
      activeOrders += 1;
      income[currency] += saleAmount;
      expense[currency] += purchaseAmount;
      utility[currency] += saleAmount - purchaseAmount;
    });

    return { income, expense, utility, activeOrders };
  }, [filteredPurchaseOrders]);

  const navigate = useNavigate();

  const handleEdit = (purchaseOrderId: number) => {
    navigate(
      `/admin/projects/${projectId}/purchase-orders/edit/${purchaseOrderId}`,
    );
  };

  const handleSee = (purchaseOrderId: number) => {
    navigate(`/admin/projects/${projectId}/purchase-orders/${purchaseOrderId}`);
  };

  const handleStatusChange = async (
    purchaseOrderId: number,
    newStatus: string,
  ) => {
    const previousOrders = purchaseOrders ? [...purchaseOrders] : [];
    const newStatusLabel =
      statusOptions.find((option) => option.value === newStatus)?.label ||
      newStatus;

    setData(
      (previous) =>
        previous?.map((purchaseOrder) =>
          purchaseOrder.purchaseOrderId === purchaseOrderId
            ? {
                ...purchaseOrder,
                status: newStatusLabel,
                statusCode: newStatus as PurchaseOrderDashboardStatus,
              }
            : purchaseOrder,
        ) ?? null,
    );

    try {
      const result = await execute(
        `${purchaseOrderApi}${purchaseOrderId}`,
        "PATCH",
        { status: newStatus },
      );

      if (result.statusCode >= 200 && result.statusCode < 300) {
        toast.success("Estado actualizado con éxito");
      } else {
        throw new Error(result.message || "Error al actualizar");
      }
    } catch (err: unknown) {
      setData(previousOrders);
      toast.error(
        err instanceof Error ? err.message : "Error al actualizar el estado",
      );
    }
  };

  const handleDelete = (purchaseOrderId: number) => {
    setPendingDeleteId(purchaseOrderId);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    setDeleting(true);
    const previousOrders = purchaseOrders ? [...purchaseOrders] : [];
    setData(
      (previous) =>
        previous?.filter(
          (purchaseOrder) =>
            purchaseOrder.purchaseOrderId !== pendingDeleteId,
        ) ?? null,
    );

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

  const handleExportPdf = async () => {
    const params = new URLSearchParams();
    const search = codeQuery.trim();
    if (search) params.set("search", search);
    if (supplierFilter) params.set("supplierId", String(supplierFilter));
    if (typeFilter) params.set("purchaseOrderType", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (currencyFilter) params.set("currency", currencyFilter);

    setExporting(true);
    try {
      const query = params.toString();
      const response = await fetch(
        `${purchaseOrderApi}project/${projectId}/summary/pdf${query ? `?${query}` : ""}`,
        { credentials: "include" },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message || "No se pudo generar el resumen.");
      }

      const disposition = response.headers.get("Content-Disposition") ?? "";
      const fileName =
        disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
        `resumen-ordenes-proyecto-${projectId}.pdf`;
      const objectUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Resumen PDF generado correctamente");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo exportar el PDF.",
      );
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!processedPurchaseOrders.length)
    return (
      <ErrorMessage errorMessage="No hay órdenes de compra disponibles." />
    );

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_170px_170px_170px_auto] xl:items-end">
        <div className="flex min-w-0 flex-col gap-1">
          <label className="text-xs text-gray-700">Buscar por código</label>
          <input
            type="text"
            value={codeQuery}
            onChange={(event) => setCodeQuery(event.target.value)}
            placeholder="Ej. OC-2024-001"
            className="min-w-0 rounded-lg border border-gray-400 p-2 focus:outline-[#0047a3]"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label className="text-xs text-gray-700">Proveedor</label>
          <Select
            name="supplier-filter"
            value={supplierFilter}
            onChange={(value) => setSupplierFilter(Number(value))}
            options={supplierOptions}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label className="text-xs text-gray-700">Tipo</label>
          <Select<PurchaseOrderTypeFilter>
            name="purchase-order-type-filter"
            value={typeFilter}
            onChange={setTypeFilter}
            options={PURCHASE_ORDER_TYPES}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label className="text-xs text-gray-700">Estado</label>
          <Select<StatusFilter>
            name="purchase-order-status-filter"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label className="text-xs text-gray-700">Moneda</label>
          <Select<CurrencyFilter>
            name="purchase-order-currency-filter"
            value={currencyFilter}
            onChange={setCurrencyFilter}
            options={CURRENCY_OPTIONS}
          />
        </div>
        {can("finance.view") && (
          <Button
            permission="orders.export"
            icon={<Download />}
            label={exporting ? "Generando..." : "Exportar PDF"}
            bgColor="#14519d"
            bgHoverColor="#0f3f7a"
            type="button"
            disabled={exporting}
            onClick={handleExportPdf}
          />
        )}
      </div>

      <section className="mb-4" aria-live="polite">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-700">
            Resumen de las órdenes visibles
          </p>
          <p className="text-xs text-gray-500">
            Las órdenes canceladas no se suman en los importes.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_repeat(3,minmax(0,1fr))]">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
            <p className="text-sm font-bold">Cantidad de órdenes</p>
            <strong className="mt-3 block text-3xl text-[#14519d]">
              {filteredPurchaseOrders.length}
            </strong>
            <span className="text-xs text-gray-500">
              {filteredTotals.activeOrders} consideradas en los totales
            </span>
          </article>
          <FinancialTotalCard
            title="Total de gastos"
            totals={filteredTotals.expense}
            tone="expense"
          />
          <FinancialTotalCard
            title="Total de ingresos"
            totals={filteredTotals.income}
            tone="income"
          />
          <FinancialTotalCard
            title="Utilidades"
            totals={filteredTotals.utility}
            tone="utility"
          />
        </div>
      </section>

      <Table<PurchaseOrderRow>
        data={filteredPurchaseOrders}
        getRowKey={(purchaseOrder) => purchaseOrder.purchaseOrderId}
        columns={[
          { key: "code", label: "Código OC", width: "13rem" },
          { key: "supplierName", label: "Proveedor", width: "14rem" },
          {
            label: "Tipo",
            width: "7rem",
            render: (purchaseOrder) =>
              purchaseOrder.purchaseOrderType === "services"
                ? "Servicios"
                : "Materiales",
          },
          {
            label: "Moneda",
            width: "6rem",
            align: "center",
            render: (purchaseOrder) => purchaseOrder.supplier?.currency ?? "-",
          },
          {
            label: "Gasto",
            width: "9rem",
            align: "right",
            permission: "finance.view",
            render: (purchaseOrder) => {
              const currency = purchaseOrder.supplier?.currency;
              return isCurrency(currency)
                ? formatMoney(Number(purchaseOrder.purchaseAmount), currency)
                : "-";
            },
          },
          {
            label: "Ingreso",
            width: "9rem",
            align: "right",
            permission: "finance.view",
            render: (purchaseOrder) => {
              const currency = purchaseOrder.supplier?.currency;
              return isCurrency(currency)
                ? formatMoney(Number(purchaseOrder.saleAmount), currency)
                : "-";
            },
          },
          {
            label: "Utilidad",
            width: "9rem",
            align: "right",
            permission: "finance.view",
            render: (purchaseOrder) => {
              const currency = purchaseOrder.supplier?.currency;
              const utility =
                Number(purchaseOrder.saleAmount) -
                Number(purchaseOrder.purchaseAmount);
              return (
                <strong
                  className={utility < 0 ? "text-red-700" : "text-emerald-700"}
                >
                  {isCurrency(currency) ? formatMoney(utility, currency) : "-"}
                </strong>
              );
            },
          },
          {
            label: "Estado",
            width: "8rem",
            render: (purchaseOrder) => (
              <StatusTag
                status={purchaseOrder.status}
                editable={true}
                onStatusChange={(newStatus) =>
                  handleStatusChange(
                    purchaseOrder.purchaseOrderId,
                    newStatus,
                  )
                }
              />
            ),
          },
          {
            label: "Acciones",
            width: "8rem",
            render: (purchaseOrder) => (
              <div className="flex items-center gap-2">
                {purchaseOrder.status === "Pendiente" ? (
                  <EditButton
                    onClick={() => handleEdit(purchaseOrder.purchaseOrderId)}
                  />
                ) : (
                  <SeeButton
                    onClick={() => handleSee(purchaseOrder.purchaseOrderId)}
                  />
                )}
                <DeleteButton
                  onClick={() => handleDelete(purchaseOrder.purchaseOrderId)}
                />
              </div>
            ),
          },
        ]}
      />
      {!filteredPurchaseOrders.length && (
        <p className="mt-3 text-center text-gray-500">
          No hay resultados con esos filtros.
        </p>
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
