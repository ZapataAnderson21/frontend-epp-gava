import RowTable from "./RowTable";
import { type EmergencyType } from "../../../data/types";
import { useFetch } from "../../../hooks/useFetch";
import { emergencyApi } from "../../../data/apiUrl";
import LoadingSkeletonTable from "../../../common/LoadingSkeletonTable";
import ErrorMessage from "../../../common/ErrorMessage";
import HeaderTable from "./HeaderTable";

export default function ContentTable() {

  const { data: emergencies, loading, error } = useFetch<EmergencyType[]>(emergencyApi, []);

  if (loading) {
    return (
      <LoadingSkeletonTable />
    );
  }

  if (error) {
    return (
      <ErrorMessage errorMessage={error} />
    );
  }

  if (!emergencies) {
    return <ErrorMessage errorMessage="No se encontraron emergencias." />;
  }

  return (
    <div className="flex flex-col items-start justify-start gap-2 overflow-auto w-full text-gray-600">
      <div className="flex flex-col items-center justify-between min-w-full">
        <HeaderTable />
        {emergencies.map((emergency) => (
          <RowTable key={emergency.emergency_id} emergency={emergency} />
        ))}
      </div>
    </div>
  );
}