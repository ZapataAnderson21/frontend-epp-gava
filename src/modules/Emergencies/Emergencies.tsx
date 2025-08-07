import { FaPlus } from "react-icons/fa6";
import HeaderTable from "./components/HeaderTable";
import ContentTable from "./components/ContentTable";

export default function Emergencies() {
  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full mb-4 text-[12px] md:text-[14px]">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">EMERGENCIAS</h1>
        <div className="flex flex-row items-center justify-end w-full md:w-fit mb-4 gap-2">
          <a href="/admin/emergencies/new">
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
  )
}