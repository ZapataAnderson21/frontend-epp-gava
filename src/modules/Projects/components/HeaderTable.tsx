export default function HeaderTable() {
  return (
    <div className="flex flex-row items-center justify-between w-full pt-4 px-6 font-bold gap-4 text-[14px] md:text-[16px]">
      <span className="flex items-center justify-start w-6">
        <a href="#">ID</a>
      </span>
      <span className="flex items-start justify-start w-48">
        <a href="#">NOMBRE</a>
      </span>
      <span className="flex items-center justify-start w-24">
        <a href="#">CÓDIGO</a>
      </span>
      <span className="flex items-center justify-start w-12 md:w-24">
        <a href="#">ESTADO</a>
      </span>
    </div>
  )
}