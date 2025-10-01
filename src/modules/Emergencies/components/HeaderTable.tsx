export default function HeaderTable() {
  return (
    <div className="flex flex-row items-center justify-between w-full pt-4 px-6 font-bold gap-4">
      <span className="flex items-center justify-start w-[10%]">
        <a href="#">ID</a>
      </span>
      <span className="flex items-start justify-start w-[40%]">
        <a href="#">ASUNTO</a>
      </span>
      <span className="flex items-start justify-start w-[30%]">
        <a href="#">PROYECTO</a>
      </span>
      <span className="flex items-center justify-start w-[20%]">
        <a href="#">SOLICITANTE</a>
      </span>
    </div>
  )
}