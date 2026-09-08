import { List as FaListUl } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Permission from "../../../../../common/auth/Permission";
import { AddButton } from "../../../../../common/button";
import { Button } from "../../../../../components";
import { useCurrentUser } from "../../../../../hooks";
import { UnitValuesModal } from "./PurchaseOrders/components";
import PurchaseOrderTable from "./PurchaseOrders/PurchaseOrderTable";

export default function PurchaseOrdersProject() {
  const { user } = useCurrentUser();
  const [isUnitValuesOpen, setIsUnitValuesOpen] = useState(false);

  const { id: projectId } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const navigateToNewPurchaseOrder = () => {
    navigate(`/admin/projects/${projectId}/purchase-orders/new`);
  };

  return (
    <div className="flex flex-col max-w-full w-full gap-6">
      <Permission user={user} permission="orders.view">
        <div className="flex justify-end">
          <div className="flex flex-row flex-wrap w-fit gap-2">
            <Button
              permission="finance.view"
              icon={<FaListUl />}
              label="Valores unitarios"
              bgColor="#14519d"
              bgHoverColor="#0f3f7a"
              type="button"
              onClick={() => setIsUnitValuesOpen(true)}
            />
            <Permission user={user} permission="orders.manage">
              <AddButton onClick={navigateToNewPurchaseOrder} />
            </Permission>
          </div>
        </div>
      </Permission>

      <PurchaseOrderTable projectId={Number(projectId)} />
      <UnitValuesModal
        isOpen={isUnitValuesOpen}
        projectId={Number(projectId)}
        onClose={() => setIsUnitValuesOpen(false)}
      />
    </div>
  );
}
