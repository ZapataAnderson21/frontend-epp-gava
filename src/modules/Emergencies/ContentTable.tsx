import { Table } from "../../common/table";
import type { EmergencyType } from "../../data/types";

export default function EmergencyTable({ emergencies }: { emergencies: EmergencyType[] }) {
  
  const processedEmergencies = emergencies.map(emergency => ({
    ...emergency,
    projectName: emergency.project?.name || 'Sin proyecto',
    userName: emergency.user?.name || 'Sin responsable'
  }));
  
  const columns = [
    { key: "emergency_id", label: "Id", width: "w-36" },
    { key: "title", label: "Asunto", width: "w-36" },
    { key: "projectName", label: "Proyecto", width: "w-48" },
    { key: "userName", label: "Responsable", width: "w-144" },
  ] as const;

  return (
    <Table<EmergencyType>
      data={processedEmergencies}
      columns={columns}
      getHref={(emergency) => `/admin/emergencies/${emergency.emergency_id}`}
    />
  );
}
