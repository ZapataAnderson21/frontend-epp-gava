function HeaderTableSummary() {
  return (
    <div className="flex flex-row items-center justify-between w-full max-w-2xl text-[14px] text-black font-extrabold gap-1">
      <div className="border-2 border-gray-800 w-full text-center px-3 py-1 rounded-md">ITEM</div>
      <div className="border-2 border-gray-800 w-full text-center px-3 py-1 rounded-md">UNIDAD</div>
      <div className="border-2 border-gray-800 w-full text-center px-3 py-1 rounded-md">CANT. PED.</div>
      <div className="border-2 border-gray-800 w-full text-center px-3 py-1 rounded-md"><span className="hidden xl:inline-flex">CANT.</span><span> ACEP.</span></div>
    </div>
  )
}

export default HeaderTableSummary