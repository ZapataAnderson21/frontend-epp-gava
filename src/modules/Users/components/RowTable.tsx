interface RowTableProps {
  id: number;
  name: string;
  lastname: string;
  email: string;
  rol: string;
}

export default function RowTable({ id, name, lastname, email, rol }: RowTableProps) {
  const [firstLastname, ...rest] = lastname.split(" ");
  const restLastname = rest.join(" ");

  return (
    <a href={`/admin/users/${id}`} className="w-full">
      <div className="flex flex-row items-center justify-between w-full p-4 border-b border-gray-200 
                    gap-4 hover:rounded-lg hover:bg-[#eff2ff] cursor-pointer">
        <span className="flex items-start justify-start w-8">{id}</span>
        <span className="flex items-start justify-start w-22">{name}</span>
        <span className="hidden lg:flex items-start justify-start w-28">
          {firstLastname}
        <span className="hidden md:inline"> {restLastname}</span>
        </span>
        <span className="flex items-start justify-start w-28 sm:w-42">{email}</span>
        <span className="hidden sm:flex items-start justify-start w-24">{rol}</span>
      </div>
    </a>
  );
}
