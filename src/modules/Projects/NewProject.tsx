import { useState } from "react";
import RedButton from "../../components/RedButton";
import { fetchCreateProject } from "../../data/projectData";
import { useNavigate } from "react-router-dom";
import SaveModal from "../../components/SaveModal";

export default function NewProject() {

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setOpenSaveModal(true);
    setLoading(true);
    setError("");

    const projectData = {
      name,
      code,
      description
    };

    const response = await fetchCreateProject(projectData);
    const responseData = await response.json();

    switch (responseData.statusCode) {
      case 201:
        setSuccessMessage(responseData.message || "Proyecto creado exitosamente");
        setLoading(false);
        break;
      default:
        setError(responseData.message || "Error desconocido");
        setLoading(false);
        break;
    }

    setLoading(false);
  };

  if(error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-gray-800 p-10">
        <div className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-[#003a80]">
          <h1 className="text-2xl font-bold">Error</h1>
          <p>{error}</p>
          <button
            className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003a80] transition-colors cursor-pointer"
            onClick={() => setError("")}
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
      <>
        <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
          <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
            <h1 className="text-2xl font-bold mb-4">REGISTRAR PROYECTO</h1>
          </div>
          <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
            <form className="flex flex-col gap-4 w-full max-w-md" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="font-semibold">Nombre</label>
                <input type="text" id="name" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="code" className="font-semibold">Código</label>
                <input type="text" id="code" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="font-semibold">Descripción <span className="text-[10px] font-bold"> (opcional)</span></label>
                <textarea id="description" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
                <RedButton href="/admin/projects" name="Cancelar" />
                <button type="submit" className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Registrar</button>
              </div>
            </form>
          </div>
        </div>
        {
          openSaveModal && (
            <SaveModal onOk={() => navigate("/admin/projects")} message={successMessage} loading={loading} />
          )
        }
      </>
    );
}
