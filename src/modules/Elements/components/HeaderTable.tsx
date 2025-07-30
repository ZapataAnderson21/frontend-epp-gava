export default function HeaderTable() {
  return (
    <div className="flex flex-row items-center justify-between md:justify-start w-full pt-4 px-6 font-bold gap-4 text-[14px] md:text-[16px]">
      <span className="flex items-center justify-start w-18 md:w-[10%]">
        <a href="#">ID</a>
      </span>
      <span className="flex items-start justify-start w-full md:w-[20%]">
        <a href="#">NOMBRE</a>
      </span>
      <span className="flex items-center justify-start w-56 md:w-[15%]">
        <a href="#">TIPO</a>
      </span>
      <span className="hidden md:flex items-center justify-start w-full md:w-[55%]">
        <a href="#">DESCRIPCIÓN</a>
      </span>
    </div>
  )
}