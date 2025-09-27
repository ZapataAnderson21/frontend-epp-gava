import type { EmergencyType } from "../../../data/types";

interface RowTableProps {
  emergency: EmergencyType;
}

export default function RowTable({ emergency }: RowTableProps) {

  return (
    <a href={`/admin/emergencies/${emergency.emergency_id}`} className="w-full">
      <div className="flex flex-row items-center justify-between w-full p-4 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer">
        <span className="flex items-start justify-start w-[10%]">{emergency.emergency_id}</span>
        <span className="flex items-start justify-start w-[40%]">{emergency.title}</span>
        <span className="flex items-start justify-start w-[30%]">{emergency.project?.name}</span>
        <span className="flex items-start justify-start w-[20%]">{emergency.user?.name}</span>
      </div>
    </a>
  );
}