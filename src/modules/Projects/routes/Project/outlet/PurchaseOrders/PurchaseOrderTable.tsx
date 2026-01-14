  import { useFetch } from "../../../../../../hooks";
import { ErrorMessage } from "../../../../../../common/error";
import { LoadingSkeletonTable } from "../../../../../../common/loading";
import { Table } from "../../../../../../common/table";
import { purchaseOrderApi } from "../../../../../../data/apiUrl";
import type { PurchaseOrder } from "../../../../../../data/types";
import { EditButton, SeeButton } from "../../../../../../common/button";
import { useNavigate } from "react-router-dom";

interface PurchaseOrderTableProps {
  projectId: number;
}

export default function PurchaseOrderTable({ projectId }: PurchaseOrderTableProps) {
  const { data: purchaseOrders, loading, error } = useFetch<PurchaseOrder[]>(`${purchaseOrderApi}project/${projectId}`, [projectId]);

  const processedPurchaseOrders = purchaseOrders?.map((po) => ({
    ...po,
    createdAt: new Date(po.createdAt).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }), 
    supplierName: po.supplier ? po.supplier.name : "N/A",
  })) || [];

  const navigate = useNavigate();

  const handleEdit = (purchaseOrderId: number) => {
    navigate(`/admin/projects/${projectId}/purchase-orders/edit/${purchaseOrderId}`);
  };

  const handleSee = (purchaseOrderId: number) => {
    navigate(`/admin/projects/${projectId}/purchase-orders/${purchaseOrderId}`);
  };

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!processedPurchaseOrders.length) return <ErrorMessage errorMessage="No hay órdenes de compra disponibles." />;

  return (
    <Table<PurchaseOrder>
      data={processedPurchaseOrders as unknown as PurchaseOrder[]}
      columns={[
        { key: "code", label: "Código", width: "12rem" },
        { key: "supplierName", label: "Proveedor", width: "12rem" },
        { key: "createdAt", label: "Fecha de Registro", width: "12rem" },
        { label: "Acciones", width: "8rem", render: (po) => (
            po.status === "Pendiente" ? <EditButton onClick={() => handleEdit(po.purchaseOrderId)} /> : <SeeButton onClick={() => handleSee(po.purchaseOrderId)} />
        ) }
      ] as const}
    />
  );
}
