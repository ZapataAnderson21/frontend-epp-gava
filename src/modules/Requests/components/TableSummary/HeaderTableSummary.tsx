export default function HeaderTableSummary() {
  return (
    <div className="grid w-full min-w-[840px] h-full text-[14px] text-black font-extrabold gap-1" style={{ gridTemplateColumns: '1fr 118px 104px 104px 112px' }}>
      <div className="flex border-2 border-gray-800 w-full h-full justify-center items-center text-center px-3 py-1 rounded-md">ITEM</div>
      <div className="flex border-2 border-gray-800 w-full h-full justify-center items-center text-center px-3 py-1 rounded-md">UNIDAD</div>
      <div className="flex border-2 border-gray-800 w-full h-full justify-center items-center text-center px-3 py-1 rounded-md">STOCK OFIC.</div>
      <div className="flex border-2 border-gray-800 w-full h-full justify-center items-center text-center px-3 py-1 rounded-md">CANT. PED.</div>
      <div className="flex border-2 border-gray-800 w-full h-full justify-center items-center text-center px-3 py-1 rounded-md">CANT. ACEP.</div>
    </div>
  )
}
