import { useEffect, useState } from 'react';
import { IoMdArrowDropdown } from 'react-icons/io'; 
import ContentTable from './components/ContentTable';
import HeaderTable from './components/HeaderTable';
import { FaPlus } from 'react-icons/fa6';
import { useParams } from 'react-router-dom';

const options = [
  { value: "all", label: "Todos" },
  { value: "security", label: "de Protección Personal (EPP)" },
  { value: "operative", label: "Operativos" },
];

export default function Elements() {

  const { type: elementType } = useParams<{ type?: string }>();

  if (!elementType) {
    return <div className="text-red-500">Tipo de elemento no especificado.</div>;
  }

  const [filter, setFilter] = useState(elementType ?? "all");

  const [selected, setSelected] = useState(options[0]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: { value: string; label: string }) => {
    setSelected(option);
    setFilter(option.value);
    setIsOpen(false);
  };

  useEffect(() => {
    setFilter(elementType);
    setSelected(options.find(option => option.value === elementType) || options[0]);
  }, [elementType]);

  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full mb-4 text-[14px]">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">ELEMENTOS {selected.label.toUpperCase()}</h1>
        <div className="flex flex-row items-center justify-end w-full md:w-fit mb-4 gap-2">
          
          <span className="hidden lg:block">Filtrar por:</span>

          <div className="relative w-[160px]">
            <button
              className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-[#eff2ff] hover:border-gray-400 cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            >
              {selected.value === 'all' ? 'Todos' : selected.value === 'security' ? 'EPP' : 'Operativos'}
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
                    <span className=''>{option.value === 'all' ? 'Todos' : option.value === 'security' ? 'EPP' : 'Operativos'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <a href={`/admin/elements/new?type=${filter}`}>
            <button className='flex flex-row gap-2 items-center justify-center bg-[#0047a3] text-white font-semibold px-6 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer'>
              <FaPlus />Añadir
            </button>
          </a>
        </div>
      </div>
      <div className="flex flex-col items-start justify-start gap-2 w-full h-full text-gray-600">

        <HeaderTable />

        <ContentTable type={filter} />
      </div>
    </div>
  );
}
