import { FaPlus } from "react-icons/fa6";
import { HeaderPanel, Panel } from "../../common/panel";
import { Button } from "../../components";
import { useFetch } from "../../hooks";
import type { EmergencyType } from "../../data/types";
import { emergencyApi } from "../../data/apiUrl";
import { LoadingSkeletonTable } from "../../common/loading";
import { ErrorMessage } from "../../common/error";
import EmergencyTable from "./ContentTable";

export default function Emergencies() {

  const { data: emergencies, loading, error } = useFetch<EmergencyType[]>(emergencyApi);

  return (
    <Panel>
      <HeaderPanel name={`EMERGENCIAS`}>
        <Button
          icon={<FaPlus />}
          label="Añadir"
          onClick={() => window.location.href = "/admin/emergencies/new"}
          bgColor="#0047a3"
          bgHoverColor="#003a80"
        />
      </HeaderPanel>
      {loading && <LoadingSkeletonTable />}
      
      {error && <ErrorMessage errorMessage={error} />}

      {emergencies && emergencies.length === 0 && (
        <div className="text-gray-500">No hay emergencias disponibles.</div>
      )}

      {emergencies && emergencies.length > 0 && (
        <EmergencyTable emergencies={emergencies} />
      )}
    </Panel> 
  )
}