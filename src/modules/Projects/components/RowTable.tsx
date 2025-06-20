interface RowTableProps {
  id: number;
  name: string;
  code: string;
  status: string;
}

const statusColorClasses: { [key: string]: string } = {
  Activo: "bg-green-500",
  Finalizado: "bg-red-500",
  default: "bg-gray-500",
};

export default function RowTable({ id, name, code, status }: RowTableProps) {
  const statusClass = statusColorClasses[status] || statusColorClasses.default;

  return (
    <div className="flex flex-row items-center justify-between w-full p-4 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer">
      <span className="flex items-start justify-start w-6">{id}</span>
      <span className="flex items-start justify-start w-32">{name}</span>
      <span className="flex items-start justify-start w-24">{code}</span>
      <span className="flex flex-row items-center justify-center md:justify-start gap-2 w-12 md:w-24">
        <div className={`${statusClass} size-3 rounded-full`}></div>
        <span className="hidden md:block">{status}</span>
      </span>
    </div>
  );
}