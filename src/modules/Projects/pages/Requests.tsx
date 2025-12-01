import RequestTable from "../../Requests/RequestTable";
import { options } from "../../Requests/Requests";
import { SelectForm } from "../../../common/form";
import { useState } from "react";

export default function RequestsProject() {
  const [ filter, setFilter ] = useState(options[0]);
  
  const handleSelect = (option: { value: string; label: string }) => {
    setFilter(option);
  };

  return (
    <div className="flex flex-col max-w-full w-full gap-6">
      <div className="flex justify-end">
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
      </div>

      <RequestTable filter={filter.value}  />
    </div>
  )
}