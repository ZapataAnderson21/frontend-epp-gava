import { useNavigate, useSearchParams } from "react-router-dom";
import type { ProjectType } from "../../../data/types";
import { useFetch } from "../../../hooks";
import { projectApi } from "../../../data/apiUrl";
import { HeaderPanel, Panel } from "../../../common/panel";
import { Button } from "../../../components";
import { FaArrowLeft, FaPlus } from "react-icons/fa6";
import PurchaseOrderTable from "./PurchaseOrderTable";
import { ErrorMessage } from "../../../common/error";
import { ReturnButton } from "../../../common/button";
import AddButton from "../../../common/button/AddButton";


export default function PurchaseOrders() {

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const { data: project, loading, error } = useFetch<ProjectType>(`${projectApi}${projectId}`);

  const navigate = useNavigate();

  const navigateBack = () => {
    navigate(`/admin/projects/${projectId}`);
  };

  const navigateToNewPurchaseOrder = () => {
    navigate(`/admin/purchase-orders/new?projectId=${projectId}`);
  }

  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <Panel>

      <HeaderPanel name={`${project ? `Órdenes de compra de ${project.name}` : loading ? "Cargando..." : "Proyecto no encontrado"}`}>
        <ReturnButton onClick={navigateBack} />
        <AddButton onClick={navigateToNewPurchaseOrder} />
      </HeaderPanel>

      <PurchaseOrderTable projectId={Number(projectId)} />
    </Panel>
  )
}