import { List as FaListUl } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Permission from "../../../../../../common/auth/Permission";
import { ReturnButton } from "../../../../../../common/button";
import AddButton from "../../../../../../common/button/AddButton";
import { ErrorMessage } from "../../../../../../common/error";
import { HeaderPanel, Panel } from "../../../../../../common/panel";
import { Button } from "../../../../../../components";
import { projectApi } from "../../../../../../data/apiUrl";
import type { Project } from "../../../../../../data/types";
import { useCurrentUser, useFetch } from "../../../../../../hooks";
import { UnitValuesModal } from "./components";
import PurchaseOrderTable from "./PurchaseOrderTable";

export default function PurchaseOrders() {
  const { user } = useCurrentUser();
  const [isUnitValuesOpen, setIsUnitValuesOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const {
    data: project,
    loading,
    error,
  } = useFetch<Project>(`${projectApi}${projectId}`);

  const navigate = useNavigate();

  const navigateBack = () => {
    navigate(`/admin/projects/${projectId}`);
  };

  const navigateToNewPurchaseOrder = () => {
    navigate(`/admin/purchase-orders/new?projectId=${projectId}`);
  };

  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <Permission
      user={user}
      permission="orders.view"
      fallback={
        <ErrorMessage errorMessage="No tienes permiso para ver esta página." />
      }
    >
      <Panel>
        <HeaderPanel
          name={`${project ? `Órdenes de compra de ${project.name}` : loading ? "Cargando..." : "Proyecto no encontrado"}`}
        >
          <Button
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

          <ReturnButton onClick={navigateBack} />
        </HeaderPanel>

        <PurchaseOrderTable projectId={Number(projectId)} />
        <UnitValuesModal
          isOpen={isUnitValuesOpen}
          projectId={Number(projectId)}
          onClose={() => setIsUnitValuesOpen(false)}
        />
      </Panel>
    </Permission>
  );
}
