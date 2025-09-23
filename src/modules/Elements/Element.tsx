import { useEffect, useState } from "react";
import RedButton from "../../components/RedButton";
import { fetchGetOne, fetchUpdateElement, type UpdateElementDto } from "../../data/elementData";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSkeletonForm from "../../common/LoadingSkeletonForm";
import SaveModal from "../../components/SaveModal";

export default function Element() {

  const elementId = useParams<{ id: string }>().id ? Number(useParams<{ id: string }>().id) : 0;

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [onOk, setOnOk] = useState<() => void>(() => () => {});
  
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const response = await fetchGetOne(Number(elementId));
      const responseData = await response.json();

      setSuccessMessage(responseData.message);

      if (responseData.statusCode === 200) {
        setName(responseData.data.name);
        setType(responseData.data.type);
        setDescription(responseData.data.description);
        setLoading(false);
      } else {
        setError(true);
        setLoading(false);
      }
    }

    fetchData();
  }, [elementId]);

  const closeModalAndReset = () => {
    setSuccessMessage("");
    setError(false);
    setOpenSaveModal(false);
  }

  const navigateToElements = () => {
    setSuccessMessage("");
    setError(false);
    setOpenSaveModal(false);
    navigate(`/admin/elements/type/${type}/`);
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setOpenSaveModal(true);

    const updatedData: UpdateElementDto = {
      name,
      type,
      description
    };

    const response = await fetchUpdateElement(elementId, updatedData);
    const responseData = await response.json();

    setError(false);
    setSuccessMessage(responseData.message);

    if (responseData.statusCode !== 200) {
      setError(true);
      setOnOk(() => () => closeModalAndReset());
    } else {
      setError(false);
      setOnOk(() => () => navigateToElements());
    }
  };

  if (loading) {
    return (
      <LoadingSkeletonForm numberRows={3} />
    );
  }

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full">
          <h1 className="text-2xl font-bold mb-4">ELEMENTO {elementId}</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-gray-600">
          <form className="flex flex-col gap-4 w-full max-w-2xl" onSubmit={handleUpdate}>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold">Nombre</label>
              <input type="text" id="name" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="type" className="font-semibold">Tipo</label>
              <select name="type" id="type" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="security">EPP</option>
                <option value="operative">Operativo</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="font-semibold">Descripción</label>
              <textarea id="description" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href={`/admin/elements/type/${type}`} name="Regresar" />
              <button type="submit" className="w-full bg-[#0047a3] px-4 py-3 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Actualizar</button>
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
  )
}
