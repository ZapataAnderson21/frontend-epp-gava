import { useParams } from "react-router-dom";
import PurchaseOrderTable from "../PurchaseOrders/PurchaseOrderTable";

export default function PurchaseOrdersProject() {
  const { id: projectId } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col max-w-full w-full gap-6">
      <PurchaseOrderTable projectId={Number(projectId)} />
    </div>
  )
}