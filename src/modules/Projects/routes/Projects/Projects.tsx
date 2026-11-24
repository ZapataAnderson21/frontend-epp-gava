import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Permission from "../../../../common/auth/Permission";
import { AddButton } from "../../../../common/button";
import { SelectForm } from "../../../../common/form";
import { HeaderPanel, Panel } from "../../../../common/panel";
import { useCurrentUser } from "../../../../hooks";
import ProjectTable from "./components/ProjectTable";
import { PROJECT_TYPE_FILTER_OPTIONS } from "../../projectTypes";

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

export default function Projects() {
  const { user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const navigate = useNavigate();

  return (
    <Panel>
      <HeaderPanel name={`PROYECTOS`}>
        <div className="flex flex-wrap gap-2 justify-end w-full ">
          <div className="w-fit">
            <SelectForm
              label="Filtrar por"
              name="statusFilter"
              value={statusFilter}
              onChange={(value) => {
                const option = statusOptions.find((opt) => opt.value === value);
                if (option) {
                  setStatusFilter(option.value);
                }
              }}
              options={statusOptions}
              directionRow={true}
            />
          </div>
          <div className="w-fit">
            <SelectForm
              label="Tipo"
              name="typeFilter"
              value={typeFilter}
              onChange={setTypeFilter}
              options={PROJECT_TYPE_FILTER_OPTIONS}
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

      <ProjectTable statusFilter={statusFilter} typeFilter={typeFilter} />
    </Panel>
  );
}
