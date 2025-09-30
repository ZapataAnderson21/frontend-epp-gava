interface RowTableProps {
  id: number;
  order: number;
  name: string;
  code: string;
  status: string;
  createdAt: string;
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

export default function RowTable({ id, order, name, code, status, createdAt }: RowTableProps) {
  const statusClass = statusColorClasses[status] || statusColorClasses.default;
  const createdAtFormatted = new Date(createdAt).toLocaleDateString();

  return (
    <a href={`/admin/projects/${id}`} className="min-w-full">
      <div className={`${order%2 === 0 ? 'bg-gray-50' : 'bg-white'} flex flex-row items-center justify-between w-full p-4 pl-6 border-b border-gray-200 
                    gap-4 hover:bg-[#eff2ff] cursor-pointer`}>
        <span className="flex items-start justify-start min-w-18">{id}</span>
        <span className="flex items-start justify-start min-w-42 truncate">{name}</span>
        <span className="flex items-start justify-start min-w-36">{code}</span>
        <span className="flex items-start justify-start min-w-60">{createdAtFormatted}</span>
        <span className="flex flex-row items-center justify-start gap-2 min-w-28">
          <div className={`${statusClass} size-3 aspect-square rounded-full`}></div>
          <span>{statusTranslated[status] || statusTranslated.default}</span>
        </span>
      </div>
    </a>
  );
}