import { FaPlus } from "react-icons/fa6";
import ContentTable from "./components/ContentTable";

export default function Users() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isManager = ["GERENTE", "ADMINISTRADORA"].includes(user.userType);

  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full mb-4">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">USUARIOS</h1>
        { isManager && (
          <div className="flex flex-row items-center justify-end w-full md:w-fit mb-4 gap-2">
            <a href="/admin/users/new">
              <button className='flex flex-row gap-2 items-center justify-center bg-[#0047a3] text-white font-semibold px-4 py-3 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer'>
                <FaPlus />Añadir
              </button>
            </a>
          </div>
        )}
      </div>
      <div className="flex flex-col items-start justify-start gap-2 px-2 overflow-auto w-full text-gray-600">       
        <ContentTable />
      </div>
    </div>
  );
}
