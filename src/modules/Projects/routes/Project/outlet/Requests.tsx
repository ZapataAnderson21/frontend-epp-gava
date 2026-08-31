import RequestTable from "../../../../Requests/RequestTable";
import { options } from "../../../../Requests/Requests";
import { SelectForm } from "../../../../../common/form";
import { useState, useMemo } from "react";
import { AddButton } from "../../../../../common/button";
import { useNavigate, useParams } from "react-router-dom";

export default function RequestsProject() {
  const [ filter, setFilter ] = useState(options[0]);
  const { id: routeProjectId } = useParams<{ id: string }>();

  const projectId = useMemo(() => {
    if (routeProjectId) {
      const n = Number(routeProjectId);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return undefined;
  }, [routeProjectId]);

  const navigate = useNavigate();
  
  const handleSelect = (option: { value: string; label: string }) => {
    setFilter(option);
  };

  const navigateToNewRequest = () => {
    navigate(`/admin/requests/new${projectId ? `?projectId=${projectId}` : ""}`);
  }

  return (
    <div className="flex flex-col max-w-full w-full gap-6">
      <div className="flex justify-end">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="w-full min-w-0 sm:w-72">
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
          <AddButton onClick={navigateToNewRequest} />
        </div>
      </div>

      <RequestTable filter={filter.value} projectId={projectId} />
    </div>
  )
}
