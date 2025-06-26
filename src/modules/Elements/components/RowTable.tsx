
interface RowTableProps {
  id: number;
  name: string;
  type: string;
  description: string;
}

export default function RowTable({ id, name, type, description }: RowTableProps) {
  return (
    <a className="w-full" href={`/admin/elements/${id}`}>
      <div className="flex flex-row items-center justify-between w-full p-4 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer">
        <span className="flex items-start justify-start w-12">{id}</span>
        <span className="flex items-start justify-start w-48">{name}</span>
        <span className="flex items-start justify-start w-36">{type === 'security' ? 'EPP' : 'Operativo'}</span>
        <span className="hidden md:flex items-start justify-start w-64">{description}</span>
      </div>
    </a>
  );
}