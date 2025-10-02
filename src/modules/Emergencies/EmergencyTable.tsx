import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { emergencyApi } from "../../data/apiUrl";
import type { EmergencyType } from "../../data/types";
import { useFetch } from "../../hooks";

export default function EmergencyTable() {
  
  const { data: emergencies, loading, error } = useFetch<EmergencyType[]>(emergencyApi);
  
  const columns = [
    { key: "emergency_id", label: "Id", width: "4rem" },
    { key: "title", label: "Asunto", width: "12rem" },
    { key: "projectName", label: "Proyecto", width: "12rem" },
    { key: "userName", label: "Responsable", width: "12rem" },
  ] as const;

  if(loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!emergencies || emergencies.length === 0) {
    return <div className="text-gray-500">No hay emergencias disponibles.</div>;
  }

  const processedEmergencies = emergencies.map(emergency => ({
    ...emergency,
    projectName: emergency.project?.name || 'Sin proyecto',
    userName: emergency.user?.name || 'Sin responsable'
  }));

  return (
    <Table<EmergencyType>
      data={processedEmergencies}
      columns={columns}
      getHref={(emergency) => `/admin/emergencies/${emergency.emergency_id}`}
    />
  );
}
