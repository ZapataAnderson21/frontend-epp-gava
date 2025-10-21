import { useNavigate, useSearchParams } from "react-router-dom";
import type { Project } from "../../../data/types";
import { useFetch, useCurrentUser } from "../../../hooks";
import { projectApi } from "../../../data/apiUrl";
import { HeaderPanel, Panel } from "../../../common/panel";
import PurchaseOrderTable from "./PurchaseOrderTable";
import { ErrorMessage } from "../../../common/error";
import { ReturnButton } from "../../../common/button";
import AddButton from "../../../common/button/AddButton";
import Permission from "../../../common/auth/Permission";
import { adminTypes, logisticsTypes } from "../../../utils";


export default function PurchaseOrders() {
  const { user } = useCurrentUser();

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const { data: project, loading, error } = useFetch<Project>(`${projectApi}${projectId}`);

  const navigate = useNavigate();

  const navigateBack = () => {
    navigate(`/admin/projects/${projectId}`);
  };

  const navigateToNewPurchaseOrder = () => {
    navigate(`/admin/purchase-orders/new?projectId=${projectId}`);
  }

  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <Permission user={user} allow={logisticsTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta página." />} >
      <Panel>

        <HeaderPanel name={`${project ? `Órdenes de compra de ${project.name}` : loading ? "Cargando..." : "Proyecto no encontrado"}`}>
          <ReturnButton onClick={navigateBack} />
          <Permission user={user} allow={adminTypes}>
            <AddButton onClick={navigateToNewPurchaseOrder} />
          </Permission>
        </HeaderPanel>

        <PurchaseOrderTable projectId={Number(projectId)} />
      </Panel>
    </Permission>
  )
}