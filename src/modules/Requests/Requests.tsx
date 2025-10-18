import { useState } from "react";
import { HeaderPanel, Panel } from "../../common/panel";
import { SelectForm } from "../../common/form";
import RequestTable from "./RequestTable";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ReturnButton } from "../../common/button";
import AddButton from "../../common/button/AddButton";

const options = [
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

        { projectId &&  <ReturnButton onClick={navigateToProject} /> }
        <AddButton onClick={navigateToNewRequest} />

      </HeaderPanel>

      <RequestTable filter={filter.value} />

    </Panel>
  );
}
