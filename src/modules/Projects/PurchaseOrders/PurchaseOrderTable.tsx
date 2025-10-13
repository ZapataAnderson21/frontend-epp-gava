  import { useFetch } from "../../../hooks";
import { ErrorMessage } from "../../../common/error";
import { LoadingSkeletonTable } from "../../../common/loading";
import { Table } from "../../../common/table";
import { purchaseOrderApi } from "../../../data/apiUrl";
import type { PurchaseOrderType } from "../../../data/types";

interface PurchaseOrderTableProps {
  projectId: number;
}

export default function PurchaseOrderTable({ projectId }: PurchaseOrderTableProps) {
  const { data: purchaseOrders, loading, error } = useFetch<PurchaseOrderType[]>(`${purchaseOrderApi}project/${projectId}`, [projectId]);

  const processedPurchaseOrders = purchaseOrders?.map((po) => ({
    ...po,
    createdAt: new Date(po.createdAt).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }), 
    supplierName: po.supplier ? po.supplier.name : "N/A",
  })) || [];

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!processedPurchaseOrders.length) return <ErrorMessage errorMessage="No hay órdenes de compra disponibles." />;

  return (
    <Table<PurchaseOrderType>
      data={processedPurchaseOrders as unknown as PurchaseOrderType[]}
      columns={[
        { key: "code", label: "Código", width: "12rem" },
        { key: "supplierName", label: "Proveedor", width: "12rem" },
        { key: "createdAt", label: "Fecha de Registro", width: "12rem" },
      ] as const}
      getHref={(p) => `/admin/purchase-orders/${p.projectId}`}
    />
  );
}
