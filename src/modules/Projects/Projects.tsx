import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { Button } from "../../components";
import { HeaderPanel, Panel } from "../../common/panel";
import { SelectForm } from "../../common/form";
import ProjectTable from "./ProjectTable";

const options = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" }
];

export default function Projects() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [permission, setPermission] = useState(false);
  const [filter , setFilter] = useState("all");

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

        { permission && <Button
          icon={<FaPlus />}
          label="Añadir"
          onClick={() => window.location.href = "/admin/projects/new"}
          bgColor="#0047a3"
          bgHoverColor="#003a80"
        />
        }
      </HeaderPanel>

      <ProjectTable filter={filter} />
    </Panel>
  );
}