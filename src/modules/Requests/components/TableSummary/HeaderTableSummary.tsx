export default function HeaderTableSummary() {
  return (
    <div className="grid grid-cols-4 w-full h-full text-[14px] text-black font-extrabold gap-1">
      <div className="flex border-2 border-gray-800 w-full h-full justify-center items-center text-center px-3 py-1 rounded-md">ITEM</div>
      <div className="flex border-2 border-gray-800 w-full h-full justify-center items-center text-center px-3 py-1 rounded-md">UNIDAD</div>
      <div className="flex border-2 border-gray-800 w-full h-full justify-center items-center text-center px-3 py-1 rounded-md">CANT. PED.</div>
      <div className="flex border-2 border-gray-800 w-full h-full justify-center items-center text-center px-3 py-1 rounded-md"><span className="hidden xl:inline-flex">CANT.</span><span> ACEP.</span></div>
    </div>
  )
}