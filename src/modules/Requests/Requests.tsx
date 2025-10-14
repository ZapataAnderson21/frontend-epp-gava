import { useState } from "react";
import { FaArrowLeft, FaPlus } from "react-icons/fa6";
import { HeaderPanel, Panel } from "../../common/panel";
import { SelectForm } from "../../common/form";
import { Button } from "../../components";
import RequestTable from "./RequestTable";
import { useSearchParams } from "react-router-dom";

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

        {projectId && (
          <Button
          icon={<FaArrowLeft />}
          label="Regresar"
          href={`/admin/projects/${projectId}`}
          bgColor="#d80027"
          bgHoverColor="#c80008"
          onClick={() => {}}
        />
        )}

        <Button
          icon={<FaPlus />}
          label="Añadir"
          href = "/admin/requests/new"
          bgColor="#0047a3"
          bgHoverColor="#003a80"
          onClick={() => {}}
        />
      </HeaderPanel>

      <RequestTable filter={filter.value} />

    </Panel>
  );
}
