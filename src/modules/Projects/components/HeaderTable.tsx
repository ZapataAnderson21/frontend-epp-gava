export default function HeaderTable() {
  return (
    <div className="flex flex-row items-center justify-between min-w-full p-4  rounded-t-lg font-extrabold gap-4 bg-gray-100">
      <span className="flex items-center justify-start min-w-18">
        <a href="#">ID</a>
      </span>
      <span className="flex items-start justify-start min-w-42">
        <a href="#">NOMBRE</a>
      </span>
      <span className="flex items-center justify-start min-w-36">
        <a href="#">CÓDIGO</a>
      </span>
      <span className="flex items-center justify-start min-w-28">
        <a href="#">ESTADO</a>
      </span>
    </div>
  )
}