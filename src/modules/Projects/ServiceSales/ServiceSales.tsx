import { useSearchParams } from "react-router-dom";
import { HeaderPanel, Panel } from "../../../common/panel";
import ServiceSaleTable from "./ServiceSaleTable";
import { useFetch } from "../../../hooks";
import { type ProjectType } from "../../../data/types";
import { projectApi } from "../../../data/apiUrl";
import { Button } from "../../../components";
import { FaArrowLeft, FaPlus } from "react-icons/fa6";
import NewServiceSale from "./NewServiceSale";
import { useState } from "react";
import { ErrorMessage } from "../../../common/error";
import ServiceSale from "./ServiceSale";

export default function ServiceSales() {

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const {data: project, loading} = useFetch<ProjectType>(`${projectApi}${projectId}`, [projectId]);
  const [reFetch, setReFetch] = useState(0);
  const [showRightPanel, setShowRightPanel] = useState("");
  const [selectedServiceSaleId, setSelectedServiceSaleId] = useState<number | null>(null);

  const successAction = () => { setReFetch(prev => prev + 1); }

  if (!projectId || isNaN(Number(projectId)) || Number(projectId) <= 0)  return <ErrorMessage errorMessage="No se encontró el proyecto." />;

  const handleSeeDetail = (id: number) => {
    setSelectedServiceSaleId(id);
    setShowRightPanel("detail");
  };

  return (
    <Panel>
      <HeaderPanel name={project ? `Servicios contratados de ${project.name}` : loading ? "Cargando..." :  "Proyecto no encontrado"}>
        <Button
          icon={<FaArrowLeft />}
          label="Regresar"
          href={`/admin/projects/${projectId}`}
          bgColor="#d80027"
          bgHoverColor="#c80008"
          onClick={() => {}}
        />

        <Button
          icon={<FaPlus />}
          label="Agregar"
          onClick={() => setShowRightPanel("new")}
          bgColor="#0047a3"
          bgHoverColor="#003a80"
        />
      </HeaderPanel>

      <section className="flex flex-row flex-wrap w-full gap-4">

        <div className="flex-1">
          <ServiceSaleTable projectId={projectId ? Number(projectId) : 0} reFetch={reFetch} onSee={handleSeeDetail} />
        </div>
        {showRightPanel === "new" && (
          <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="w-full md:w-1/3 p-4 border-1 border-gray-200 rounded-lg">
            <NewServiceSale projectId={projectId ? Number(projectId) : 0} successAction={successAction} />
          </div>  
        )}
        {showRightPanel === "detail" && selectedServiceSaleId && (
          <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="w-full md:w-1/3 p-4 border-1 border-gray-200 rounded-lg">
            <ServiceSale serviceSaleId={selectedServiceSaleId}  />
          </div>
        )}
      </section>
    </Panel>
  );
}