import RedButton from "../../RedButton";


export default function NewProject() {
  
  return (
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
          <h1 className="text-2xl font-bold mb-4">REGISTRAR PROYECTO</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
          <form className="flex flex-col gap-4 w-full max-w-md">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold">Nombre</label>
              <input type="text" id="name" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="code" className="font-semibold">Código</label>
              <input type="text" id="code" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="font-semibold">Descripción <span className="text-[10px] font-bold"> (opcional)</span></label>
              <textarea id="description" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" />
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href="/admin/projects" name="Cancelar" />
              <button type="submit" className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Registrar</button>
            </div>
          </form>
        </div>
      </div>
    );
}
