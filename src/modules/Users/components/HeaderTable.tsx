export default function HeaderTable() {
  return (
    <div className="flex flex-row items-center justify-between min-w-full p-4 pl-6 rounded-t-lg font-extrabold gap-4 bg-gray-100">
      <span className="flex items-start justify-start min-w-28">
        <a href="#">NOMBRE</a>
      </span>
      <span className="flex items-start justify-start min-w-36">
        <a href="#">APELLIDO</a>
      </span>
      <span className="flex items-start justify-start min-w-48">
        <a href="#">CORREO</a>
      </span>
      <span className="flex items-center justify-start min-w-36">
        <a href="#">ROL</a>
      </span>
    </div>
  )
}