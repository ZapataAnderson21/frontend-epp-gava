
interface RowTableProps {
  id: number;
  date: string;
  status: string;
  user: string;
}

export default function RowTable({ id, date, status, user }: RowTableProps) {
  return (
    <div className="flex flex-row items-center justify-between w-full p-4 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer">
      <span className="flex items-start justify-start w-12">{id}</span>
      <span className="flex items-start justify-start w-24">{date}</span>
      <span className="flex items-start justify-start w-24">{status}</span>
      <span className="hidden sm:flex items-start justify-start w-24">{user}</span>
    </div>
  );
}