import { useSearchParams } from "react-router-dom";
import type { ProjectType } from "../../../data/types";
import { useFetch } from "../../../hooks";
import { projectApi } from "../../../data/apiUrl";
import { HeaderPanel, Panel } from "../../../common/panel";
import { Button } from "../../../components";
import { FaArrowLeft, FaPlus } from "react-icons/fa6";
import PurchaseOrderTable from "./PurchaseOrderTable";
import { ErrorMessage } from "../../../common/error";


export default function PurchaseOrders() {

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const { data: project, loading, error } = useFetch<ProjectType>(`${projectApi}${projectId}`);

  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <Panel>

      <HeaderPanel name={`${project ? `Órdenes de compra de ${project.name}` : loading ? "Cargando..." : "Proyecto no encontrado"}`}>
        <Button
          icon = {<FaArrowLeft />}
          label = "Regresar"
          href = {`/admin/projects/${projectId}`}
          bgColor = "#d80027"
          bgHoverColor = "#c80008"
          onClick = {() => {}}
        />
        <Button
          icon = {<FaPlus />}
          label = "Añadir"
          href = {`/admin/purchase-orders/new?projectId=${projectId}`}
          bgColor = "#0047a3"
          bgHoverColor = "#003a80"
          onClick = {() => {}}
        />
      </HeaderPanel>

      <PurchaseOrderTable projectId={Number(projectId)} />
    </Panel>
  )
}