import { useEffect, useState } from "react";
import { IoMdArrowDropdown } from "react-icons/io";
import ContentTable from "./components/ContentTable";
import { FaPlus } from "react-icons/fa6";

const options = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" }
];

export default function Projects() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [permission, setPermission] = useState(false);
  const [filter , setFilter] = useState("all");
  const [selected, setSelected] = useState(options[0]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (["GERENTE", "ADMINISTRADORA", "SISTEMAS"].includes(user.userType)) {
      setPermission(true);
    }
  }, [user]);

  if (!user) {
    return <div className="text-red-500">Iniciar sesión.</div>;
  }

  const handleSelect = (option: { value: string; label: string }) => {
    setSelected(option);
    setFilter(option.value);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full mb-4">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">PROYECTOS</h1>
        <div className="flex flex-row items-center justify-end w-full md:w-fit mb-4 gap-2">
          <span className="hidden lg:block">Filtrar por:</span>

          <div className="relative w-[160px]">
            <button
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-[#eff2ff] hover:border-gray-400 cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            >
              {selected.label}
              <IoMdArrowDropdown
                className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md">
                {options.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option)}
                    className={`px-3 py-1 hover:bg-[#eff2ff] hover:text-[#0047a3] cursor-pointer ${
                      selected.value === option.value ? "bg-[#eff2ff] font-semibold text-[#0047a3]" : ""
                    }`}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {
            permission && (
              <a href="/admin/projects/new">
                <button className='flex flex-row gap-2 items-center justify-center bg-[#0047a3] text-white font-semibold px-4 py-3 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer'>
                  <FaPlus />Añadir
                </button>
              </a>
            )
          }
        </div>
      </div>
      <div className="flex flex-col items-start justify-start gap-2 px-2 overflow-auto w-full text-gray-600">
        <ContentTable filter={filter} />
      </div>
    </div>
  );
}
