import { useEffect, useState } from "react";
import RedButton from "../../components/RedButton";
import { fetchGetOne, fetchUpdateElement, type UpdateElementDto } from "../../data/elementData";
import { useNavigate, useParams } from "react-router-dom";

export default function Element() {

  const elementId = useParams<{ id: string }>().id ? Number(useParams<{ id: string }>().id) : 0;

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const getElement = async () => {
      try {
        const response = await fetchGetOne(elementId);
        if (response.statusCode === 200 && response.data) {
          const elementData = response.data;
          setName(elementData.name);
          setType(elementData.type);
          setDescription(elementData.description);
        } else {
          console.error("Error fetching element data:", response.message || "Unknown error");
        }
      } catch (error) {
        console.error("Error fetching element data:", error);
      }
    };

    getElement();
  }, [elementId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: UpdateElementDto = {
      name,
      type,
      description
    };

    try {
      const response = await fetchUpdateElement(elementId, updatedData);
      
      if (response.statusCode === 200) {
        navigate(`/admin/elements/type/${type}`);
      } else {
        console.error("Error updating element:", response.message || "Unknown error");
      }


    } catch (error) {
      console.error("Error updating element:", error);
    }
  };

  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
        <h1 className="text-2xl font-bold mb-4">ELEMENTO {elementId}</h1>
      </div>
      <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
        <form className="flex flex-col gap-4 w-full max-w-md" onSubmit={handleUpdate}>
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-semibold">Nombre</label>
            <input type="text" id="name" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="type" className="font-semibold">Tipo</label>
            <select name="type" id="type" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="security">EPP</option>
              <option value="operative">Operativo</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="font-semibold">Descripción</label>
            <textarea id="description" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
            <RedButton href={`/admin/elements/type/${type}`} name="Regresar" />
            <button type="submit" className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Actualizar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
