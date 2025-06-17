interface RowTableProps {
  id: number;
  name: string;
  lastname: string;
  rol: string;
}

export default function RowTable({ id, name, lastname, rol }: RowTableProps) {
  const [firstLastname, ...rest] = lastname.split(" ");
  const restLastname = rest.join(" ");

  return (
    <div className="flex flex-row items-center justify-between w-full p-4 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer">
      <span className="flex items-start justify-start w-12">{id}</span>
      <span className="flex items-start justify-start w-40">{name}</span>
      <span className="flex items-start justify-start w-40">
        {firstLastname}
        <span className="hidden md:inline"> {restLastname}</span>
      </span>
      <span className="flex items-start justify-start w-40">{rol}</span>
    </div>
  );
}
