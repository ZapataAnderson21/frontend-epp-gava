import { useSearchParams } from "react-router-dom";
import { HeaderPanel, Panel } from "../../../common/panel";
import PettyCashTable from "./PettyCashTable";
import { useFetch } from "../../../hooks";
import { type ProjectType } from "../../../data/types";
import { projectApi } from "../../../data/apiUrl";
import { Button } from "../../../components";
import { FaArrowLeft } from "react-icons/fa6";
import NewPettyCash from "./NewPettyCash";
import { useState } from "react";
import { ErrorMessage } from "../../../common/error";

export default function PettyCash() {

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const {data: project, loading} = useFetch<ProjectType>(`${projectApi}${projectId}`, [projectId]);
  const [reFetch, setReFetch] = useState(0);

  const successAction = () => { setReFetch(prev => prev + 1); }

  if (!projectId || isNaN(Number(projectId)) || Number(projectId) <= 0)  return <ErrorMessage errorMessage="No se encontró el proyecto." />;
  
  return (
    <Panel>
      <HeaderPanel name={project ? `Caja Chica de ${project.name}` : loading ? "Cargando..." :  "Proyecto no encontrado"}>
        <Button
          icon={<FaArrowLeft />}
          label="Regresar"
          href={`/admin/projects/${projectId}`}
          bgColor="#d80027"
          bgHoverColor="#c80008"
          onClick={() => {}}
        />
      </HeaderPanel>

      <section className="flex flex-row flex-wrap w-full gap-4">

        <div className="flex-1">
          <PettyCashTable projectId={projectId ? Number(projectId) : 0} reFetch={reFetch} />
        </div>
        <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="w-full md:w-1/3 p-4 border-1 border-gray-200 rounded-lg">
          <NewPettyCash projectId={projectId ? Number(projectId) : 0} successAction={successAction} />
        </div>
      </section>
    </Panel>
  );
}