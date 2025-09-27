import RowTable from "./RowTable";
import { fetchGetAllEmergencies, type EmergencyType } from "../../../data/types";
import { useEffect, useState } from "react";

export default function ContentTable() {

  const [emergencies, setEmergencies] = useState<EmergencyType[]>([]);

  useEffect(() => {
    const fetchEmergencies = async () => {
      const response = await fetchGetAllEmergencies();
      if (response.statusCode === 200) {
        setEmergencies(response.data);
      }
    };
    fetchEmergencies();
  }, []);


  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[12px] md:text-[14px]">
      {emergencies.map((emergency) => (
        <RowTable key={emergency.project_id} emergency={emergency} />
      ))}
    </div>
  );
}