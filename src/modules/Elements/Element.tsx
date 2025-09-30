import { useEffect, useState } from "react";
import RedButton from "../../common/form/RedButton";
import { type UpdateElementDto, type ElementType } from "../../data/types";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSkeletonForm from "../../common/LoadingSkeletonForm";
import SaveModal from "../../common/form/SaveModal";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import { elementApi } from "../../data/apiUrl";

export default function Element() {
  const elementId = Number(useParams<{ id: string }>().id ?? 0);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const { data: element, loading, error: fetchError } = useFetch<ElementType>(`${elementApi}${elementId}`);

  const { execute: updateElement, loading: updating } = useApiAction<ElementType>();

  useEffect(() => {
    if (element) {
      setName(element.name);
      setType(element.type);
      setDescription(element.description);
    }
  }, [element]);

  const closeModalAndReset = () => {
    setSuccessMessage("");
    setError(false);
    setOpenSaveModal(false);
  };

  const navigateToElements = () => {
    setSuccessMessage("");
    setError(false);
    setOpenSaveModal(false);
    navigate(`/admin/elements/type/${type}/`);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSaveModal(true);

    const updatedData: UpdateElementDto = { name, type, description };
    const response = await updateElement(`${elementApi}/${elementId}`, "PATCH", updatedData);

    setSuccessMessage(response.message);

    if (response.statusCode !== 200) {
      setError(true);
      setOnOk(() => () => closeModalAndReset());
    } else {
      setError(false);
      setOnOk(() => () => navigateToElements());
    }
  };

  if (loading) return <LoadingSkeletonForm numberRows={3} />;
  if (fetchError) return <div className="text-red-500">{fetchError}</div>;

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <h1 className="text-2xl font-bold mb-4">ELEMENTO {elementId}</h1>

        <form className="flex flex-col gap-4 w-full max-w-2xl" onSubmit={handleUpdate}>
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-semibold">Nombre</label>
            <input type="text" id="name" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="type" className="font-semibold">Tipo</label>
            <select id="type" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={type} onChange={(e) => setType(e.target.value)}>
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
            <button type="submit" disabled={updating} className="w-full bg-[#0047a3] px-4 py-3 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">
              {updating ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </form>
      </div>

      {openSaveModal && (
        <SaveModal onOk={onOk} message={successMessage} error={error} />
      )}
    </>
  );
}
