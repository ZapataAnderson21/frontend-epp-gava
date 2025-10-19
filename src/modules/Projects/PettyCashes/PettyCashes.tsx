import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCurrentUser, useFetch } from "../../../hooks";
import { type Project } from "../../../data/types";
import { projectApi } from "../../../data/apiUrl";
import { ReturnButton, AddButton } from "../../../common/button";
import { HeaderPanel, Panel } from "../../../common/panel";
import { ErrorMessage } from "../../../common/error";
import { adminTypes } from "../../../utils";
import { PettyCash, NewPettyCash, PettyCashTable }  from "./";
import Permission from "../../../common/auth/Permission";

export default function PettyCashes() {
  const { user } = useCurrentUser();

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const {data: project, loading} = useFetch<Project>(`${projectApi}${projectId}`, [projectId]);
  const [reFetch, setReFetch] = useState(0);
  const [showRightPanel, setShowRightPanel] = useState("");
  const [selectedPettyCashId, setSelectedPettyCashId] = useState<number | null>(null);

  const successAction = () => { setReFetch(prev => prev + 1); }

  if (!projectId || isNaN(Number(projectId)) || Number(projectId) <= 0)  return <ErrorMessage errorMessage="No se encontró el proyecto." />;

  const handleSeeDetail = (id: number) => {
    setSelectedPettyCashId(id);
    setShowRightPanel("detail");
  };

  const navigate = useNavigate();

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta seccióne." />}>
      <Panel>
        <HeaderPanel name={project ? `Caja Chica de ${project.name}` : loading ? "Cargando..." :  "Proyecto no encontrado"}>
          <ReturnButton onClick={() => {navigate(`admin/projects/${projectId}`)}} />
          <AddButton onClick={() => setShowRightPanel("new")} />
        </HeaderPanel>

        <section className="flex flex-row flex-wrap w-full gap-4">

          <div className="flex-1">
            <PettyCashTable projectId={projectId ? Number(projectId) : 0} reFetch={reFetch} onSee={handleSeeDetail} />
          </div>
          {showRightPanel === "new" && (
            <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="w-full md:w-1/3 p-4 border-1 border-gray-200 rounded-lg">
              <NewPettyCash projectId={projectId ? Number(projectId) : 0} successAction={successAction} />
            </div>  
          )}
          {showRightPanel === "detail" && selectedPettyCashId && (
            <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="w-full md:w-1/3 p-4 border-1 border-gray-200 rounded-lg">
              <PettyCash pettyCashId={selectedPettyCashId}  />
            </div>
          )}
        </section>
      </Panel>
    </Permission>
  );
}