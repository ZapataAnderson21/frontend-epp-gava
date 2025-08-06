import type { EmergencyType } from "../../../data/emergencyData";

interface RowTableProps {
  emergency: EmergencyType;
}

const statusColorClasses: { [key: string]: string } = {
  active: "bg-green-500",
  inactive: "bg-red-500",
  default: "bg-gray-500",
};

const statusTranslated: { [key: string]: string } = {
  active: "Activo",
  inactive: "Inactivo",
  default: "Desconocido",
};

export default function RowTable({ emergency }: RowTableProps) {
  const statusClass = statusColorClasses[emergency.status] || statusColorClasses.default;

  return (
    <a href={`/admin/projects/${emergency.emergency_id}`} className="w-full">
      <div className="flex flex-row items-center justify-between w-full p-4 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer">
        <span className="flex items-start justify-start w-6">{emergency.title}</span>
        <span className="flex items-start justify-start w-48">{emergency.project?.name}</span>
        <span className="flex items-start justify-start w-24">{emergency.user?.name}</span>
        <span className="flex flex-row items-center justify-center md:justify-start gap-2 w-12 md:w-24">
          <div className={`${statusClass} size-3 rounded-full`}></div>
          <span className="hidden md:block">{statusTranslated[emergency.status] || statusTranslated.default}</span>
        </span>
      </div>
    </a>
  );
}