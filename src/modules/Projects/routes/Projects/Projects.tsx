import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Permission from "../../../../common/auth/Permission";
import { AddButton } from "../../../../common/button";
import { SelectForm } from "../../../../common/form";
import { HeaderPanel, Panel } from "../../../../common/panel";
import { useCurrentUser } from "../../../../hooks";
import ProjectTable from "./components/ProjectTable";

const options = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

export default function Projects() {
  const { user } = useCurrentUser();
  const [filter, setFilter] = useState("all");

  const navigate = useNavigate();

  return (
    <Panel>
      <HeaderPanel name={`PROYECTOS`}>
        <div className="flex flex-wrap gap-2 justify-end w-full ">
          <div className="w-fit">
            <SelectForm
              label="Filtrar por"
              name="filter"
              value={filter}
              onChange={(value) => {
                const option = options.find((opt) => opt.value === value);
                if (option) {
                  setFilter(option.value);
                }
              }}
              options={options}
              directionRow={true}
            />
          </div>
          <Permission user={user} permission="projects.manage">
            <AddButton
              onClick={() => {
                navigate("/admin/projects/new");
              }}
            />
          </Permission>
        </div>
      </HeaderPanel>

      <ProjectTable filter={filter} />
    </Panel>
  );
}
