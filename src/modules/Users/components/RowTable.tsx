interface RowTableProps {
  id: number;
  order: number;
  name: string;
  lastname: string;
  email: string;
  rol: string;
}

export default function RowTable({id, order, name, lastname, email, rol }: RowTableProps) {
  const [firstLastname, ...rest] = lastname.split(" ");
  const restLastname = rest.join(" ");

  return (
    <a href={`/admin/users/${id}`} className="min-w-full">
      <div className={`${order%2 === 0 ? "bg-gray-50" : "bg-white"} flex flex-row items-center justify-between 
                        min-w-full p-4 pl-6 border-b border-gray-200 gap-4 hover:bg-[#eff2ff] cursor-pointer`}>
        <span className="flex items-start justify-start min-w-28">{name}</span>
        <span className="flex items-start justify-start min-w-36">
          {firstLastname} <span className="md:inline"> {restLastname}</span>
        </span>
        <span className="flex items-start justify-start min-w-48">{email}</span>
        <span className="flex items-start justify-start min-w-36">{rol}</span>
      </div>
    </a>
  );
}
