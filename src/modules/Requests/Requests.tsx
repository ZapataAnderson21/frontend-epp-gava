import { useState } from "react";
import { HeaderPanel, Panel } from "../../common/panel";
import { SelectForm } from "../../common/form";
import RequestTable from "./RequestTable";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ReturnButton } from "../../common/button";
import AddButton from "../../common/button/AddButton";

export const options = [
  { value: "all", label: "Todas" },
  { value: "inProgress", label: "En Progreso" },
  { value: "reviewed", label: "Revisadas" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "addressed", label: "Atendidas" },
  { value: "completed", label: "Completadas" },
];

export default function Requests() {
  const [ filter, setFilter ] = useState(options[0]);
  const [requestKind, setRequestKind] = useState("");
  const [search, setSearch] = useState("");

  const handleSelect = (option: { value: string; label: string }) => {
    setFilter(option);
  };

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const navigate = useNavigate();

  const navigateToProject = () => {
    if (projectId) {
      navigate(`/admin/projects/${projectId}`);
    }
  };

  const navigateToNewRequest = () => {
    navigate(`/admin/requests/new${projectId ? `?projectId=${projectId}` : ""}`);
  }

  return (

    <Panel>
      <HeaderPanel name={`REQUERIMIENTOS`}>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por proyecto, solicitante o descripción"
          className="min-w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-[#0047a3]"
          aria-label="Buscar requerimientos"
        />
        <div className="w-fit">
          <SelectForm
            label="Filtrar por"
            name="filter"
            value={filter.value}
            onChange={(value) => {
              const option = options.find(opt => opt.value === value);
              if (option) {
                handleSelect(option);
              }
            }}
            options={options}
            directionRow={true}
          />
        </div>
        <div className="w-fit">
          <SelectForm
            label="Tipo"
            name="requestKind"
            value={requestKind}
            onChange={setRequestKind}
            options={[
              { value: "", label: "Todos" },
              { value: "projectStart", label: "Inicio de Obra" },
              { value: "duringExecution", label: "Durante la Ejecución" },
            ]}
            directionRow={true}
          />
        </div>
        <AddButton onClick={navigateToNewRequest} />
        { projectId &&  <div className="items-start"><ReturnButton onClick={navigateToProject} /></div> }
      </HeaderPanel>

      <RequestTable
        filter={filter.value}
        projectId={projectId ? Number(projectId) : undefined}
        requestKind={requestKind}
        search={search}
      />

    </Panel>
  );
}
