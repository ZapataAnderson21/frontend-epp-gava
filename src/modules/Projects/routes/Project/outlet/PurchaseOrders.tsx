import { useNavigate, useParams } from "react-router-dom";
import PurchaseOrderTable from "./PurchaseOrders/PurchaseOrderTable";
import Permission from "../../../../../common/auth/Permission";
import { AddButton } from "../../../../../common/button";
import { useCurrentUser } from "../../../../../hooks";
import { adminTypes } from "../../../../../utils";

export default function PurchaseOrdersProject() {

   const { user } = useCurrentUser();

  const { id: projectId } = useParams<{ id: string }>();  

  const navigate = useNavigate();
  
  const navigateToNewPurchaseOrder = () => {
    navigate(`/admin/projects/${projectId}/purchase-orders/new`);
  }

  return (
    <div className="flex flex-col max-w-full w-full gap-6">

      <Permission user={user} allow={adminTypes}>
        <div className="flex justify-end">
          <div className="flex flex-row w-fit gap-2">
            <AddButton onClick={navigateToNewPurchaseOrder} />
          </div>
        </div>
      </Permission>

      <PurchaseOrderTable projectId={Number(projectId)} />
    </div>
  )
}