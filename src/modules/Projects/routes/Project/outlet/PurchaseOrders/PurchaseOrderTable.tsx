  import { useFetch, useApiAction } from "../../../../../../hooks";
import { ErrorMessage } from "../../../../../../common/error";
import { LoadingSkeletonTable } from "../../../../../../common/loading";
import { Table } from "../../../../../../common/table";
import { purchaseOrderApi } from "../../../../../../data/apiUrl";
import type { PurchaseOrder } from "../../../../../../data/types";
import { EditButton, SeeButton } from "../../../../../../common/button";
import { useNavigate } from "react-router-dom";
import StatusTag, { statusOptions } from "./components/StatusTag";
import toast, { Toaster } from "react-hot-toast";

interface PurchaseOrderTableProps {
  projectId: number;
}

export default function PurchaseOrderTable({ projectId }: PurchaseOrderTableProps) {
  const { data: purchaseOrders, loading, error, setData } = useFetch<PurchaseOrder[]>(`${purchaseOrderApi}project/${projectId}`, [projectId]);
  const { execute } = useApiAction<any>();

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
    } catch (err: any) {
      // Revertir al estado anterior si falla
      setData(previousOrders);
      toast.error(err.message || 'Error al actualizar el estado');
    }
  };

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!processedPurchaseOrders.length) return <ErrorMessage errorMessage="No hay órdenes de compra disponibles." />;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Table<PurchaseOrder>
        data={processedPurchaseOrders as unknown as PurchaseOrder[]}
        columns={[
          { key: "code", label: "Código", width: "12rem" },
          { key: "supplierName", label: "Proveedor", width: "12rem" },
          { key: "createdAt", label: "Fecha de Registro", width: "12rem" },
          { 
            label: "Estado",
            width: "8rem",
            render: (row: PurchaseOrder) => {
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
              po.status === "Pendiente" ? <EditButton onClick={() => handleEdit(po.purchaseOrderId)} /> : <SeeButton onClick={() => handleSee(po.purchaseOrderId)} />
          ) }
        ] as const}
      />
    </>
  );
}
