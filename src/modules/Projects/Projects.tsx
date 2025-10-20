import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../hooks";
import { adminTypes } from "../../utils";
import Permission from "../../common/auth/Permission";
import { HeaderPanel, Panel } from "../../common/panel";
import { SelectForm } from "../../common/form";
import { AddButton } from "../../common/button";
import ProjectTable from "./ProjectTable";

const options = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" }
];

export default function Projects() {

  const { user } = useCurrentUser();
  const [filter , setFilter] = useState("all");

  const navigate = useNavigate();

  return (
    <Panel>
      <HeaderPanel name={`PROYECTOS`}>
        <SelectForm 
          label="Filtrar por"
          name="filter"
          value={filter}
          onChange={(value) => {
            const option = options.find(opt => opt.value === value);
            if (option) {
              setFilter(option.value);
            }
          }}
          options={options}
          directionRow={true}
        />

        <Permission user={user} allow={adminTypes}>
          <AddButton onClick={() => {navigate("/admin/projects/new")}} />
        </Permission>
      </HeaderPanel>

      <ProjectTable filter={filter} />
    </Panel>
  );
}