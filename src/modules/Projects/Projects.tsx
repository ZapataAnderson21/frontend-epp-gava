import { useEffect, useState } from "react";
import { HeaderPanel, Panel } from "../../common/panel";
import { SelectForm } from "../../common/form";
import ProjectTable from "./ProjectTable";
import AddButton from "../../common/button/AddButton";
import { useNavigate } from "react-router-dom";

const options = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" }
];

export default function Projects() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [permission, setPermission] = useState(false);
  const [filter , setFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    if (["GERENTE", "ADMINISTRADORA", "SISTEMAS"].includes(user.userType)) {
      setPermission(true);
    }
  }, [user]);

  if (!user) {
    return <div className="text-red-500">Iniciar sesión.</div>;
  }
  
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

        { permission && <AddButton onClick={() => {navigate("/admin/projects/new")}} /> }
      </HeaderPanel>

      <ProjectTable filter={filter} />
    </Panel>
  );
}