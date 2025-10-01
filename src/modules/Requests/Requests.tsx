import { useState } from "react";
import ContentTable from "./components/Table/ContentTable";
import { FaPlus } from "react-icons/fa6";
import { HeaderPanel, Panel } from "../../common/panel";
import { SelectForm } from "../../common/form";
import { Button } from "../../components";

const options = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
];

export default function Requests() {
  const [selected, setSelected] = useState(options[0]);

  const handleSelect = (option: { value: string; label: string }) => {
    setSelected(option);
  };

  return (

    <Panel>
      <HeaderPanel name={`REQUERIMIENTOS`}>
        <SelectForm
          label="Filtrar por"
          name="filter"
          value={selected.value}
          onChange={(value) => {
            const option = options.find(opt => opt.value === value);
            if (option) {
              handleSelect(option);
            }
          }}
          options={options}
          directionRow={true}
        />

        <Button
          icon={<FaPlus />}
          label="Añadir"
          onClick={() => window.location.href = "/admin/requests/new"}
          bgColor="#0047a3"
          bgHoverColor="#003a80"
        />
      </HeaderPanel>

      <ContentTable />

    </Panel>
  );
}
