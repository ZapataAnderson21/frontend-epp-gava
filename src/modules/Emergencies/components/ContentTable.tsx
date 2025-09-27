import RowTable from "./RowTable";
import { type EmergencyType } from "../../../data/types";
import { useFetch } from "../../../hooks/useFetch";
import { emergencyApi } from "../../../data/apiUrl";
import LoadingSkeletonTable from "../../../common/LoadingSkeletonTable";
import ErrorMessage from "../../../common/ErrorMessage";

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
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[12px] md:text-[14px]">
      {emergencies.map((emergency) => (
        <RowTable key={emergency.project_id} emergency={emergency} />
      ))}
    </div>
  );
}