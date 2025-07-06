export default function HeaderTable() {
  return (
    <div className="flex flex-row items-center justify-between w-full pt-4 px-6 font-bold gap-4 text-[14px] md:text-[16px]">
      <span className="flex items-center justify-start w-12">
        <a href="#">ID</a>
      </span>
      <span className="flex items-start justify-start w-32">
        <a href="#">FyH DE REG</a>
      </span>
      <span className="hidden sm:flex items-center justify-start w-24">
        <a href="#">SOLICITANTE</a>
      </span>
      <span className="flex items-center justify-start w-32">
        <a href="#">FyH DE ENTR</a>
      </span>
      <span className="flex items-center justify-start w-12 md:w-24">
        <a href="#">ESTADO</a>
      </span>
    </div>
  )
}