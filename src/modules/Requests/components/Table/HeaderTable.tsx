export default function HeaderTable() {
  return (
    <div className="flex flex-row items-center justify-between min-w-full p-4 pl-6 rounded-t-lg font-extrabold gap-4 bg-gray-100">
      <span className="flex items-center justify-start min-w-16">
        <a href="#">ID</a>
      </span>
      <span className="flex items-start justify-start min-w-48">
        <a href="#">FyH DE REG</a>
      </span>
      <span className="flex items-center justify-start min-w-42">
        <a href="#">SOLICITANTE</a>
      </span>
      <span className="flex items-center justify-start min-w-48">
        <a href="#">FyH DE ENTR</a>
      </span>
      <span className="flex items-center justify-start min-w-32">
        <a href="#">ESTADO</a>
      </span>
    </div>
  )
}