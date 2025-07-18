import { useState } from "react";
import { IoMdArrowDropdown } from "react-icons/io";
import ContentTable from "./components/Table/ContentTable";
import HeaderTable from "./components/Table/HeaderTable";
import { FaPlus } from "react-icons/fa6";

const options = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
];

export default function Requests() {
  const [selected, setSelected] = useState(options[0]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: { value: string; label: string }) => {
    setSelected(option);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full mb-4 text-[12px] md:text-[14px]">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">REQUERIMIENTOS</h1>
        <div className="flex flex-row items-center justify-end w-full md:w-fit mb-4 gap-2">
          <span className="hidden lg:block">Filtrar por:</span>

          <div className="relative w-[160px]">
            <button
              className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-[#eff2ff] hover:border-gray-400 cursor-pointer"
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
          <a href="/admin/requests/new">
            <button className='flex flex-row gap-2 items-center justify-center bg-[#0047a3] text-white font-semibold px-6 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer'>
              <FaPlus />Añadir
            </button>
          </a>
        </div>
      </div>
      <div className="flex flex-col items-start justify-start gap-2 w-full h-full text-[14px] text-gray-600">

        <HeaderTable />
        
        <ContentTable />
      </div>
    </div>
  );
}
