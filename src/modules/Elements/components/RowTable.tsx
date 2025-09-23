
interface RowTableProps {
  id: number;
  order: number;
  name: string;
  type: string;
  description: string;
}

export default function RowTable({ id, order, name, type, description }: RowTableProps) {
  return (
    <a className="w-full" href={`/admin/elements/${id}`}>
      <div className={`${order % 2 === 0 ? "bg-gray-50" : "bg-white"} flex flex-row items-center justify-between md:justify-start w-full p-4 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer`}>
        <span className="flex items-center justify-start min-w-16">{order}</span>
        <span className="flex items-start justify-start min-w-48">{name}</span>
        <span className="flex items-start justify-start min-w-24">{type === 'security' ? 'EPP' : 'Operativo'}</span>
        <span className="flex items-start justify-start min-w-144 w-full">{description}</span>
      </div>
    </a>
  );
}