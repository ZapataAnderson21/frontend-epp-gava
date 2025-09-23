import { useState } from "react";
import RedButton from "../../components/RedButton";
import { fetchCreateElement } from "../../data/elementData";
import { useNavigate } from "react-router-dom";
import SaveModal from "../../components/SaveModal";

export default function NewEpp() {

  const typeRoot = new URLSearchParams(window.location.search).get('type') || '';

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(typeRoot);

  const [error, setError] = useState(false);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();

  const closeModalAndReset = () => {
    setOpenSaveModal(false);
    setError(false);
  }

  const navigateToElements = () => {
    if(type) {
      if(type === "security") {
        navigate("/admin/elements/type/security");
      } else if(type === "operative") {
        navigate("/admin/elements/type/operative");
      }
    } else {
      navigate("/admin/elements/type/all");
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setOpenSaveModal(true);

    const elementData = {
      name,
      type,
      description
    }

    const response = await fetchCreateElement(elementData);
    const responseData = await response.json();

    setError(false);
    setSuccessMessage(responseData.message);


    if (responseData.statusCode !== 201) {
        setError(true);
        setOnOk(() => () => closeModalAndReset());
    }else {
        setOnOk(() => () => navigateToElements());
    }
  };

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full">
          <h1 className="text-2xl font-bold mb-4">REGISTRAR ELEMENTO</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-gray-600">
          <form className="flex flex-col gap-4 w-full max-w-2xl"  onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold">Nombre</label>
              <input type="text" id="name" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="font-semibold">Descripción</label>
              <textarea id="description" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="type" className="font-semibold">Tipo</label>
              <select id="type" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="" disabled selected>Seleccione un tipo</option>
                <option value="security">Elementos de Protección Personal (EPP)</option>
                <option value="operative">Elementos Operativos</option>
              </select>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href={`/admin/elements/type/${type}`} name="Cancelar" /> 
              <button type="submit" className="w-full bg-[#0047a3] px-4 py-3 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Registrar</button>
            </div>
          </form>
        </div>
      </div>
      {
        openSaveModal && (
          <SaveModal onOk={onOk} message={successMessage} error={error} />
        )
      }
    </>
  );
}