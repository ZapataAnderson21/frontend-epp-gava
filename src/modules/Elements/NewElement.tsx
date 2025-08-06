import { useState } from "react";
import RedButton from "../../components/RedButton";
import { fetchCreateElement } from "../../data/elementData";
import { useNavigate } from "react-router-dom";
import SaveModal from "../../components/SaveModal";

export default function NewEpp() {

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");

  const [openSaveModal, setOpenSaveModal] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetchCreateElement({ name, type, description });

      if (response.statusCode === 201) {
        setOpenSaveModal(true);
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (error) {
      console.error("Error creating element:", error);
      alert("Ocurrió un error al registrar el elemento");
    }
  };


  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
          <h1 className="text-2xl font-bold mb-4">REGISTRAR ELEMENTO</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
          <form className="flex flex-col gap-4 w-full max-w-md"  onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold">Nombre</label>
              <input type="text" id="name" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="font-semibold">Descripción</label>
              <textarea id="description" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="type" className="font-semibold">Tipo</label>
              <select id="type" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="" disabled selected>Seleccione un tipo</option>
                <option value="security">Elementos de Protección Personal (EPP)</option>
                <option value="operative">Elementos Operativos</option>
              </select>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href="/admin/elements" name="Cancelar" />
              <button type="submit" className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Registrar</button>
            </div>
          </form>
        </div>
      </div>
      {
        openSaveModal && (
          <SaveModal onOk={() => {
            navigate(`/admin/elements/type/${type}`);
            localStorage.removeItem("name");
            localStorage.removeItem("description");
            localStorage.removeItem("type");
          }} />
        )
      }
    </>
  );
}