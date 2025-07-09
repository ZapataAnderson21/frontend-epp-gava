
interface RowTableProps {
  id: number;
  createdAt: string;
  status: string;
  deliveryDueDate: string;
  user: string;
}

const statusColorClasses: { [key: string]: { color: string, value: string } } = {
  draft: {
    color:"bg-gray-500",
    value:"Borrador",
  },
  in_progress: {
    color:"bg-orange-500",
    value:"En progreso",
  },
  under_review: {
    color:"bg-yellow-500",
    value:"Revisado",
  },
  approved: {
    color:"bg-green-500",
    value:"Aprobado",
  },
  rejected: {
    color:"bg-red-500",
    value:"Rechazado",
  },
  attended: {
    color:"bg-blue-500",
    value:"Atendido",
  },
  completed: {
    color:"bg-purple-500",
    value:"Completado",
  },
};

export default function RowTable({ id, createdAt, deliveryDueDate, status, user }: RowTableProps) {
  const statusClass = statusColorClasses[status] || statusColorClasses.default;

  const formattedDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <a href={`/admin/requests/${id}`} className="w-full">
      <div className="flex flex-row items-center justify-between w-full p-4 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer">
        <span className="flex items-start justify-start w-12">{id}</span>
        <span className="flex items-start justify-start w-32">{formattedDateTime(createdAt)}</span>
        <span className="hidden sm:flex items-start justify-start w-24">{user}</span>
        <span className="flex items-start justify-start w-32">{formattedDateTime(deliveryDueDate)}</span>
        <span className="flex flex-row items-center justify-center md:justify-start gap-2 w-12 md:w-24">
          <div className={`${statusClass.color} size-3 rounded-full`}></div>
          <span className="hidden md:block">{statusColorClasses[status]?.value}</span>
        </span>
      </div>
    </a>
  );
}