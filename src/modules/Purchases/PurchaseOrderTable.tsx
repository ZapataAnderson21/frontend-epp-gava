import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { EditButton, SeeButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { Select } from "../../components";
import ActionButton from "../../components/ActionButton";
import { purchaseOrderApi } from "../../data/apiUrl";
import type {
  Project,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderType,
  Supplier,
} from "../../data/types";
import { useDebouncedValue, usePaginatedFetch } from "../../hooks";
import { useAccess } from "../../permissions/AccessProvider";
import {
  PURCHASE_ORDER_STATUS_FILTER_OPTIONS,
  PURCHASE_ORDER_TYPE_FILTER_OPTIONS,
  PURCHASE_ORDER_TYPE_LABELS,
} from "./purchaseOrderConfig";

interface PurchaseOrderTableProps {
  projects: Project[];
  suppliers: Supplier[];
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-PE");

export default function PurchaseOrderTable({
  projects,
  suppliers,
}: PurchaseOrderTableProps) {
  const navigate = useNavigate();
  const { can } = useAccess();
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState(0);
  const [supplierId, setSupplierId] = useState(0);
  const [purchaseOrderType, setPurchaseOrderType] = useState<
    PurchaseOrderType | ""
  >("");
  const [status, setStatus] = useState<PurchaseOrderStatus | "">("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const params = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      projectId: projectId || undefined,
      supplierId: supplierId || undefined,
      purchaseOrderType: purchaseOrderType || undefined,
      status: status || undefined,
    }),
    [debouncedSearch, projectId, purchaseOrderType, status, supplierId],
  );

  const {
    items: purchaseOrders,
    pagination,
    loading,
    error,
    setPage,
    setPageSize,
  } = usePaginatedFetch<PurchaseOrder>(`${purchaseOrderApi}paginated`, {
    params,
  });

  const projectOptions = useMemo(
    () => [
      { value: 0, label: "Todos los proyectos" },
      ...projects.map((project) => ({
        value: project.projectId,
        label: project.name,
      })),
    ],
    [projects],
  );
  const supplierOptions = useMemo(
    () => [
      { value: 0, label: "Todos los proveedores" },
      ...suppliers.map((supplier) => ({
        value: supplier.supplierId,
        label: supplier.name,
      })),
    ],
    [suppliers],
  );

  const clearFilters = () => {
    setSearch("");
    setProjectId(0);
    setSupplierId(0);
    setPurchaseOrderType("");
    setStatus("");
  };

  const downloadPdf = async (purchaseOrder: PurchaseOrder) => {
    try {
      const response = await fetch(
        `${purchaseOrderApi}pdf/${purchaseOrder.purchaseOrderId}`,
        { credentials: "include" },
      );
      if (!response.ok) throw new Error("No se pudo generar el PDF");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `OC-${purchaseOrder.codeComplete ?? purchaseOrder.code}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (caught: unknown) {
      toast.error(
        caught instanceof Error ? caught.message : "No se pudo descargar el PDF",
      );
    }
  };

  const columns = [
    {
      key: "code" as const,
      label: "Código",
      render: (order: PurchaseOrder) => order.codeComplete ?? order.code,
    },
    {
      label: "Proyecto",
      render: (order: PurchaseOrder) => order.project?.name ?? "—",
    },
    {
      label: "Proveedor",
      render: (order: PurchaseOrder) => order.supplier?.name ?? "—",
    },
    {
      key: "purchaseOrderType" as const,
      label: "Tipo",
      render: (order: PurchaseOrder) =>
        PURCHASE_ORDER_TYPE_LABELS[order.purchaseOrderType],
    },
    { key: "status" as const, label: "Estado" },
    {
      key: "createdAt" as const,
      label: "Fecha de creación",
      render: (order: PurchaseOrder) => formatDate(order.createdAt),
    },
    {
      label: "Acciones",
      render: (order: PurchaseOrder) => (
        <div className="flex items-center gap-2">
          <SeeButton
            onClick={() =>
              navigate(
                `/admin/projects/${order.projectId}/purchase-orders/${order.purchaseOrderId}`,
              )
            }
          />
          {can("orders.manage") && (
            <EditButton
              onClick={() =>
                navigate(
                  `/admin/projects/${order.projectId}/purchase-orders/edit/${order.purchaseOrderId}`,
                )
              }
            />
          )}
          {can("orders.export") && (
            <ActionButton
              icon={<Download />}
              label={`Descargar PDF de ${order.codeComplete ?? order.code}`}
              variant="ghost"
              onClick={() => downloadPdf(order)}
            />
          )}
        </div>
      ),
    },
  ] as const;

  if (loading && !pagination) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs text-gray-700">
          Buscar
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Código, proveedor o proyecto"
            className="rounded-sm border border-gray-400 p-2 focus:outline-[#0047a3]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-700">
          Proyecto
          <Select
            name="purchase-order-project-filter"
            value={projectId}
            onChange={(value) => setProjectId(Number(value))}
            options={projectOptions}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-700">
          Proveedor
          <Select
            name="purchase-order-supplier-filter"
            value={supplierId}
            onChange={(value) => setSupplierId(Number(value))}
            options={supplierOptions}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-700">
          Tipo
          <Select<PurchaseOrderType | "">
            name="purchase-order-type-filter"
            value={purchaseOrderType}
            onChange={setPurchaseOrderType}
            options={PURCHASE_ORDER_TYPE_FILTER_OPTIONS}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-700">
          Estado
          <Select<PurchaseOrderStatus | "">
            name="purchase-order-status-filter"
            value={status}
            onChange={setStatus}
            options={PURCHASE_ORDER_STATUS_FILTER_OPTIONS}
          />
        </label>
      </div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047a3]"
        >
          Limpiar filtros
        </button>
      </div>

      {purchaseOrders.length ? (
        <Table<PurchaseOrder>
          data={purchaseOrders}
          columns={columns}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={loading}
          getRowKey={(order) => order.purchaseOrderId}
        />
      ) : (
        <p className="py-10 text-center text-gray-500">
          No hay órdenes de compra que coincidan con los filtros.
        </p>
      )}
    </>
  );
}
